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

/** @type {Record<string, string>} */
const DEFAULT_GUIDES = {
	hma: 'Descreva cronologia, fatores de melhora/piora, intensidade, sintomas associados e impacto funcional.',
	revisao_sistemas:
		'Registre sinais e sintomas por sistemas, destacando positivos e negativos relevantes para o raciocínio clínico.',
	ocupacional:
		'Inclua ocupação atual, exposições, carga física, ergonomia, afastamentos e relação com sintomas.',
	psicossocial:
		'Explore contexto familiar, suporte social, moradia, renda, estressores, espiritualidade e segurança.',
	habitos: 'Documente sono, atividade física, alimentação, etilismo, tabagismo, drogas e sexualidade quando pertinente.'
};

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function GET(event) {
	try {
		const db = getDb(event);
		if (!db) {
			return json({ guides: DEFAULT_GUIDES, warning: 'D1 local ainda não está disponível neste runtime.' });
		}

		const result = await db.prepare('SELECT secao, conteudo FROM guias_consulta').all();
		const guides = { ...DEFAULT_GUIDES };
		for (const entry of result.results ?? []) {
			const row = /** @type {{ secao?: string; conteudo?: string }} */ (entry);
			if (typeof row.secao === 'string' && typeof row.conteudo === 'string') {
				guides[row.secao] = row.conteudo;
			}
		}

		return json({ guides });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({
				guides: DEFAULT_GUIDES,
				warning: 'Tabela "guias_consulta" não encontrada. Execute a migração do schema.'
			});
		}
		const message = error instanceof Error ? error.message : 'Erro ao carregar guias';
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
		const secao = body?.secao?.trim();
		const conteudo = body?.conteudo?.trim();

		if (!secao || !conteudo) {
			return json({ error: 'Seção e conteúdo são obrigatórios.' }, { status: 400 });
		}

		await db
			.prepare(
				'INSERT INTO guias_consulta (secao, conteudo) VALUES (?, ?) ON CONFLICT(secao) DO UPDATE SET conteudo = excluded.conteudo'
			)
			.bind(secao, conteudo)
			.run();

		return json({ ok: true });
	} catch (error) {
		if (isTableMissingError(error)) {
			return json({ error: 'Tabela "guias_consulta" não existe. Execute as migrações.' }, { status: 503 });
		}
		const message = error instanceof Error ? error.message : 'Erro ao salvar guia';
		return json({ error: message }, { status: 500 });
	}
}
