import { json } from '@sveltejs/kit';

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
function getDb(event) {
	return event.platform?.env?.DB ?? null;
}

/**
 * Obtém todas as áreas e calculadoras
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function GET(event) {
	try {
		const db = getDb(event);
		if (!db) {
			return json({ areas: [], calculadoras: [], warning: 'D1 não está disponível' });
		}

		const resultAreas = await db.prepare('SELECT * FROM areas_clinicas ORDER BY nome ASC').all();
		const resultCalc = await db.prepare('SELECT * FROM calculadoras_risco ORDER BY nome ASC').all();

		return json({
			areas: resultAreas.results ?? [],
			calculadoras: resultCalc.results ?? []
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erro ao buscar calculadoras';
		return json({ error: message }, { status: 500 });
	}
}

/**
 * Cria uma nova área clínica ou calculadora de risco
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function POST(event) {
	try {
		const db = getDb(event);
		if (!db) {
			return json({ error: 'D1 não configurado' }, { status: 503 });
		}

		const body = await event.request.json();
		
		if (body.tipo === 'area') {
			if (!body.nome || !body.nome.trim()) {
				return json({ error: 'Nome da área é obrigatório.' }, { status: 400 });
			}
			
			const result = await db.prepare('INSERT INTO areas_clinicas (nome) VALUES (?) RETURNING *')
				.bind(body.nome.trim())
				.run();
				
			return json({ success: true, item: result.results[0] });
		} 
		else if (body.tipo === 'calculadora') {
			if (!body.area_id || !body.nome || !body.link) {
				return json({ error: 'Campos obrigatórios: área, nome e link.' }, { status: 400 });
			}
			
			const result = await db.prepare('INSERT INTO calculadoras_risco (area_id, nome, descricao, link) VALUES (?, ?, ?, ?) RETURNING *')
				.bind(body.area_id, body.nome.trim(), (body.descricao || '').trim(), body.link.trim())
				.run();
				
			return json({ success: true, item: result.results[0] });
		}
		
		return json({ error: 'Tipo de operação inválida' }, { status: 400 });

	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erro ao salvar';
		return json({ error: message }, { status: 500 });
	}
}
