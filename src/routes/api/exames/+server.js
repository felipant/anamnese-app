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
		const pacote = event.url.searchParams.get('pacote')?.trim() ?? '';
		const filter = pacote ? `%${pacote}%` : null;
		if (!db) {
			return json({
				exames: [],
				warning: 'D1 local ainda não está disponível neste runtime.'
			});
		}
		const stmt = pacote
			? db
					.prepare(
						'SELECT id, material, nome, pacote, unidade_medida, valores_referencia FROM exames WHERE COALESCE(pacote, "") LIKE ? ORDER BY nome ASC'
					)
					.bind(filter)
			: db.prepare(
					'SELECT id, material, nome, pacote, unidade_medida, valores_referencia FROM exames ORDER BY nome ASC'
				);
		const result = await stmt.all();

		return json({ exames: result.results ?? [] });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({
				exames: [],
				warning: 'Tabela "exames" não encontrada. Execute a migração do schema.'
			});
		}
		const message = error instanceof Error ? error.message : 'Erro ao listar exames';
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
		const material = body?.material?.trim();
		const nome = body?.nome?.trim();
		const pacote = body?.pacote?.trim() ?? '';
		const unidadeMedida = body?.unidade_medida?.trim() ?? '';
		const valoresReferencia = body?.valores_referencia?.trim() ?? '';

		if (!material || !nome) {
			return json({ error: 'Material e nome são obrigatórios.' }, { status: 400 });
		}

		const insert = await db
			.prepare(
				'INSERT INTO exames (material, nome, pacote, unidade_medida, valores_referencia) VALUES (?, ?, ?, ?, ?)'
			)
			.bind(material, nome, pacote, unidadeMedida, valoresReferencia)
			.run();

		return json({
			ok: true,
			id: insert.meta?.last_row_id ?? null
		});
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "exames" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao criar exame';
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
		const material = body?.material?.trim();
		const nome = body?.nome?.trim();
		const pacote = body?.pacote?.trim() ?? '';
		const unidadeMedida = body?.unidade_medida?.trim() ?? '';
		const valoresReferencia = body?.valores_referencia?.trim() ?? '';

		if (!id || !material || !nome) {
			return json({ error: 'ID, material e nome são obrigatórios.' }, { status: 400 });
		}

		await db
			.prepare(
				'UPDATE exames SET material = ?, nome = ?, pacote = ?, unidade_medida = ?, valores_referencia = ? WHERE id = ?'
			)
			.bind(material, nome, pacote, unidadeMedida, valoresReferencia, id)
			.run();

		return json({ ok: true });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "exames" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao atualizar exame';
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

		const existing = await db.prepare('SELECT id FROM exames WHERE id = ?').bind(id).first();
		if (!existing?.id) {
			return json({ error: 'Exame não encontrado.' }, { status: 404 });
		}

		await db.prepare('DELETE FROM exames WHERE id = ?').bind(id).run();
		return json({ ok: true });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "exames" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao excluir exame';
		return json({ error: message }, { status: 500 });
	}
}
