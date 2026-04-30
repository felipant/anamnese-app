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
			return json({ items: [], total: 0, page, limit, totalPages: 1, warning: 'D1 indisponível.' });
		}

		const filter = `%${q}%`;
		const countStmt = q
			? db.prepare('SELECT COUNT(*) AS total FROM procedimentos WHERE descricao LIKE ?').bind(filter)
			: db.prepare('SELECT COUNT(*) AS total FROM procedimentos');

		const listStmt = q
			? db
					.prepare(
						'SELECT id, descricao, valor FROM procedimentos WHERE descricao LIKE ? ORDER BY descricao ASC LIMIT ? OFFSET ?'
					)
					.bind(filter, limit, offset)
			: db
					.prepare('SELECT id, descricao, valor FROM procedimentos ORDER BY descricao ASC LIMIT ? OFFSET ?')
					.bind(limit, offset);

		const [countResult, listResult] = await Promise.all([countStmt.first(), listStmt.all()]);
		const total = Number(countResult?.total ?? 0);
		return json({ items: listResult.results ?? [], total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({
				items: [],
				total: 0,
				page: 1,
				limit: 50,
				totalPages: 1,
				warning: 'Tabela "procedimentos" não encontrada. Execute a migração.'
			});
		}
		const message = error instanceof Error ? error.message : 'Erro ao listar procedimentos';
		return json({ error: message }, { status: 500 });
	}
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function POST(event) {
	try {
		const db = getDb(event);
		if (!db) return json({ error: 'D1 não configurado.' }, { status: 503 });
		const body = await event.request.json();
		const descricao = body?.descricao?.trim();
		const valorRaw = body?.valor;
		const valor = valorRaw === '' || valorRaw === null || valorRaw === undefined ? null : Number(valorRaw);
		if (!descricao) return json({ error: 'Descrição é obrigatória.' }, { status: 400 });

		const result = await db
			.prepare('INSERT INTO procedimentos (descricao, valor) VALUES (?, ?)')
			.bind(descricao, Number.isNaN(valor) ? null : valor)
			.run();
		return json({ ok: true, id: result.meta?.last_row_id ?? null });
	} catch (error) {
		if (isTableMissingError(error)) return json({ error: 'Tabela "procedimentos" não existe.' }, { status: 503 });
		const message = error instanceof Error ? error.message : 'Erro ao criar procedimento';
		return json({ error: message }, { status: 500 });
	}
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function PUT(event) {
	try {
		const db = getDb(event);
		if (!db) return json({ error: 'D1 não configurado.' }, { status: 503 });
		const body = await event.request.json();
		const id = Number(body?.id);
		const descricao = body?.descricao?.trim();
		const valorRaw = body?.valor;
		const valor = valorRaw === '' || valorRaw === null || valorRaw === undefined ? null : Number(valorRaw);
		if (!id || !descricao) return json({ error: 'ID e descrição são obrigatórios.' }, { status: 400 });

		await db
			.prepare('UPDATE procedimentos SET descricao = ?, valor = ? WHERE id = ?')
			.bind(descricao, Number.isNaN(valor) ? null : valor, id)
			.run();
		return json({ ok: true });
	} catch (error) {
		if (isTableMissingError(error)) return json({ error: 'Tabela "procedimentos" não existe.' }, { status: 503 });
		const message = error instanceof Error ? error.message : 'Erro ao atualizar procedimento';
		return json({ error: message }, { status: 500 });
	}
}
