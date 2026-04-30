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
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function GET(event) {
	try {
		const db = getDb(event);
		const page = Math.max(Number(event.url.searchParams.get('page') ?? '1'), 1);
		const limit = Math.min(Math.max(Number(event.url.searchParams.get('limit') ?? '50'), 1), 200);
		const offset = (page - 1) * limit;
		const q = event.url.searchParams.get('q')?.trim() ?? '';
		if (!db) {
			return json({
				items: [],
				total: 0,
				page,
				limit,
				totalPages: 1,
				warning: 'D1 local ainda não está disponível neste runtime.'
			});
		}

		const filter = `%${q}%`;
		const countStmt = q
			? db
					.prepare(
						`SELECT COUNT(*) AS total
						 FROM medicamentos
						 WHERE principio_ativo LIKE ? OR classe LIKE ? OR concentracao LIKE ? OR forma_farmaceutica LIKE ?`
					)
					.bind(filter, filter, filter, filter)
			: db.prepare('SELECT COUNT(*) AS total FROM medicamentos');

		const listStmt = q
			? db
					.prepare(
						`SELECT id, principio_ativo, concentracao, forma_farmaceutica, unidade_fornecimento, fornecimento_sus, classe
						 FROM medicamentos
						 WHERE principio_ativo LIKE ? OR classe LIKE ? OR concentracao LIKE ? OR forma_farmaceutica LIKE ?
						 ORDER BY principio_ativo ASC
						 LIMIT ? OFFSET ?`
					)
					.bind(filter, filter, filter, filter, limit, offset)
			: db.prepare(
					`SELECT id, principio_ativo, concentracao, forma_farmaceutica, unidade_fornecimento, fornecimento_sus, classe
					 FROM medicamentos
					 ORDER BY principio_ativo ASC
					 LIMIT ? OFFSET ?`
				).bind(limit, offset);

		const [countResult, listResult] = await Promise.all([countStmt.first(), listStmt.all()]);
		const total = Number(countResult?.total ?? 0);
		return json({
			items: listResult.results ?? [],
			total,
			page,
			limit,
			totalPages: Math.max(Math.ceil(total / limit), 1)
		});
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({
				items: [],
				total: 0,
				page: 1,
				limit: 50,
				totalPages: 1,
				warning: 'Tabela "medicamentos" não encontrada. Execute a migração do schema.'
			});
		}
		const message = error instanceof Error ? error.message : 'Erro ao listar medicamentos';
		return json({ error: message }, { status: 500 });
	}
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

		const body = await event.request.json();
		const principioAtivo = body?.principio_ativo?.trim();
		const formaFarmaceutica = body?.forma_farmaceutica?.trim() ?? '';
		const concentracao = body?.concentracao?.trim() ?? '';
		const unidadeFornecimento = body?.unidade_fornecimento?.trim() ?? '';
		const fornecimentoSus = body?.fornecimento_sus?.trim() ?? '';
		const classe = body?.classe?.trim() ?? '';

		if (!principioAtivo) {
			return json({ error: 'Princípio ativo é obrigatório.' }, { status: 400 });
		}

		const result = await db
			.prepare(
				`INSERT INTO medicamentos (principio_ativo, forma_farmaceutica, concentracao, unidade_fornecimento, fornecimento_sus, classe)
				 VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(principioAtivo, formaFarmaceutica, concentracao, unidadeFornecimento, fornecimentoSus, classe)
			.run();

		return json({ ok: true, id: result.meta?.last_row_id ?? null });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "medicamentos" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao criar medicamento';
		return json({ error: message }, { status: 500 });
	}
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function PUT(event) {
	try {
		const db = getDb(event);
		if (!db) {
			return json(
				{ error: 'D1 local não configurado. Rode em runtime Cloudflare com binding DB.' },
				{ status: 503 }
			);
		}

		const body = await event.request.json();
		const id = Number(body?.id);
		const principioAtivo = body?.principio_ativo?.trim();
		const formaFarmaceutica = body?.forma_farmaceutica?.trim() ?? '';
		const concentracao = body?.concentracao?.trim() ?? '';
		const unidadeFornecimento = body?.unidade_fornecimento?.trim() ?? '';
		const fornecimentoSus = body?.fornecimento_sus?.trim() ?? '';
		const classe = body?.classe?.trim() ?? '';

		if (!id || !principioAtivo) {
			return json({ error: 'ID e princípio ativo são obrigatórios.' }, { status: 400 });
		}

		await db
			.prepare(
				`UPDATE medicamentos
				 SET principio_ativo = ?, forma_farmaceutica = ?, concentracao = ?, unidade_fornecimento = ?, fornecimento_sus = ?, classe = ?
				 WHERE id = ?`
			)
			.bind(principioAtivo, formaFarmaceutica, concentracao, unidadeFornecimento, fornecimentoSus, classe, id)
			.run();

		return json({ ok: true });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "medicamentos" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao atualizar medicamento';
		return json({ error: message }, { status: 500 });
	}
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function DELETE(event) {
	try {
		const db = getDb(event);
		if (!db) {
			return json(
				{ error: 'D1 local não configurado. Rode em runtime Cloudflare com binding DB.' },
				{ status: 503 }
			);
		}

		const id = Number(event.url.searchParams.get('id'));
		if (!id) {
			return json({ error: 'ID é obrigatório.' }, { status: 400 });
		}

		const existing = await db.prepare('SELECT id FROM medicamentos WHERE id = ?').bind(id).first();
		if (!existing?.id) {
			return json({ error: 'Medicamento não encontrado.' }, { status: 404 });
		}

		await db.prepare('DELETE FROM medicamentos WHERE id = ?').bind(id).run();
		return json({ ok: true });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "medicamentos" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao excluir medicamento';
		return json({ error: message }, { status: 500 });
	}
}
