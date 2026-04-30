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
 * Parser CSV com delimitador ',' e suporte a aspas.
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
 * @param {string} csvText
 */
function parseRenameCsv(csvText) {
	const lines = csvText
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
		headers.forEach((header, i) => {
			record[header] = cols[i] ?? '';
		});
		return record;
	});
}

/**
 * @param {Record<string, string>} row
 */
function mapMedicamento(row) {
	return {
		principioAtivo: (row.principio_ativo ?? row['princípio ativo'] ?? '').trim(),
		concentracao: (row['concentração'] ?? row['concentracao'] ?? '').trim(),
		forma: (row['forma farmacêutica'] ?? row['forma farmaceutica'] ?? '').trim(),
		unidadeFornecimento: (row.unidade_fornecimento ?? row['unidade de fornecimento'] ?? '').trim(),
		fornecimentoSus: (row.fornecimento_sus ?? row['fornecimento sus'] ?? '').trim()
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
			return json({ error: 'Envie o arquivo meds_final.csv no campo "file".' }, { status: 400 });
		}

		const rows = parseRenameCsv(await file.text());
		if (!rows.length) {
			return json({ error: 'CSV vazio ou inválido.' }, { status: 400 });
		}

		const statements = [];
		let validRows = 0;
		for (const row of rows) {
			const med = mapMedicamento(row);
			if (!med.principioAtivo) continue;
			validRows += 1;
			statements.push(
				db
					.prepare(
						`INSERT INTO medicamentos (principio_ativo, concentracao, forma_farmaceutica, unidade_fornecimento, fornecimento_sus)
						 VALUES (?, ?, ?, ?, ?)`
					)
					.bind(
						med.principioAtivo,
						med.concentracao,
						med.forma,
						med.unidadeFornecimento,
						med.fornecimentoSus
					)
			);
		}

		if (!statements.length) {
			return json({ error: 'Nenhuma linha válida encontrada no CSV.' }, { status: 400 });
		}

		// Usa batch para inserir em lote com melhor performance em arquivos extensos do RENAME.
		await db.batch(statements);
		return json({ ok: true, totalLinhas: rows.length, inseridos: validRows });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "medicamentos" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao importar medicamentos';
		return json({ error: message }, { status: 500 });
	}
}
