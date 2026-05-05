import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const SYSTEM_PROMPT = `Você é um assistente clínico de alto nível especializado em estruturar prontuários médicos não organizados no formato SOAP. O usuário enviará um texto bruto. Sua tarefa é reorganizar 100% dessas informações. REGRA DE OURO: NENHUM DADO, sintoma, queixa ou informação do texto original pode ser omitido, apagado ou esquecido, por mais irrelevante que pareça. Você deve devolver as informações em formato JSON estrito com 4 chaves: 'subjetivo', 'objetivo', 'avaliacao' e 'plano'. Formate o valor de cada chave em Markdown, usando bullet points para ser conciso e de rápida leitura. No campo 'subjetivo', agrupe obrigatoriamente as doenças prévias separando-as por sistemas do corpo humano (ex: Locomotor, Nervoso, etc.).`;

/**
 * @param {string} rawText
 */
function extractJsonPayload(rawText) {
	if (!rawText || typeof rawText !== 'string') {
		throw new Error('Resposta vazia do modelo.');
	}

	const fencedMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
	const candidate = fencedMatch ? fencedMatch[1] : rawText;
	const start = candidate.indexOf('{');
	const end = candidate.lastIndexOf('}');

	if (start === -1 || end === -1 || end <= start) {
		throw new Error('JSON não encontrado na resposta do modelo.');
	}

	return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * @param {string} texto
 */
async function callGemini(texto) {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error('GEMINI_API_KEY não configurada no ambiente.');
	}

	const endpoint =
		'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

	const response = await fetch(`${endpoint}?key=${apiKey}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			systemInstruction: {
				parts: [{ text: SYSTEM_PROMPT }]
			},
			contents: [
				{
					role: 'user',
					parts: [{ text: `Prontuário bruto:\n\n${texto}` }]
				}
			],
			generationConfig: {
				temperature: 0.1,
				topP: 0.8,
				responseMimeType: 'application/json'
			}
		})
	});

	if (!response.ok) {
		const details = await response.text();
		throw new Error(`Falha na API Gemini: ${response.status} - ${details}`);
	}

	const payload = await response.json();
	const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

	return extractJsonPayload(rawText);
}

function mockSoapResponse() {
	return {
		subjetivo: `- **Identificação:** Paciente adulto, sexo feminino.\n- **QP:** Cefaleia diária associada a cansaço.\n- **HMA:** Dor de cabeça há cerca de 3 meses, pior no fim do dia.\n- **Revisão de Sistemas:** Nega febre, vômitos e déficit focal.\n- **História Patológica Pregressa - Locomotor:** Sem dor articular relevante.\n- **História Patológica Pregressa - Nervoso:** Cefaleia recorrente; nega convulsões.\n- **História Patológica Pregressa - Endócrino:** Sem relato de diabetes.\n- **História Patológica Pregressa - Geniturinário:** Sem alterações urinárias.\n- **Medicamentos:** Dipirona eventual e losartana 50 mg/dia.\n- **História Familiar:** Mãe hipertensa.\n- **História Ocupacional:** Trabalho administrativo, longos períodos em tela.\n- **Psicossocial e Hábitos de vida:** Sono irregular, sedentarismo.`,
		objetivo: `- **Dados antropométricos:** IMC em sobrepeso (estimado).\n- **Exame físico:** Sem sinais neurológicos focais ao exame sumário.\n- **Exames complementares:** Sem exames laboratoriais recentes anexados.`,
		avaliacao: `- Cefaleia tensional crônica.\n- Cefaleia por uso excessivo de analgésicos.\n- Distúrbio do sono contribuindo para dor e fadiga.`,
		plano: `- Ajustar higiene do sono e reduzir uso indiscriminado de analgésicos.\n- Solicitar hemograma, TSH e glicemia para rastreio inicial.\n- Orientar diário da dor e retorno em 2-4 semanas.\n- Considerar encaminhamento para neurologia se sinais de alarme.`
	};
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function POST({ request }) {
	const body = await request.json();
	const texto = body?.texto;

	if (!texto || !texto.trim()) {
		return json({ error: 'Texto do prontuário é obrigatório.' }, { status: 400 });
	}

	try {
		const structured = await callGemini(texto);
		return json({
			subjetivo: structured?.subjetivo ?? '',
			objetivo: structured?.objetivo ?? '',
			avaliacao: structured?.avaliacao ?? '',
			plano: structured?.plano ?? ''
		});
	} catch (error) {
		const warning = error instanceof Error ? error.message : 'Falha desconhecida na integração';
		// Fallback de desenvolvimento para manter o fluxo funcional sem credenciais.
		await new Promise((resolve) => setTimeout(resolve, 1200));
		return json({
			...mockSoapResponse(),
			warning: `Modo simulado ativo: ${warning}`
		});
	}
}