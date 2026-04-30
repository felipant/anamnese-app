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
 * @param {string} value
 */
function normalizeHeader(value) {
	return value
		.replace(/^\uFEFF/, '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

/**
 * @param {string} headerLine
 */
function detectDelimiter(headerLine) {
	const candidates = [',', ';', '\t'];
	return candidates
		.map((delimiter) => ({ delimiter, count: parseCsvLine(headerLine, delimiter).length }))
		.sort((a, b) => b.count - a.count)[0]?.delimiter ?? ',';
}

/**
 * @param {string} csvText
 */
function parseCsv(csvText) {
	const lines = csvText
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	if (!lines.length) return [];

	const delimiter = detectDelimiter(lines[0]);
	const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
	return lines.slice(1).map((line, rowIndex) => {
		const cols = parseCsvLine(line, delimiter);
		/** @type {Record<string, string>} */
		const record = { __rowIndex: String(rowIndex + 2) };
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
		principioAtivo: (row.principio_ativo ?? row.principio_ativo_rename ?? row.principio ?? row.nome ?? '').trim(),
		concentracao: (row.concentracao ?? row.concentracao_apresentacao ?? row.apresentacao ?? '').trim(),
		forma: (row.forma_farmaceutica ?? row.forma ?? row.forma_farmaceutica_rename ?? '').trim(),
		unidadeFornecimento: (row.unidade_fornecimento ?? row.unidade_de_fornecimento ?? row.unidade ?? '').trim(),
		fornecimentoSus: (row.fornecimento_sus ?? row.fornecimento_no_sus ?? row.sus ?? '').trim(),
		classe: (row.classe ?? '').trim()
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
			return json({ error: 'Envie o arquivo meds_tabelado_com_classe.csv no campo "file".' }, { status: 400 });
		}

		const csvText = await file.text();
		const rows = parseCsv(csvText);
		if (!rows.length) {
			console.error('[upload-meds] CSV vazio ou sem linhas parseáveis', {
				fileName: file.name,
				fileSize: file.size
			});
			return json({ error: 'CSV vazio ou inválido.' }, { status: 400 });
		}

		const statements = [];
		let validRows = 0;
		for (const row of rows) {
			const med = mapMedicamento(row);
			if (!med.principioAtivo) {
				console.warn('[upload-meds] Linha ignorada sem princípio ativo', {
					rowIndex: row.__rowIndex,
					headers: Object.keys(row)
				});
				continue;
			}
			validRows += 1;
			statements.push(
				db
					.prepare(
						`INSERT INTO medicamentos (principio_ativo, concentracao, forma_farmaceutica, unidade_fornecimento, fornecimento_sus, classe)
						 VALUES (?, ?, ?, ?, ?, ?)`
					)
					.bind(
						med.principioAtivo,
						med.concentracao,
						med.forma,
						med.unidadeFornecimento,
						med.fornecimentoSus,
						med.classe
					)
			);
		}

		if (!statements.length) {
			console.error('[upload-meds] Nenhuma linha válida para inserir', {
				totalRows: rows.length,
				firstRowHeaders: Object.keys(rows[0] ?? {})
			});
			return json({ error: 'Nenhuma linha válida encontrada no CSV.' }, { status: 400 });
		}

		try {
			await db.batch(statements);
		} catch (error) {
			console.error('[upload-meds] Falha no db.batch ao inserir medicamentos', {
				fileName: file.name,
				totalRows: rows.length,
				validRows,
				firstRowHeaders: Object.keys(rows[0] ?? {}),
				error
			});
			throw error;
		}
		return json({ ok: true, totalLinhas: rows.length, inseridos: validRows });
	} catch (error) {
		console.error('[upload-meds] Erro inesperado na importação', error);
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "medicamentos" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao importar medicamentos';
		return json({ error: message }, { status: 500 });
	}
}
