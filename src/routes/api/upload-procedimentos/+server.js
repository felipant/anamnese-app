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
 * @param {string} line
 */
function parseCommaLine(line) {
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
		} else if (char === ',' && !inQuotes) {
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
	if (!lines.length) return [];
	const headers = parseCommaLine(lines[0]).map((h) => h.toLowerCase());
	return lines.slice(1).map((line) => {
		const cols = parseCommaLine(line);
		/** @type {Record<string, string>} */
		const record = {};
		headers.forEach((h, i) => {
			record[h] = cols[i] ?? '';
		});
		return record;
	});
}

/**
 * @param {Record<string, string>} row
 */
function mapProcedimento(row) {
	return {
		descricao: (row.descricao ?? row['descrição'] ?? '').trim(),
		valor: (row.valor ?? '').trim()
	};
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function POST(event) {
	try {
		const db = getDb(event);
		if (!db) return json({ error: 'D1 não configurado.' }, { status: 503 });
		const formData = await event.request.formData();
		const file = formData.get('file');
		if (!(file instanceof File)) {
			return json({ error: 'Envie o arquivo procedimentos.csv no campo "file".' }, { status: 400 });
		}

		const rows = parseCsv(await file.text());
		if (!rows.length) return json({ error: 'CSV vazio ou inválido.' }, { status: 400 });

		const statements = [];
		let inseridos = 0;
		for (const row of rows) {
			const item = mapProcedimento(row);
			if (!item.descricao) continue;
			inseridos += 1;
			const valor = item.valor ? Number(item.valor.replace(',', '.')) : null;
			statements.push(
				db
					.prepare('INSERT INTO procedimentos (descricao, valor) VALUES (?, ?)')
					.bind(item.descricao, Number.isNaN(valor) ? null : valor)
			);
		}

		if (!statements.length) return json({ error: 'Nenhuma linha válida no CSV.' }, { status: 400 });

		await db.batch(statements);
		return json({ ok: true, totalLinhas: rows.length, inseridos });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "procedimentos" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao importar procedimentos';
		return json({ error: message }, { status: 500 });
	}
}
