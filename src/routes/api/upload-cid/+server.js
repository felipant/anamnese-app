import { json } from '@sveltejs/kit';

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
function getDb(event) {
	return event.platform?.env?.DB ?? null;
}

/**
 * @param {unknown} error
 */
function isTableMissingError(error) {
	const message = error instanceof Error ? error.message.toLowerCase() : '';
	return message.includes('no such table');
}

/**
 * Parser CSV simples com suporte a aspas.
 * Delimitador é detectado automaticamente entre ";" e ",".
 * @param {string} line
 * @param {string} delimiter
 */
function parseCsvLine(line, delimiter) {
	const values = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i += 1) {
		const char = line[i];
		if (char === '"') {
			const next = line[i + 1];
			if (inQuotes && next === '"') {
				current += '"';
				i += 1;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === delimiter && !inQuotes) {
			values.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	values.push(current.trim());
	return values.map((v) => v.replace(/^"(.*)"$/, '$1'));
}

/**
 * @param {string} text
 */
function parseCsv(text) {
	const lines = text
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	if (!lines.length) {
		return [];
	}

	const delimiter = lines[0].includes(';') ? ';' : ',';
	const headers = parseCsvLine(lines[0], delimiter).map((h) => h.toLowerCase());

	return lines.slice(1).map((line) => {
		const row = parseCsvLine(line, delimiter);
		/** @type {Record<string, string>} */
		const record = {};
		headers.forEach((h, index) => {
			record[h] = row[index] ?? '';
		});
		return record;
	});
}

/**
 * @param {Record<string, string>} row
 */
function normalizeRow(row) {
	return {
		cap: (row.cap ?? row.capitulo ?? '').trim(),
		capDesc: (row.cap_desc ?? row.capitulo_desc ?? row.capítulo_desc ?? '').trim(),
		cat: (row.cat ?? row.categoria ?? '').trim(),
		catDesc: (row.cat_desc ?? row.categoria_desc ?? '').trim(),
		subcat: (row.subcat ?? row.codigo ?? row.código ?? '').trim(),
		subcatDesc: (row.subcat_desc ?? row.nome ?? row.descricao ?? row.descrição ?? '').trim(),
		grupo: (row.grupo ?? '').trim()
	};
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function POST(event) {
	try {
		const db = getDb(event);
		if (!db) {
			return json(
				{ error: 'D1 local não configurado. Rode em runtime Cloudflare com binding DB.' },
				{ status: 503 }
			);
		}
		const formData = await event.request.formData();
		const file = formData.get('file');

		if (!(file instanceof File)) {
			return json({ error: 'Envie um arquivo CSV válido no campo "file".' }, { status: 400 });
		}

		const text = await file.text();
		const rows = parseCsv(text);

		if (!rows.length) {
			return json({ error: 'CSV vazio ou inválido.' }, { status: 400 });
		}

		let insertedCapitulos = 0;
		let insertedCategorias = 0;
		let insertedDoencas = 0;

		/**
		 * Estratégia de resolução de FKs na importação:
		 * 1) Para cada linha, faz upsert lógico de capítulo por "cap" (texto único) e guarda seu id.
		 * 2) Faz upsert lógico de categoria por "cat" e associa com o id do capítulo.
		 * 3) Insere/atualiza doença por "subcat" associando com categoria_id.
		 * Isso evita duplicação de strings e mantém integridade relacional entre as 3 tabelas.
		 */
		for (const raw of rows) {
			const row = normalizeRow(raw);
			if (!row.cap || !row.cat || !row.subcat) {
				continue;
			}

			let capitulo = await db
				.prepare('SELECT id FROM cid_capitulos WHERE cap = ?')
				.bind(row.cap)
				.first();

			if (!capitulo) {
				await db
					.prepare('INSERT INTO cid_capitulos (cap, cap_desc) VALUES (?, ?)')
					.bind(row.cap, row.capDesc || row.cap)
					.run();
				insertedCapitulos += 1;
				capitulo = await db
					.prepare('SELECT id FROM cid_capitulos WHERE cap = ?')
					.bind(row.cap)
					.first();
			}

			const capituloId = capitulo?.id;
			if (!capituloId) {
				continue;
			}

			let categoria = await db
				.prepare('SELECT id FROM cid_categorias WHERE cat = ?')
				.bind(row.cat)
				.first();

			if (!categoria) {
				await db
					.prepare('INSERT INTO cid_categorias (cat, cat_desc, capitulo_id) VALUES (?, ?, ?)')
					.bind(row.cat, row.catDesc || row.cat, capituloId)
					.run();
				insertedCategorias += 1;
				categoria = await db
					.prepare('SELECT id FROM cid_categorias WHERE cat = ?')
					.bind(row.cat)
					.first();
			}

			const categoriaId = categoria?.id;
			if (!categoriaId) {
				continue;
			}

			const existente = await db
				.prepare('SELECT id FROM cid_doencas WHERE subcat = ?')
				.bind(row.subcat)
				.first();

			if (existente?.id) {
				await db
					.prepare(
						'UPDATE cid_doencas SET subcat_desc = ?, grupo = ?, categoria_id = ? WHERE subcat = ?'
					)
					.bind(row.subcatDesc || row.subcat, row.grupo, categoriaId, row.subcat)
					.run();
			} else {
				await db
					.prepare(
						'INSERT INTO cid_doencas (subcat, subcat_desc, grupo, categoria_id) VALUES (?, ?, ?, ?)'
					)
					.bind(row.subcat, row.subcatDesc || row.subcat, row.grupo, categoriaId)
					.run();
				insertedDoencas += 1;
			}
		}

		return json({
			ok: true,
			totalLinhas: rows.length,
			inseridos: {
				capitulos: insertedCapitulos,
				categorias: insertedCategorias,
				doencas: insertedDoencas
			}
		});
	} catch (error) {
		if (isTableMissingError(error)) {
			return json(
				{ error: 'Tabelas CID-10 não existem ainda. Execute a migração do schema.sql.' },
				{ status: 503 }
			);
		}
		const message = error instanceof Error ? error.message : 'Erro ao importar CID-10';
		return json({ error: message }, { status: 500 });
	}
}
