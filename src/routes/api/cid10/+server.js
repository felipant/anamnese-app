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
		const limit = Math.min(Math.max(Number(event.url.searchParams.get('limit') ?? '10'), 1), 50);
		const q = event.url.searchParams.get('q')?.trim() ?? '';
		const offset = (page - 1) * limit;
		if (!db) {
			return json({
				page,
				limit,
				total: 0,
				totalPages: 1,
				items: [],
				warning: 'D1 local ainda não está disponível neste runtime.'
			});
		}

		const filter = q ? `%${q}%` : null;

		const countStmt = q
			? db.prepare(
					`SELECT COUNT(*) AS total
					 FROM cid_doencas d
					 JOIN cid_categorias c ON c.id = d.categoria_id
					 JOIN cid_capitulos cp ON cp.id = c.capitulo_id
					 WHERE c.cat_desc LIKE ? OR d.subcat_desc LIKE ?`
				).bind(filter, filter)
			: db.prepare('SELECT COUNT(*) AS total FROM cid_doencas');

		const listStmt = q
			? db
					.prepare(
						`SELECT d.id, d.subcat, d.subcat_desc, d.grupo, c.cat, c.cat_desc
						 , cp.cap, cp.cap_desc
						 FROM cid_doencas d
						 JOIN cid_categorias c ON c.id = d.categoria_id
						 JOIN cid_capitulos cp ON cp.id = c.capitulo_id
						 WHERE c.cat_desc LIKE ? OR d.subcat_desc LIKE ?
						 ORDER BY c.cat_desc ASC, d.subcat ASC
						 LIMIT ? OFFSET ?`
					)
					.bind(filter, filter, limit, offset)
			: db
					.prepare(
						`SELECT d.id, d.subcat, d.subcat_desc, d.grupo, c.cat, c.cat_desc
						 , cp.cap, cp.cap_desc
						 FROM cid_doencas d
						 JOIN cid_categorias c ON c.id = d.categoria_id
						 JOIN cid_capitulos cp ON cp.id = c.capitulo_id
						 ORDER BY c.cat_desc ASC, d.subcat ASC
						 LIMIT ? OFFSET ?`
					)
					.bind(limit, offset);

		const [countResult, listResult] = await Promise.all([countStmt.first(), listStmt.all()]);
		const total = Number(countResult?.total ?? 0);

		return json({
			page,
			limit,
			total,
			totalPages: Math.max(Math.ceil(total / limit), 1),
			items: listResult.results ?? []
		});
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({
				page: 1,
				limit: 10,
				total: 0,
				totalPages: 1,
				items: [],
				warning: 'Tabelas CID-10 não encontradas. Execute a migração/importação.'
			});
		}
		const message = error instanceof Error ? error.message : 'Erro ao consultar CID-10';
		return json({ error: message }, { status: 500 });
	}
}
