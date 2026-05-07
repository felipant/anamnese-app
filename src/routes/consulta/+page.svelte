<script>
	import { onDestroy, onMount } from "svelte";
	import {
		consultaDraft,
		clearConsultaDraft,
		DISEASES_STORAGE_KEY,
		MEDICATIONS_STORAGE_KEY,
		LABORATORIO_STORAGE_KEY,
		IMAGEM_STORAGE_KEY,
	} from "$lib/consultaStore";
	import {
		loadFromLocalStorage,
		saveToLocalStorage,
	} from "$lib/useLocalStorage.js";

	/** @typedef {{ id: number; subcat: string; subcat_desc: string; grupo: string; cat: string; cat_desc: string; cap: string; cap_desc: string; }} CidSearchItem */
	/** @typedef {{ sourceId: number | null; principio_ativo: string; concentracao: string; classe: string; forma_farmaceutica: string; fornecimento_sus: string; observacoes: string; frequenciaTipo: string; diario: { manha: string; tarde: string; noite: string; }; semanal: string; intervalo: string; especial: string; doseQual: string; }} MedicationForm */
	/** @typedef {{ subcat: string; subcat_desc: string; cat: string; cat_desc: string; cap: string; cap_desc: string; mesAnoDiagnostico: string; historico: string; queixasAtuais: string; }} DiseaseForm */
	/** @typedef {{ id: string; mode: string; subcat: string; subcat_desc: string; cat: string; cat_desc: string; cap: string; cap_desc: string; mesAnoDiagnostico: string; historico: string; queixasAtuais: string; }} DiseaseItem */
	/** @typedef {{ id: number; principio_ativo: string; concentracao: string; forma_farmaceutica: string; unidade_fornecimento: string; fornecimento_sus: string; classe: string; }} MedicationSearchItem */
	/** @typedef {{ id: string; sourceId: number | null; principio_ativo: string; concentracao: string; classe: string; forma_farmaceutica: string; fornecimento_sus: string; observacoes: string; frequenciaTipo: string; diario: { manha: string; tarde: string; noite: string; }; semanal: string; intervalo: string; especial: string; doseQual: string; }} ConsultationMedication */
	/** @typedef {{ id: string; parentesco: string; idade: string; detalhes: string; }} FamilyHistoryRelative */
	/** @typedef {{ checked: boolean; parentes: FamilyHistoryRelative[]; detalhes: string; }} FamilyHistoryEntry */

	const generoOptions = ["Cis", "Trans", "Não-binário", "Outros"];
	const racaOptions = [
		"Preta",
		"Parda",
		"Branca",
		"Indígena",
		"Quilombola",
		"Outros",
	];
	const estadoCivilOptions = [
		"Solteiro(a)",
		"Casado(a)",
		"União estável",
		"Divorciado(a)",
		"Viúvo(a)",
		"Outros",
	];
	const escolaridadeOptions = [
		"Sem escolaridade formal",
		"Fundamental incompleto",
		"Fundamental completo",
		"Médio incompleto",
		"Médio completo",
		"Superior incompleto",
		"Superior completo",
		"Pós-graduação",
		"Outros",
	];
	const religiaoOptions = [
		"Católica",
		"Evangélica",
		"Espírita",
		"Religiões de matriz africana",
		"Sem religião",
		"Outros",
	];
	const familyHistoryOptions = [
		{ id: "dm1", label: "DM1" },
		{ id: "dm2", label: "DM2" },
		{ id: "has", label: "HAS" },
		{ id: "dac", label: "DAC" },
		{ id: "ave", label: "AVE" },
		{ id: "dislipidemia", label: "Dislipidemia" },
		{ id: "cancer", label: "Câncer" },
		{ id: "colelitiase", label: "Colelitíase" },
		{ id: "varizes", label: "Varizes" },
		{ id: "outros", label: "Outros" },
	];
	const chapterOptions = [
		{ cap: "I", cap_desc: "Algumas doenças infecciosas e parasitárias" },
		{ cap: "II", cap_desc: "Neoplasias" },
		{
			cap: "III",
			cap_desc:
				"Doenças do sangue, órgãos hematopoéticos e transtornos imunitários",
		},
		{
			cap: "IV",
			cap_desc: "Doenças endócrinas, nutricionais e metabólicas",
		},
		{ cap: "V", cap_desc: "Transtornos mentais e comportamentais" },
		{ cap: "VI", cap_desc: "Doenças do sistema nervoso" },
		{ cap: "VII", cap_desc: "Doenças do olho e anexos" },
		{ cap: "VIII", cap_desc: "Doenças do ouvido e da apófise mastoide" },
		{ cap: "IX", cap_desc: "Doenças do aparelho circulatório" },
		{ cap: "X", cap_desc: "Doenças do aparelho respiratório" },
		{ cap: "XI", cap_desc: "Doenças do aparelho digestivo" },
		{ cap: "XII", cap_desc: "Doenças da pele e tecido subcutâneo" },
		{
			cap: "XIII",
			cap_desc: "Doenças do sistema osteomuscular e tecido conjuntivo",
		},
		{ cap: "XIV", cap_desc: "Doenças do aparelho geniturinário" },
		{ cap: "XV", cap_desc: "Gravidez, parto e puerpério" },
		{
			cap: "XVI",
			cap_desc: "Algumas afecções originadas no período perinatal",
		},
		{
			cap: "XVII",
			cap_desc:
				"Malformações congênitas, deformidades e anomalias cromossômicas",
		},
		{
			cap: "XVIII",
			cap_desc: "Sintomas, sinais e achados anormais de exames",
		},
		{
			cap: "XIX",
			cap_desc:
				"Lesões, envenenamentos e outras consequências de causas externas",
		},
		{ cap: "XX", cap_desc: "Causas externas de morbidade e mortalidade" },
		{
			cap: "XXI",
			cap_desc:
				"Fatores que influenciam o estado de saúde e o contato com serviços",
		},
		{ cap: "XXII", cap_desc: "Códigos para propósitos especiais" },
	];
	/** @type {Record<string, string>} */
	const guideSectionLabels = {
		hma: "HMA",
		revisao_sistemas: "Revisão de Sistemas",
		ocupacional: "História Ocupacional",
		psicossocial: "História Psicossocial",
		habitos: "Hábitos de Vida",
		recordatorio_alimentar: "Recordatório Alimentar",
		// Exame Ginecológico
		mamas_palpacao: "Palpação das Mamas",
		genitalia_externa: "Exame da Genitália Externa",
		genitalia_interna: "Exame da Genitália Interna",
		genitalia_toque: "Toque Vaginal",
		// Exame Físico Geral
		ef_geral: "Exame Físico Geral",
		ef_digestorio: "Aparelho Digestório",
		ef_cardiovascular: "Aparelho Cardiovascular",
		ef_linfatico: "Sistema Linfático",
		ef_neurologico: "Neurológico",
		ef_respiratorio_inferior: "Respiratório Inferior",
		ef_respiratorio_superior: "Respiratório Superior (ORL)",
	};
	/** @type {Record<string, string>} */
	const defaultGuides = {
		hma: "Descreva cronologia, fatores de melhora/piora, intensidade, sintomas associados e impacto funcional.",
		revisao_sistemas:
			"Registre sinais e sintomas por sistemas, destacando positivos e negativos relevantes para o raciocínio clínico.",
		ocupacional:
			"Inclua ocupação atual, exposições, carga física, ergonomia, afastamentos e relação com sintomas.",
		psicossocial:
			"Explore contexto familiar, suporte social, moradia, renda, estressores, espiritualidade e segurança.",
		habitos:
			"Documente sono, atividade física, alimentação, etilismo, tabagismo, drogas e sexualidade quando pertinente.",
		recordatorio_alimentar:
			"Registre refeições em ordem cronológica, incluindo horários, quantidades aproximadas, bebidas e beliscos fora das refeições.",
		// Exame Ginecológico - Templates
		mamas_palpacao:
			"Mamas simétricas, sem nódulos palpáveis, sem dor à palpação. Superfície lisa, consistência elástica homogênea. Ausência de adenomegalias axilares.",
		genitalia_externa:
			"Vulva com aspecto normal, mucosa rosada e hidratada. Bigornos e pequenos lábios sem alterações. Ausência de lesões, eritema ou descamação.",
		genitalia_interna:
			"Colo uterino com aspect normal, mucosa rosada, orifício cervical permeável. Ausência de sangramento ativo, secreção anormal ou lesões.",
		genitalia_toque:
			"Útero em posição anterior/anteversoflexo, consistência elástica, volume normal, mobilidade preservada. Anexos livres, sem massas palpáveis. Ausência de dor à mobilização.",
		// Exame Físico - Templates
		ef_geral:
			"Bom estado geral, corado, hidratado, acianótico, anictérico, afebril. Ativo, cooperativo, orientado em tempo e espaço. Marcha e fala sem alterações estruturais aparentes. Fácies atípica.",
		ef_digestorio:
			"Abdome plano, simétrico, sem circulação colateral ou cicatrizes patológicas. Ruídos hidroaéreos presentes e normais em todos os quadrantes. Abdome flácido, indolor à palpação superficial e profunda. Ausência de massas ou visceromegalias (fígado e baço não palpáveis). Timpanismo preservado.",
		ef_cardiovascular:
			"Ictus cordis não visível, palpável no 5º espaço intercostal esquerdo na linha hemiclavicular, sem frêmitos. Ritmo cardíaco regular em 2 tempos, bulhas normofonéticas, sem sopros ou estalidos. Pulsos periféricos simétricos, cheios e de amplitude normal. Tempo de enchimento capilar menor que 2 segundos.",
		ef_linfatico:
			"Ausência de linfonodomegalias palpáveis nas cadeias cervical, submandibular, supraclavicular, axilar e inguinal. Linfonodos indolores, móveis e de consistência elástica.",
		ef_neurologico:
			"Lúcido e orientado (escala de coma de Glasgow 15). Pupilas isocóricas e fotorreativas. Ausência de déficits motores ou sensitivos focais. Coordenação motora preservada (teste índex-nariz normal). Ausência de sinais de irritação meníngea (rigidez de nuca ausente). Reflexos osteotendíneos normais e simétricos.",
		ef_respiratorio_inferior:
			"Tórax simétrico, expansibilidade preservada bilateralmente. Frêmito tóraco-vocal simétrico e normal. Murmúrio vesicular universalmente audível, sem ruídos adventícios (estertores, sibilos ou roncos). Som claro pulmonar à percussão.",
		ef_respiratorio_superior:
			"Narinas desobstruídas, mucosa nasal corada e sem secreções. Orofaringe sem hiperemia, amígdalas normotróficas, ausência de placas ou exsudatos. Condutos auditivos externos livres, membranas timpânicas íntegras, translúcidas e com reflexo luminoso presente.",
	};

	let aviso = "";
	let erro = "";
	let guideWarning = "";
	let savingGuide = false;
	let activeGuideKey = "";
	let draftHydrated = false;
	/** @type {Record<string, string>} */
	let guides = { ...defaultGuides };
	let editingGuideKey = "";
	let editingGuideLabel = "";
	let editingGuideText = "";
	/** @type {HTMLDialogElement | null} */
	let guideDialogRef;

	/** @type {HTMLDialogElement | null} */
	let diseaseDialogRef;
	let diseaseSearch = "";
	/** @type {CidSearchItem[]} */
	let diseaseSearchResults = [];
	let diseaseLoading = false;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let diseaseSearchTimer;
	let diseaseMode = "cid";
	/** @type {string | null} */
	let editingDiseaseId = null;
	/** @type {DiseaseForm} */
	let diseaseForm = createEmptyDiseaseForm();
	/** @type {DiseaseItem[]} */
	let diseases = [];

	/** @type {HTMLDialogElement | null} */
	let medicationDialogRef;
	let medicationSearch = "";
	/** @type {MedicationSearchItem[]} */
	let medicationSearchResults = [];
	let medicationLoading = false;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let medicationSearchTimer;
	/** @type {string | null} */
	let editingMedicationId = null;
	/** @type {MedicationForm} */
	let medicationForm = createEmptyMedicationForm();
	let medicationManualMode = false;
	/** @type {ConsultationMedication[]} */
	let medications = [];

	let subjective = {
		identificacao: {
			idade: "",
			ocupacao: "",
			naturalidade: "",
			acompanhante: "",
			sexo: "",
			genero: "",
			generoOutro: "",
			raca: "",
			racaOutro: "",
			estadoCivil: "",
			estadoCivilOutro: "",
			escolaridade: "",
			escolaridadeOutro: "",
			religiao: "",
			religiaoOutro: "",
		},
		queixaPrincipal: "",
		hma: "",
		revisaoSistemas: "",
		patologicos: {
			alergia: "",
			cirurgias: "",
			internacoes: "",
			traumatismos: "",
		},
		historiaFamiliar: "",
		ocupacional: "",
		psicossocial: "",
		habitos: "",
		recordatorioAlimentar: {
			cafeManha: "",
			lancheManha: "",
			almoco: "",
			lancheTarde: "",
			cafeTarde: "",
			lancheAntesJantar: "",
			jantar: "",
			lancheDepoisJantar: "",
		},
		ginecologica: {
			g: "",
			p: "",
			n: "",
			c: "",
			a: "",
			e: "",
			dum: "",
			mac: "",
		},
	};

	/** @typedef {{ id: string; nome: string; pacote?: string; valoresReferencia?: string; unidade?: string; resultado?: string; selecionado?: boolean; significado?: string; dataExecucao?: string; }} LaboratorioItem */
	/** @typedef {{ id: string; nome: string; motivo?: string; resultado?: string; medicoExecutor?: string; dataRealizacao?: string; }} ImagemItem */

	// Variáveis para Exames Laboratoriais
	/** @type {LaboratorioItem[]} */
	let laboratorioSelecionados = [];
	/** @type {HTMLDialogElement | null} */
	let labDialogRef;
	let labSearch = "";
	let labLoading = false;
	/** @type {Array<{ id: number; nome: string; pacote: string | null; valores_referencia: string | null; unidade_medida: string | null; significado: string | null; }>} */
	let labSearchResults = [];
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let labSearchTimer;
	let labModo = "pacote"; // 'pacote' ou 'manual'
	let labPacoteSelecionado = "";
	let labDataExecucao = ""; // Data de execução obrigatória ao adicionar pacote
	let labExameManual = { nome: "", valoresReferencia: "", unidade: "" };

	// Variáveis para seleção de pacotes e edição de exames
	/** @type {string[]} */
	let labPacotesDisponiveis = [];
	let labPacotesLoading = false;
	/** @type {LaboratorioItem[]} */
	let labExamesEmEdicao = []; // Exames em edição no modal

	// Variáveis para Exames de Imagem
	/** @type {ImagemItem[]} */
	let imagemSelecionados = [];
	/** @type {HTMLDialogElement | null} */
	let imagemDialogRef;
	let imagemSearch = "";
	let imagemLoading = false;

	/** @type {HTMLDialogElement | null} */
	let resetDialogRef;
	/** @type {Array<{ id: number; descricao: string; }>} */
	let imagemSearchResults = [];
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let imagemSearchTimer;
	let imagemExameManual = "";
	let imagemDataRealizacao = ""; // Data de realização do exame de imagem

	// Variáveis para Escores de Risco
	/** @type {HTMLDialogElement | null} */
	let calculadorasDialogRef;
	let calculadorasLoading = false;
	/** @type {Array<{id: number, nome: string}>} */
	let areasClinicas = [];
	/** @type {Array<{id: number, area_id: number, nome: string, descricao: string, link: string}>} */
	let calculadorasRisco = [];
	let calculadorasTab = "lista"; // 'lista' ou 'gerenciar'
	let novaAreaNome = "";
	let novaCalc = { area_id: "", nome: "", descricao: "", link: "" };

	let objective = {
		// Sinais Vitais
		sinaisVitais: {
			pas: "",
			pad: "",
			temperatura: "",
			frequenciaCardiaca: "",
			frequenciaRespiratoria: "",
			spo2: "",
		},
		// Dados Antropométricos
		antropometria: {
			altura: "",
			peso: "",
			circunferenciaAbdominal: "",
			imc: "",
		},
		// Exame Físico
		exameFisico: {
			geral: "",
			aparelhoDigestorio: "",
			aparelhoCardiovascular: "",
			sistemaLinfatico: "",
			neurologico: "",
			respiratorioInferior: "",
			respiratorioSuperior: "",
			ginecologico: {
				// Exame das Mamas
				mamas: {
					inspecaoEstatica: {
						posicao: "", // topicas/ptoticas
						simetria: "", // simetricas/assimetricas
						volume: "", // eutroficas/hipotroficas/hipertroficas
						mamilos: "", // proeminentes/planos/invertidos
						ausenciaAbaulamentosRetracoes: false,
						observacoes: "",
					},
					inspecaoDinamica: {
						ausenciaAbaulamentosRetracoes: false,
						observacoes: "",
					},
					palpacao: "",
					expressao: {
						resultado: "", // positiva/negativa
						observacoes: "",
					},
				},
				// Exame da Genitália
				genitalia: {
					externa: "",
					interna: "",
					toqueVaginal: "",
				},
			},
		},
	};

	// Cálculo automático do IMC (reativo)
	$: if (objective.antropometria.peso && objective.antropometria.altura) {
		const peso = parseFloat(objective.antropometria.peso);
		const altura = parseFloat(objective.antropometria.altura) / 100; // converter cm para m
		if (peso > 0 && altura > 0) {
			const imc = peso / (altura * altura);
			objective.antropometria.imc = imc.toFixed(1);
		} else {
			objective.antropometria.imc = "";
		}
	} else {
		objective.antropometria.imc = "";
	}

	let assessment = {
		hipoteses: "",
		riscos: "",
		observacoes: "",
	};

	let plan = {
		condutas: "",
		prescricao: "",
		seguimento: "",
	};

	/** @type {Record<string, FamilyHistoryEntry>} */
	let familyHistory = createEmptyFamilyHistory();

	$: diseaseGroups = groupBy(
		diseases,
		(item) => item.cap_desc || "Sem capítulo definido",
	);
	$: medicationGroups = groupBy(
		medications,
		(item) => item.classe || "Classe não informada",
	);
	$: laboratorioAgrupado = groupBy(
		laboratorioSelecionados,
		(item) => item.pacote || "Exames Avulsos",
	);
	$: laboratorioSelecionadosTodos =
		laboratorioSelecionados.length > 0 &&
		laboratorioSelecionados.every((item) => item.selecionado);
	$: calculadorasPorArea = groupBy(
		calculadorasRisco,
		(c) => areasClinicas.find((a) => a.id === c.area_id)?.nome || "Outros",
	);

	// Derived state for pivot table grouped by pacote (group by pacote then exam name, pivot by date)
	$: laboratorioPivotPorPacote = (() => {
		const pacoteMap = new Map();

		for (const item of laboratorioSelecionados) {
			const pacoteName = item.pacote || "Exames Avulsos";
			const date = item.dataExecucao || "Sem data";

			if (!pacoteMap.has(pacoteName)) {
				pacoteMap.set(pacoteName, {
					pacote: pacoteName,
					datas: new Set(),
					examMap: new Map(),
				});
			}

			const pacoteData = pacoteMap.get(pacoteName);
			pacoteData.datas.add(date);

			if (!pacoteData.examMap.has(item.nome)) {
				pacoteData.examMap.set(item.nome, {
					nome: item.nome,
					valoresReferencia: item.valoresReferencia || "",
					unidade: item.unidade || "",
					significado: item.significado || "",
					resultadosPorData: {},
				});
			}
			pacoteData.examMap.get(item.nome).resultadosPorData[date] =
				item.resultado || "";
		}

		return Array.from(pacoteMap.values()).map((p) => ({
			pacote: p.pacote,
			datas: Array.from(p.datas).sort(),
			exames: Array.from(p.examMap.values()),
		}));
	})();
	$: if (
		draftHydrated &&
		subjective &&
		objective &&
		assessment &&
		plan &&
		familyHistory &&
		diseases &&
		medications
	) {
		consultaDraft.set(buildDraftSnapshot());
	}

	// Persistência explícita de doenças, medicamentos e exames com reatividade garantida
	$: if (draftHydrated && diseases) {
		saveToLocalStorage(DISEASES_STORAGE_KEY, diseases);
	}
	$: if (draftHydrated && medications) {
		saveToLocalStorage(MEDICATIONS_STORAGE_KEY, medications);
	}
	$: if (draftHydrated && laboratorioSelecionados) {
		saveToLocalStorage(LABORATORIO_STORAGE_KEY, laboratorioSelecionados);
	}
	$: if (draftHydrated && imagemSelecionados) {
		saveToLocalStorage(IMAGEM_STORAGE_KEY, imagemSelecionados);
	}

	/**
	 * @param {HTMLTextAreaElement} node
	 */
	function autogrow(node) {
		const resize = () => {
			node.style.height = "auto";
			node.style.height = `${node.scrollHeight}px`;
		};

		queueMicrotask(resize);
		node.addEventListener("input", resize);

		return {
			update: resize,
			destroy() {
				node.removeEventListener("input", resize);
			},
		};
	}

	/** @returns {DiseaseForm} */
	function createEmptyDiseaseForm() {
		return {
			subcat: "",
			subcat_desc: "",
			cat: "",
			cat_desc: "",
			cap: "",
			cap_desc: "",
			mesAnoDiagnostico: "",
			historico: "",
			queixasAtuais: "",
		};
	}

	/** @returns {MedicationForm} */
	function createEmptyMedicationForm() {
		return {
			sourceId: null,
			principio_ativo: "",
			concentracao: "",
			classe: "",
			forma_farmaceutica: "",
			fornecimento_sus: "",
			observacoes: "",
			frequenciaTipo: "diario",
			diario: {
				manha: "",
				tarde: "",
				noite: "",
			},
			semanal: "Segunda a sexta",
			intervalo: "12h",
			especial: "",
			doseQual: "",
		};
	}

	/** @returns {Record<string, FamilyHistoryEntry>} */
	function createEmptyFamilyHistory() {
		return familyHistoryOptions.reduce((acc, option) => {
			acc[option.id] = {
				checked: false,
				parentes: [createFamilyRelative()],
				detalhes: "",
			};
			return acc;
		}, /** @type {Record<string, FamilyHistoryEntry>} */ ({}));
	}

	/** @returns {FamilyHistoryRelative} */
	function createFamilyRelative() {
		return {
			id: createId(),
			parentesco: "",
			idade: "",
			detalhes: "",
		};
	}

	function createId() {
		return (
			globalThis.crypto?.randomUUID?.() ??
			`${Date.now()}-${Math.random().toString(16).slice(2)}`
		);
	}

	/**
	 * @template T
	 * @param {T[]} items
	 * @param {(item: T) => string} getKey
	 * @returns {Record<string, T[]>}
	 */
	function groupBy(items, getKey) {
		return items.reduce((groups, item) => {
			const key = getKey(item);
			if (!groups[key]) groups[key] = [];
			groups[key].push(item);
			return groups;
		}, /** @type {Record<string, T[]>} */ ({}));
	}

	async function carregarGuias() {
		try {
			const response = await fetch("/api/guias-consulta");
			const data = await response.json();
			if (!response.ok) {
				throw new Error(
					data?.error || "Falha ao carregar textos-guia.",
				);
			}

			guides = { ...defaultGuides, ...(data.guides ?? {}) };
			guideWarning = data.warning ?? "";
		} catch (e) {
			guideWarning =
				e instanceof Error
					? e.message
					: "Não foi possível carregar os textos-guia.";
		}
	}

	/**
	 * @param {string} key
	 */
	function openGuideEditor(key) {
		editingGuideKey = key;
		editingGuideLabel = guideSectionLabels[key] ?? key;
		editingGuideText = guides[key] ?? "";
		guideDialogRef?.showModal();
	}

	function closeGuideEditor() {
		guideDialogRef?.close();
	}

	async function saveGuide() {
		if (!editingGuideKey || !editingGuideText.trim()) {
			erro = "O texto-guia não pode ficar vazio.";
			return;
		}

		savingGuide = true;
		erro = "";
		try {
			const response = await fetch("/api/guias-consulta", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					secao: editingGuideKey,
					conteudo: editingGuideText,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || "Falha ao salvar texto-guia.");
			}

			guides = {
				...guides,
				[editingGuideKey]: editingGuideText.trim(),
			};
			closeGuideEditor();
		} catch (e) {
			erro =
				e instanceof Error
					? e.message
					: "Erro inesperado ao salvar guia.";
		} finally {
			savingGuide = false;
		}
	}

	/**
	 * Carrega template de guia para campo do exame ginecológico
	 * @param {string} guideKey - Chave do template (ex: 'mamas_palpacao')
	 * @param {string} currentValue - Valor atual do campo
	 * @returns {string} - Template ou valor atual se não houver template
	 */
	function loadTemplate(guideKey, currentValue) {
		// Se já existe valor preenchido, mantém
		if (currentValue && currentValue.trim()) return currentValue;
		// Caso contrário, carrega o template das guias
		return guides[guideKey] || "";
	}

	/**
	 * Salva o conteúdo atual como novo template no banco
	 * @param {string} guideKey - Chave do template
	 * @param {string} content - Conteúdo a salvar
	 */
	async function salvarTemplate(guideKey, content) {
		if (!content || !content.trim()) {
			erro = "O template não pode ficar vazio.";
			return;
		}

		savingGuide = true;
		erro = "";
		try {
			const response = await fetch("/api/guias-consulta", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					secao: guideKey,
					conteudo: content.trim(),
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || "Falha ao salvar template.");
			}

			// Atualiza localmente
			guides = {
				...guides,
				[guideKey]: content.trim(),
			};
			aviso = `Template "${guideSectionLabels[guideKey] || guideKey}" salvo com sucesso!`;
			setTimeout(() => (aviso = ""), 3000);
		} catch (e) {
			erro = e instanceof Error ? e.message : "Erro ao salvar template.";
		} finally {
			savingGuide = false;
		}
	}

	/**
	 * @param {DiseaseItem | null} [item=null]
	 */
	function openDiseaseModal(item = null) {
		editingDiseaseId = item?.id ?? null;
		diseaseMode = item?.mode ?? "cid";
		diseaseSearch = item ? `${item.subcat} ${item.subcat_desc}`.trim() : "";
		diseaseSearchResults = [];
		diseaseForm = item
			? {
					subcat: item.subcat ?? "",
					subcat_desc: item.subcat_desc ?? "",
					cat: item.cat ?? "",
					cat_desc: item.cat_desc ?? "",
					cap: item.cap ?? "",
					cap_desc: item.cap_desc ?? "",
					mesAnoDiagnostico: item.mesAnoDiagnostico ?? "",
					historico: item.historico ?? "",
					queixasAtuais: item.queixasAtuais ?? "",
				}
			: createEmptyDiseaseForm();
		diseaseDialogRef?.showModal();
		if (!item) {
			queueMicrotask(() => {
				diseaseSearch = "";
			});
		}
	}

	/**
	 * @param {string} optionId
	 */
	function addFamilyRelative(optionId) {
		familyHistory = {
			...familyHistory,
			[optionId]: {
				...familyHistory[optionId],
				parentes: [
					...(familyHistory[optionId]?.parentes ?? []),
					createFamilyRelative(),
				],
			},
		};
	}

	/**
	 * @param {string} optionId
	 * @param {string} relativeId
	 */
	function removeFamilyRelative(optionId, relativeId) {
		const current = familyHistory[optionId]?.parentes ?? [];
		familyHistory = {
			...familyHistory,
			[optionId]: {
				...familyHistory[optionId],
				parentes:
					current.length > 1
						? current.filter(
								(relative) => relative.id !== relativeId,
							)
						: current,
			},
		};
	}

	function closeDiseaseModal() {
		diseaseDialogRef?.close();
	}

	function scheduleDiseaseSearch() {
		clearTimeout(diseaseSearchTimer);
		if (!diseaseSearch.trim() || diseaseMode !== "cid") {
			diseaseSearchResults = [];
			return;
		}

		diseaseSearchTimer = setTimeout(buscarCid, 250);
	}

	async function buscarCid() {
		diseaseLoading = true;
		try {
			const params = new URLSearchParams({
				q: diseaseSearch.trim(),
				page: "1",
				limit: "50",
			});
			const response = await fetch(`/api/cid10?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || "Falha ao pesquisar CID-10.");
			}

			diseaseSearchResults = data.items ?? [];
		} catch (e) {
			erro =
				e instanceof Error
					? e.message
					: "Erro inesperado na busca CID-10.";
		} finally {
			diseaseLoading = false;
		}
	}

	/**
	 * @param {CidSearchItem} item
	 */
	function selectDiseaseSuggestion(item) {
		diseaseForm = {
			...diseaseForm,
			subcat: item.subcat ?? "",
			subcat_desc: item.subcat_desc ?? "",
			cat: item.cat ?? "",
			cat_desc: item.cat_desc ?? "",
			cap: item.cap ?? "",
			cap_desc: item.cap_desc ?? "",
		};
		diseaseSearch = `${item.cat_desc} - ${item.subcat}`;
		diseaseSearchResults = [];
	}

	function saveDisease() {
		const manualChapter = chapterOptions.find(
			(item) => item.cap === diseaseForm.cap,
		);
		const finalDisease = {
			id: editingDiseaseId ?? createId(),
			mode: diseaseMode,
			subcat: diseaseForm.subcat.trim(),
			subcat_desc: diseaseForm.subcat_desc.trim(),
			cat: diseaseForm.cat.trim(),
			cat_desc: diseaseForm.cat_desc.trim(),
			cap: diseaseForm.cap.trim(),
			cap_desc: (
				diseaseForm.cap_desc ||
				manualChapter?.cap_desc ||
				""
			).trim(),
			mesAnoDiagnostico: diseaseForm.mesAnoDiagnostico.trim(),
			historico: diseaseForm.historico.trim(),
			queixasAtuais: diseaseForm.queixasAtuais.trim(),
		};

		if (!finalDisease.subcat_desc || !finalDisease.cap) {
			erro = "Preencha a descrição da doença e o capítulo CID.";
			return;
		}

		if (editingDiseaseId) {
			diseases = [
				...diseases.map((item) =>
					item.id === editingDiseaseId ? finalDisease : item,
				),
			];
		} else {
			diseases = [...diseases, finalDisease];
		}

		closeDiseaseModal();
	}

	/**
	 * @param {string} id
	 */
	function deleteDisease(id) {
		if (!window.confirm("Excluir esta doença do prontuário em montagem?"))
			return;
		diseases = [...diseases.filter((item) => item.id !== id)];
	}

	/**
	 * @param {ConsultationMedication | null} [item=null]
	 */
	function openMedicationModal(item = null) {
		editingMedicationId = item?.id ?? null;
		medicationSearch = item?.principio_ativo ?? "";
		medicationSearchResults = [];
		medicationForm = item
			? {
					sourceId: item.sourceId ?? null,
					principio_ativo: item.principio_ativo ?? "",
					concentracao: item.concentracao ?? "",
					classe: item.classe ?? "",
					forma_farmaceutica: item.forma_farmaceutica ?? "",
					fornecimento_sus: item.fornecimento_sus ?? "",
					observacoes: item.observacoes ?? "",
					frequenciaTipo: item.frequenciaTipo ?? "diario",
					diario: normalizeDailyFrequency(item.diario),
					semanal: item.semanal ?? "Segunda a sexta",
					intervalo: item.intervalo ?? "12h",
					especial: item.especial ?? "",
					doseQual: item.doseQual ?? "",
				}
			: createEmptyMedicationForm();
		medicationManualMode = Boolean(item && !item.sourceId);
		medicationDialogRef?.showModal();
	}

	function closeMedicationModal() {
		medicationDialogRef?.close();
	}

	function scheduleMedicationSearch() {
		clearTimeout(medicationSearchTimer);
		if (!medicationSearch.trim()) {
			medicationSearchResults = [];
			return;
		}
		medicationSearchTimer = setTimeout(buscarMedicamentos, 250);
	}

	async function buscarMedicamentos() {
		medicationLoading = true;
		try {
			const params = new URLSearchParams({
				q: medicationSearch.trim(),
				page: "1",
				limit: "50",
			});
			const response = await fetch(
				`/api/medicamentos?${params.toString()}`,
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(
					data?.error || "Falha ao pesquisar medicamentos.",
				);
			}
			medicationSearchResults = data.items ?? [];
		} catch (e) {
			erro =
				e instanceof Error
					? e.message
					: "Erro inesperado na busca de medicamentos.";
		} finally {
			medicationLoading = false;
		}
	}

	function startManualMedication() {
		medicationManualMode = true;
		medicationSearch = "";
		medicationSearchResults = [];
		medicationForm = createEmptyMedicationForm();
	}

	/**
	 * @param {MedicationSearchItem} item
	 */
	function selectMedicationSuggestion(item) {
		medicationManualMode = false;
		medicationForm = {
			...medicationForm,
			sourceId: item.id ?? null,
			principio_ativo: item.principio_ativo ?? "",
			concentracao: item.concentracao ?? "",
			classe: item.classe ?? "",
			forma_farmaceutica: item.forma_farmaceutica ?? "",
			fornecimento_sus: item.fornecimento_sus ?? "",
		};
		medicationSearch = item.principio_ativo ?? "";
		medicationSearchResults = [];
	}

	function saveMedication() {
		const finalMedication = {
			id: editingMedicationId ?? createId(),
			sourceId: medicationForm.sourceId,
			principio_ativo: medicationForm.principio_ativo.trim(),
			concentracao: medicationForm.concentracao.trim(),
			classe: medicationForm.classe.trim(),
			forma_farmaceutica: medicationForm.forma_farmaceutica.trim(),
			fornecimento_sus: medicationForm.fornecimento_sus.trim(),
			observacoes: medicationForm.observacoes.trim(),
			frequenciaTipo: medicationForm.frequenciaTipo,
			diario: normalizeDailyFrequency(medicationForm.diario),
			semanal: medicationForm.semanal,
			intervalo: medicationForm.intervalo,
			especial: medicationForm.especial.trim(),
			doseQual: medicationForm.doseQual.trim(),
		};

		if (!finalMedication.principio_ativo) {
			erro = "Preencha o princípio ativo.";
			return;
		}

		if (editingMedicationId) {
			medications = [
				...medications.map((item) =>
					item.id === editingMedicationId ? finalMedication : item,
				),
			];
		} else {
			medications = [...medications, finalMedication];
		}

		closeMedicationModal();
	}

	/**
	 * @param {string} id
	 */
	function deleteMedication(id) {
		if (
			!window.confirm(
				"Excluir este medicamento do prontuário em montagem?",
			)
		)
			return;
		medications = [...medications.filter((item) => item.id !== id)];
	}

	/**
	 * @param {ConsultationMedication} item
	 */
	function describeFrequency(item) {
		if (item.frequenciaTipo === "diario") {
			const periods = [
				item.diario?.manha ? `Manhã: ${item.diario.manha}` : "",
				item.diario?.tarde ? `Tarde: ${item.diario.tarde}` : "",
				item.diario?.noite ? `Noite: ${item.diario.noite}` : "",
			].filter(Boolean);
			return periods.length ? `Diário (${periods.join(", ")})` : "Diário";
		}
		if (item.frequenciaTipo === "semanal") {
			const doseInfo = item.doseQual ? ` - ${item.doseQual}` : "";
			return `Semanal: ${item.semanal}${doseInfo}`;
		}
		if (item.frequenciaTipo === "intervalo") {
			const doseInfo = item.doseQual ? ` - ${item.doseQual}` : "";
			return `Intervalo: a cada ${item.intervalo}${doseInfo}`;
		}
		return `Especial: ${item.especial || "não informado"}`;
	}

	/**
	 * @param {unknown} diario
	 */
	function normalizeDailyFrequency(diario) {
		const value =
			/** @type {{ manha?: unknown; tarde?: unknown; noite?: unknown } | undefined} */ (
				diario
			);
		return {
			manha:
				typeof value?.manha === "string"
					? value.manha
					: value?.manha
						? "1"
						: "",
			tarde:
				typeof value?.tarde === "string"
					? value.tarde
					: value?.tarde
						? "1"
						: "",
			noite:
				typeof value?.noite === "string"
					? value.noite
					: value?.noite
						? "1"
						: "",
		};
	}

	function buildDraftSnapshot() {
		return {
			version: 1,
			subjective,
			objective: {
				sinaisVitais: { ...objective.sinaisVitais },
				antropometria: { ...objective.antropometria },
				exameFisico: { ...objective.exameFisico },
			},
			assessment,
			plan,
			familyHistory,
			diseases: [...diseases],
			medications: [...medications],
		};
	}

	/**
	 * @param {ReturnType<typeof buildDraftSnapshot>} draft
	 */
	function applyDraftSnapshot(draft) {
		if (draft.subjective) {
			subjective = {
				...subjective,
				...draft.subjective,
				identificacao: {
					...subjective.identificacao,
					...(draft.subjective.identificacao ?? {}),
				},
				patologicos: {
					...subjective.patologicos,
					...(draft.subjective.patologicos ?? {}),
				},
				recordatorioAlimentar: {
					...subjective.recordatorioAlimentar,
					...(draft.subjective.recordatorioAlimentar ?? {}),
				},
				ginecologica: {
					...subjective.ginecologica,
					...(draft.subjective.ginecologica ?? {}),
				},
			};
		}
		if (draft.objective) {
			objective = {
				sinaisVitais: {
					...objective.sinaisVitais,
					...(draft.objective.sinaisVitais ?? {}),
				},
				antropometria: {
					...objective.antropometria,
					...(draft.objective.antropometria ?? {}),
				},
				exameFisico: {
					...objective.exameFisico,
					...(draft.objective.exameFisico ?? {}),
				},
			};
		}
		if (draft.assessment)
			assessment = { ...assessment, ...draft.assessment };
		if (draft.plan) plan = { ...plan, ...draft.plan };
		if (draft.familyHistory) {
			const nextFamilyHistory = createEmptyFamilyHistory();
			for (const option of familyHistoryOptions) {
				const stored = draft.familyHistory[option.id];
				if (stored) {
					const legacyStored =
						/** @type {FamilyHistoryEntry & { parentesco?: string; idade?: string }} */ (
							stored
						);
					nextFamilyHistory[option.id] = {
						checked: Boolean(stored.checked),
						detalhes: stored.detalhes ?? "",
						parentes: Array.isArray(stored.parentes)
							? stored.parentes.map((relative) => ({
									id: relative.id ?? createId(),
									parentesco: relative.parentesco ?? "",
									idade: relative.idade ?? "",
									detalhes: relative.detalhes ?? "",
								}))
							: [
									{
										id: createId(),
										parentesco:
											legacyStored.parentesco ?? "",
										idade: legacyStored.idade ?? "",
										detalhes: stored.detalhes ?? "",
									},
								],
					};
				}
			}
			familyHistory = nextFamilyHistory;
		}
		if (Array.isArray(draft.diseases)) diseases = draft.diseases;
		if (Array.isArray(draft.medications)) {
			medications = draft.medications.map((item) => ({
				...item,
				diario: normalizeDailyFrequency(item.diario),
				doseQual: item.doseQual || "",
			}));
		}
	}

	/**
	 * @param {string} principioAtivo
	 */
	function pesquisarMedicamento(principioAtivo) {
		const query = `medicamento de referência, classe, mecanismo de ação, indicações, contra-indicações, efeitos adversos e metabolismo do medicamento ${principioAtivo}`;
		window.open(
			`https://www.google.com/search?q=${encodeURIComponent(query)}`,
			"_blank",
			"noopener,noreferrer",
		);
	}

	// ==========================================
	// FUNÇÕES DE EXPORTAÇÃO (ÁREA DE TRANSFERÊNCIA)
	// ==========================================

	/**
	 * Verifica se um valor está vazio (null, undefined, string vazia, array vazio)
	 * @param {unknown} value
	 * @returns {boolean}
	 */
	function isEmpty(value) {
		if (value === null || value === undefined) return true;
		if (typeof value === "string") return value.trim() === "";
		if (Array.isArray(value)) return value.length === 0;
		if (typeof value === "object") return Object.keys(value).length === 0;
		if (typeof value === "number") return false; // 0 é um valor válido
		return !value;
	}

	/**
	 * Schema de mapeamento para exportação do Subjetivo
	 * Define como cada campo deve ser formatado e exibido
	 * @type {any}
	 */
	const subjetivoSchema = {
		identificacao: {
			title: "IDENTIFICAÇÃO",
			fields: {
				idade: {
					label: "Idade",
					formatter: (/** @type {string} */ v) => v,
				},
				ocupacao: {
					label: "Ocupação",
					formatter: (/** @type {string} */ v) => v,
				},
				naturalidade: {
					label: "Naturalidade",
					formatter: (/** @type {string} */ v) => v,
				},
				acompanhante: {
					label: "Acompanhante",
					formatter: (/** @type {string} */ v) => v,
				},
				sexo: {
					label: "Sexo biológico",
					formatter: (/** @type {string} */ v) => v,
				},
				genero: {
					label: "Gênero",
					formatter: (
						/** @type {string} */ v,
						/** @type {any} */ obj,
					) => (v === "Outros" ? obj.generoOutro || v : v),
				},
				raca: {
					label: "Raça",
					formatter: (
						/** @type {string} */ v,
						/** @type {any} */ obj,
					) => (v === "Outros" ? obj.racaOutro || v : v),
				},
				estadoCivil: {
					label: "Estado civil",
					formatter: (
						/** @type {string} */ v,
						/** @type {any} */ obj,
					) => (v === "Outros" ? obj.estadoCivilOutro || v : v),
				},
				escolaridade: {
					label: "Escolaridade",
					formatter: (
						/** @type {string} */ v,
						/** @type {any} */ obj,
					) => (v === "Outros" ? obj.escolaridadeOutro || v : v),
				},
				religiao: {
					label: "Religião",
					formatter: (
						/** @type {string} */ v,
						/** @type {any} */ obj,
					) => (v === "Outros" ? obj.religiaoOutro || v : v),
				},
			},
		},
		queixaPrincipal: { label: "QUEIXA PRINCIPAL", isSimple: true },
		hma: { label: "HMA", isSimple: true },
		revisaoSistemas: { label: "REVISÃO DE SISTEMAS", isSimple: true },
		patologicos: {
			title: "HISTÓRIA PATOLÓGICA PREGRESSA",
			fields: {
				alergia: {
					label: "Alergia",
					formatter: (/** @type {string} */ v) => v,
				},
				cirurgias: {
					label: "Cirurgias",
					formatter: (/** @type {string} */ v) => v,
				},
				internacoes: {
					label: "Internações",
					formatter: (/** @type {string} */ v) => v,
				},
				traumatismos: {
					label: "Traumatismos",
					formatter: (/** @type {string} */ v) => v,
				},
			},
		},
		ocupacional: { label: "HISTÓRIA OCUPACIONAL", isSimple: true },
		psicossocial: { label: "HISTÓRIA PSICOSSOCIAL", isSimple: true },
		habitos: { label: "HÁBITOS DE VIDA", isSimple: true },
		recordatorioAlimentar: {
			title: "RECORDATÓRIO ALIMENTAR",
			fields: {
				cafeManha: {
					label: "Café da manhã",
					formatter: (/** @type {string} */ v) => v,
				},
				lancheManha: {
					label: "Lanche da manhã",
					formatter: (/** @type {string} */ v) => v,
				},
				almoco: {
					label: "Almoço",
					formatter: (/** @type {string} */ v) => v,
				},
				lancheTarde: {
					label: "Lanche da tarde",
					formatter: (/** @type {string} */ v) => v,
				},
				cafeTarde: {
					label: "Café da tarde",
					formatter: (/** @type {string} */ v) => v,
				},
				lancheAntesJantar: {
					label: "Lanche antes do jantar",
					formatter: (/** @type {string} */ v) => v,
				},
				jantar: {
					label: "Jantar",
					formatter: (/** @type {string} */ v) => v,
				},
				lancheDepoisJantar: {
					label: "Lanche depois do jantar",
					formatter: (/** @type {string} */ v) => v,
				},
			},
		},
		ginecologica: {
			title: "HISTÓRIA GINECOLÓGICA",
			condition: (/** @type {any} */ data) =>
				data.identificacao?.sexo === "Feminino",
			fields: {
				g: { label: "G", formatter: (/** @type {string} */ v) => v },
				p: { label: "P", formatter: (/** @type {string} */ v) => v },
				n: { label: "N", formatter: (/** @type {string} */ v) => v },
				c: { label: "C", formatter: (/** @type {string} */ v) => v },
				a: { label: "A", formatter: (/** @type {string} */ v) => v },
				e: { label: "E", formatter: (/** @type {string} */ v) => v },
				dum: {
					label: "DUM",
					formatter: (/** @type {string} */ v) => v,
				},
				mac: {
					label: "MAC",
					formatter: (/** @type {string} */ v) => v,
				},
			},
		},
	};

	/**
	 * Exporta os dados do Subjetivo para a área de transferência
	 */
	async function exportarSubjetivo() {
		erro = "";
		aviso = "";
		const lines = [];

		// Título principal (CAIXA ALTA, nível 1)
		lines.push("ANAMNESE (S)");
		lines.push("");

		// Identificação
		const id = subjective.identificacao;
		const idFields = [
			id.idade ? `Idade: ${id.idade}` : "",
			id.ocupacao ? `Ocupação: ${id.ocupacao}` : "",
			id.naturalidade ? `Naturalidade: ${id.naturalidade}` : "",
			id.acompanhante ? `Acompanhante: ${id.acompanhante}` : "",
			id.sexo ? `Sexo biológico: ${id.sexo}` : "",
			id.genero
				? `Gênero: ${id.genero === "Outros" ? id.generoOutro || id.genero : id.genero}`
				: "",
			id.raca
				? `Raça: ${id.raca === "Outros" ? id.racaOutro || id.raca : id.raca}`
				: "",
			id.estadoCivil
				? `Estado civil: ${id.estadoCivil === "Outros" ? id.estadoCivilOutro || id.estadoCivil : id.estadoCivil}`
				: "",
			id.escolaridade
				? `Escolaridade: ${id.escolaridade === "Outros" ? id.escolaridadeOutro || id.escolaridade : id.escolaridade}`
				: "",
			id.religiao
				? `Religião: ${id.religiao === "Outros" ? id.religiaoOutro || id.religiao : id.religiao}`
				: "",
		].filter(Boolean);
		if (idFields.length > 0) {
			lines.push("IDENTIFICAÇÃO");
			idFields.forEach((f) => lines.push(`   ${f}`));
			lines.push("");
		}

		// Campos simples
		if (!isEmpty(subjective.queixaPrincipal)) {
			lines.push("QUEIXA PRINCIPAL");
			lines.push(`   ${subjective.queixaPrincipal}`);
			lines.push("");
		}
		if (!isEmpty(subjective.hma)) {
			lines.push("HMA");
			lines.push(`   ${subjective.hma}`);
			lines.push("");
		}
		if (!isEmpty(subjective.revisaoSistemas)) {
			lines.push("REVISÃO DE SISTEMAS");
			lines.push(`   ${subjective.revisaoSistemas}`);
			lines.push("");
		}

		// História Patológica Pregressa
		const pat = subjective.patologicos;
		const patFields = [
			pat.alergia ? `Alergia: ${pat.alergia}` : "",
			pat.cirurgias ? `Cirurgias: ${pat.cirurgias}` : "",
			pat.internacoes ? `Internações: ${pat.internacoes}` : "",
			pat.traumatismos ? `Traumatismos: ${pat.traumatismos}` : "",
		].filter(Boolean);
		if (patFields.length > 0) {
			lines.push("HISTÓRIA PATOLÓGICA PREGRESSA");
			patFields.forEach((f) => lines.push(`   • ${f}`));
			lines.push("");
		}

		// Doenças estratificadas
		if (diseases.length > 0) {
			lines.push("DOENÇAS ESTRATIFICADAS");
			diseases.forEach((disease, i) => {
				const parts = [disease.subcat_desc];
				if (disease.subcat) parts.push(`(${disease.subcat})`);
				if (disease.mesAnoDiagnostico)
					parts.push(`- Diagnóstico: ${disease.mesAnoDiagnostico}`);
				lines.push(`   ${i + 1}. ${parts.join(" ")}`);
				if (disease.historico)
					lines.push(`      Histórico: ${disease.historico}`);
				if (disease.queixasAtuais)
					lines.push(
						`      Queixas atuais: ${disease.queixasAtuais}`,
					);
			});
			lines.push("");
		}

		// Medicamentos
		if (medications.length > 0) {
			lines.push("MEDICAMENTOS EM USO");
			medications.forEach((med, i) => {
				const freq = describeFrequency(med);
				lines.push(
					`   ${i + 1}. ${med.principio_ativo}${med.concentracao ? ` ${med.concentracao}` : ""} - ${freq}`,
				);
				if (med.observacoes)
					lines.push(`      Obs: ${med.observacoes}`);
			});
			lines.push("");
		}

		// História Familiar
		const familyHistoryEntries = Object.entries(familyHistory).filter(
			([_, entry]) => entry.checked,
		);
		if (familyHistoryEntries.length > 0) {
			lines.push("HISTÓRIA FAMILIAR");
			for (const [key, entry] of familyHistoryEntries) {
				const option = familyHistoryOptions.find((o) => o.id === key);
				if (!option) continue;
				const parentes = entry.parentes
					.filter((p) => p.parentesco || p.idade)
					.map((p) => {
						return [p.parentesco, p.idade]
							.filter(Boolean)
							.join(" - ");
					});
				if (parentes.length > 0) {
					lines.push(`   • ${option.label}: ${parentes.join(", ")}`);
				} else {
					lines.push(`   • ${option.label}`);
				}
				if (entry.detalhes)
					lines.push(`      Detalhes: ${entry.detalhes}`);
			}
			lines.push("");
		}

		// Campos restantes
		if (!isEmpty(subjective.ocupacional)) {
			lines.push("HISTÓRIA OCUPACIONAL");
			lines.push(`   ${subjective.ocupacional}`);
			lines.push("");
		}
		if (!isEmpty(subjective.psicossocial)) {
			lines.push("HISTÓRIA PSICOSSOCIAL");
			lines.push(`   ${subjective.psicossocial}`);
			lines.push("");
		}
		if (!isEmpty(subjective.habitos)) {
			lines.push("HÁBITOS DE VIDA");
			lines.push(`   ${subjective.habitos}`);
			lines.push("");
		}

		// Recordatório Alimentar
		const ra = subjective.recordatorioAlimentar;
		const raFields = [
			ra.cafeManha ? `Café da manhã: ${ra.cafeManha}` : "",
			ra.lancheManha ? `Lanche da manhã: ${ra.lancheManha}` : "",
			ra.almoco ? `Almoço: ${ra.almoco}` : "",
			ra.lancheTarde ? `Lanche da tarde: ${ra.lancheTarde}` : "",
			ra.cafeTarde ? `Café da tarde: ${ra.cafeTarde}` : "",
			ra.lancheAntesJantar
				? `Lanche antes do jantar: ${ra.lancheAntesJantar}`
				: "",
			ra.jantar ? `Jantar: ${ra.jantar}` : "",
			ra.lancheDepoisJantar
				? `Lanche depois do jantar: ${ra.lancheDepoisJantar}`
				: "",
		].filter(Boolean);
		if (raFields.length > 0) {
			lines.push("RECORDATÓRIO ALIMENTAR");
			raFields.forEach((f) => lines.push(`   • ${f}`));
			lines.push("");
		}

		// História Ginecológica
		if (subjective.identificacao.sexo === "Feminino") {
			const gineco = subjective.ginecologica;
			const ginecoFields = [
				gineco.g ? `G: ${gineco.g}` : "",
				gineco.p ? `P: ${gineco.p}` : "",
				gineco.n ? `N: ${gineco.n}` : "",
				gineco.c ? `C: ${gineco.c}` : "",
				gineco.a ? `A: ${gineco.a}` : "",
				gineco.e ? `E: ${gineco.e}` : "",
				gineco.dum ? `DUM: ${gineco.dum}` : "",
				gineco.mac ? `MAC: ${gineco.mac}` : "",
			].filter(Boolean);
			if (ginecoFields.length > 0) {
				lines.push("HISTÓRIA GINECOLÓGICA");
				lines.push(`   ${ginecoFields.join("   ")}`);
				lines.push("");
			}
		}

		const finalText = lines.join("\n");

		try {
			await navigator.clipboard.writeText(finalText);
			aviso =
				"Anamnese (Subjetivo) copiada para a área de transferência!";
			setTimeout(() => (aviso = ""), 3000);
		} catch (err) {
			erro =
				"Erro ao copiar para a área de transferência. Tente novamente.";
		}
	}

	/**
	 * Exporta os dados do Objetivo para a área de transferência
	 */
	async function exportarObjetivo() {
		erro = "";
		aviso = "";
		const lines = [];

		lines.push("EXAME FÍSICO E TESTES (O)");
		lines.push("");

		// Sinais Vitais
		const sv = objective.sinaisVitais;
		const sinaisVitaisPreenchidos =
			sv.pas ||
			sv.pad ||
			sv.temperatura ||
			sv.frequenciaCardiaca ||
			sv.frequenciaRespiratoria ||
			sv.spo2;
		if (sinaisVitaisPreenchidos) {
			lines.push("SINAIS VITAIS");
			if (sv.pas || sv.pad)
				lines.push(`   • PA: ${sv.pas || "--"}/${sv.pad || "--"} mmHg`);
			if (sv.temperatura)
				lines.push(`   • Temperatura: ${sv.temperatura} °C`);
			if (sv.frequenciaCardiaca)
				lines.push(`   • FC: ${sv.frequenciaCardiaca} bpm`);
			if (sv.frequenciaRespiratoria)
				lines.push(`   • FR: ${sv.frequenciaRespiratoria} irpm`);
			if (sv.spo2) lines.push(`   • SpO2: ${sv.spo2} %`);
			lines.push("");
		}

		// Antropometria
		const ant = objective.antropometria;
		const antropometriaPreenchida =
			ant.altura || ant.peso || ant.circunferenciaAbdominal || ant.imc;
		if (antropometriaPreenchida) {
			lines.push("ANTROPOMETRIA");
			if (ant.altura) lines.push(`   • Altura: ${ant.altura} cm`);
			if (ant.peso) lines.push(`   • Peso: ${ant.peso} kg`);
			if (ant.circunferenciaAbdominal)
				lines.push(
					`   • Circunferência Abdominal: ${ant.circunferenciaAbdominal} cm`,
				);
			if (ant.imc) lines.push(`   • IMC: ${ant.imc} kg/m²`);
			lines.push("");
		}

		// Exame Físico
		const ef = objective.exameFisico;
		const exameFisicoPreenchido =
			ef.geral ||
			ef.aparelhoDigestorio ||
			ef.aparelhoCardiovascular ||
			ef.sistemaLinfatico ||
			ef.neurologico ||
			ef.respiratorioInferior ||
			ef.respiratorioSuperior ||
			ef.ginecologico;
		if (exameFisicoPreenchido) {
			lines.push("EXAME FÍSICO");
			if (ef.geral) lines.push(`   • Geral: ${ef.geral}`);
			if (ef.aparelhoDigestorio)
				lines.push(
					`   • Aparelho Digestório: ${ef.aparelhoDigestorio}`,
				);
			if (ef.aparelhoCardiovascular)
				lines.push(
					`   • Aparelho Cardiovascular: ${ef.aparelhoCardiovascular}`,
				);
			if (ef.sistemaLinfatico)
				lines.push(`   • Sistema Linfático: ${ef.sistemaLinfatico}`);
			if (ef.neurologico)
				lines.push(`   • Neurológico: ${ef.neurologico}`);
			if (ef.respiratorioInferior)
				lines.push(
					`   • Respiratório Inferior: ${ef.respiratorioInferior}`,
				);
			if (ef.respiratorioSuperior)
				lines.push(
					`   • Respiratório Superior (ORL): ${ef.respiratorioSuperior}`,
				);

			// Exame Ginecológico detalhado
			if (subjective.identificacao.sexo === "Feminino") {
				const gineco = ef.ginecologico;
				const mamas = gineco?.mamas;
				const genitalia = gineco?.genitalia;

				const temExameGinecologico =
					mamas?.palpacao ||
					mamas?.expressao?.resultado ||
					genitalia?.externa ||
					genitalia?.interna ||
					genitalia?.toqueVaginal ||
					mamas?.inspecaoEstatica?.posicao ||
					mamas?.inspecaoEstatica?.simetria;

				if (temExameGinecologico) {
					lines.push("   • Exame Ginecológico:");

					if (mamas) {
						const ie = mamas.inspecaoEstatica;
						const id = mamas.inspecaoDinamica;
						const temMamas =
							ie?.posicao ||
							ie?.simetria ||
							ie?.volume ||
							ie?.mamilos ||
							ie?.observacoes ||
							id?.observacoes ||
							mamas?.palpacao ||
							mamas?.expressao?.resultado;

						if (temMamas) {
							lines.push("      Mamas:");
							const ieCampos = [];
							if (ie?.posicao)
								ieCampos.push(`Posição: ${ie.posicao}`);
							if (ie?.simetria)
								ieCampos.push(`Simetria: ${ie.simetria}`);
							if (ie?.volume)
								ieCampos.push(`Volume: ${ie.volume}`);
							if (ie?.mamilos)
								ieCampos.push(`Mamilos: ${ie.mamilos}`);
							if (ie?.ausenciaAbaulamentosRetracoes)
								ieCampos.push(
									"Ausência de abaulamentos/retrações",
								);
							if (ie?.observacoes)
								ieCampos.push(`Obs: ${ie.observacoes}`);
							if (ieCampos.length > 0)
								lines.push(
									`         Inspeção Estática: ${ieCampos.join(", ")}`,
								);

							const idCampos = [];
							if (id?.ausenciaAbaulamentosRetracoes)
								idCampos.push(
									"Ausência de abaulamentos/retrações",
								);
							if (id?.observacoes)
								idCampos.push(`Obs: ${id.observacoes}`);
							if (idCampos.length > 0)
								lines.push(
									`         Inspeção Dinâmica: ${idCampos.join(", ")}`,
								);

							if (mamas?.palpacao?.trim())
								lines.push(
									`         Palpação: ${mamas.palpacao}`,
								);

							if (mamas?.expressao?.resultado) {
								const expObs = mamas.expressao.observacoes
									? ` (${mamas.expressao.observacoes})`
									: "";
								lines.push(
									`         Expressão: ${mamas.expressao.resultado}${expObs}`,
								);
							}
						}
					}

					const temGenitalia =
						genitalia?.externa ||
						genitalia?.interna ||
						genitalia?.toqueVaginal;
					if (temGenitalia) {
						lines.push("      Genitália:");
						if (genitalia?.externa?.trim())
							lines.push(
								`         Externa: ${genitalia.externa}`,
							);
						if (genitalia?.interna?.trim())
							lines.push(
								`         Interna: ${genitalia.interna}`,
							);
						if (genitalia?.toqueVaginal?.trim())
							lines.push(
								`         Toque Vaginal: ${genitalia.toqueVaginal}`,
							);
					}
				}
			}
			lines.push("");
		}

		// Exames Laboratoriais — formato hierárquico por pacote, sem negrito
		if (laboratorioPivotPorPacote.length > 0) {
			lines.push("EXAMES LABORATORIAIS");
			lines.push("");
			for (const pacoteData of laboratorioPivotPorPacote) {
				// Nome do pacote como subtítulo
				lines.push(pacoteData.pacote);
				for (const exame of pacoteData.exames) {
					// Resultados em ordem cronológica: data resultado+unidade separados por ;
					const resultadosParts = pacoteData.datas
						.filter((d) => exame.resultadosPorData[d])
						.map((d) => {
							const dataFmt =
								d === "Sem data"
									? "Sem data"
									: new Date(
											d + "T12:00:00",
										).toLocaleDateString("pt-BR");
							const resultado = exame.resultadosPorData[d];
							const unidade = exame.unidade ? exame.unidade : "";
							return `${dataFmt} ${resultado}${unidade}`;
						});
					const valRef = exame.valoresReferencia
						? `Valores de referência: ${exame.valoresReferencia}${exame.unidade ? exame.unidade : ""}`
						: "";
					const partes =
						resultadosParts.length > 0
							? resultadosParts.join("; ")
							: "Sem resultado";
					const linha = valRef ? `${partes}; ${valRef}` : partes;
					lines.push(`   ${exame.nome}: ${linha}`);
				}
				lines.push("");
			}
		}

		// Exames de Imagem
		if (imagemSelecionados.length > 0) {
			lines.push("EXAMES DE IMAGEM E FUNCIONAIS");
			lines.push("");
			imagemSelecionados.forEach((item, i) => {
				const dataStr = item.dataRealizacao
					? ` (${new Date(item.dataRealizacao + "T12:00:00").toLocaleDateString("pt-BR")})`
					: "";
				lines.push(`   ${i + 1}. ${item.nome}${dataStr}`);
				if (item.motivo) lines.push(`      Motivo: ${item.motivo}`);
				if (item.resultado)
					lines.push(`      Resultado: ${item.resultado}`);
				if (item.medicoExecutor)
					lines.push(`      Médico: ${item.medicoExecutor}`);
			});
			lines.push("");
		}

		const finalText = lines.join("\n");

		try {
			await navigator.clipboard.writeText(finalText);
			aviso =
				"Exame Físico e Testes (Objetivo) copiados para a área de transferência!";
			setTimeout(() => (aviso = ""), 3000);
		} catch (err) {
			erro =
				"Erro ao copiar para a área de transferência. Tente novamente.";
		}
	}

	// ==========================================
	// EXPORTAÇÃO PARA PDF
	// ==========================================

	/**
	 * Gera e exporta a consulta completa usando a impressão nativa do navegador
	 */
	async function exportarPDF() {
		try {
			// Monta o conteúdo HTML
			const htmlContent = gerarHTMLPDF();

			// Abre uma nova janela para impressão
			const printWindow = window.open(
				"",
				"_blank",
				"width=800,height=600",
			);
			if (!printWindow) {
				throw new Error(
					"Pop-up bloqueado pelo navegador. Por favor, permita pop-ups para imprimir.",
				);
			}

			printWindow.document.write(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Consulta_Paciente_${new Date().toISOString().split("T")[0]}</title>
					<style>
						body { font-family: sans-serif; padding: 20px; color: #000; }
						@media print {
							@page { margin: 15mm; }
							body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
						}
					</style>
				</head>
				<body>
					${htmlContent}
				</body>
				</html>
			`);
			printWindow.document.close();

			// Executa a impressão quando a nova janela carregar
			printWindow.onload = function () {
				printWindow.print();
				setTimeout(function () {
					printWindow.close();
				}, 500);
			};

			aviso = "Janela de impressão aberta!";
			setTimeout(() => (aviso = ""), 3000);
		} catch (err) {
			erro =
				"Erro ao gerar impressão: " +
				(err.message || "Erro desconhecido");
			console.error("Erro detalhado ao gerar impressão:", err);
		}
	}

	/**
	 * Gera o conteúdo HTML formatado para o PDF
	 */
	function gerarHTMLPDF() {
		const sections = [];

		// Cabeçalho
		sections.push(`
			<div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
				<h1 style="font-size: 18px; font-weight: bold; margin: 0; color: #000;">PRONTUÁRIO MÉDICO</h1>
				<p style="font-size: 12px; margin: 5px 0 0 0; color: #333;">${new Date().toLocaleDateString("pt-BR")}</p>
			</div>
		`);

		// === SUBJETIVO (S) ===
		const subjetivoHTML = gerarSubjetivoHTML();
		if (subjetivoHTML) {
			sections.push(`
				<div style="margin-bottom: 20px;">
					<h2 style="font-size: 16px; font-weight: bold; color: #000; border-bottom: 1px solid #666; padding-bottom: 5px; margin-bottom: 10px;">S | SUBJETIVO</h2>
					${subjetivoHTML}
				</div>
			`);
		}

		// === OBJETIVO (O) ===
		const objetivoHTML = gerarObjetivoHTML();
		if (objetivoHTML) {
			sections.push(`
				<div style="margin-bottom: 20px;">
					<h2 style="font-size: 16px; font-weight: bold; color: #000; border-bottom: 1px solid #666; padding-bottom: 5px; margin-bottom: 10px;">O | OBJETIVO</h2>
					${objetivoHTML}
				</div>
			`);
		}

		// === AVALIAÇÃO (A) ===
		const temAvaliacao =
			assessment?.hipoteses?.trim() ||
			assessment?.riscos?.trim() ||
			assessment?.observacoes?.trim();
		if (temAvaliacao) {
			const avalParts = [];
			if (assessment?.hipoteses?.trim())
				avalParts.push(
					`<p style="font-size: 11px; margin: 0 0 5px 0;"><b>Hipóteses:</b> ${escapeHtml(assessment.hipoteses)}</p>`,
				);
			if (assessment?.riscos?.trim())
				avalParts.push(
					`<p style="font-size: 11px; margin: 0 0 5px 0;"><b>Riscos:</b> ${escapeHtml(assessment.riscos)}</p>`,
				);
			if (assessment?.observacoes?.trim())
				avalParts.push(
					`<p style="font-size: 11px; margin: 0 0 5px 0;"><b>Observações:</b> ${escapeHtml(assessment.observacoes)}</p>`,
				);
			sections.push(`
				<div style="margin-bottom: 20px;">
					<h2 style="font-size: 16px; font-weight: bold; color: #000; border-bottom: 1px solid #666; padding-bottom: 5px; margin-bottom: 10px;">A | AVALIAÇÃO</h2>
					${avalParts.join("")}
				</div>
			`);
		}

		// === PLANO (P) ===
		const temPlano =
			plan?.condutas?.trim() ||
			plan?.prescricao?.trim() ||
			plan?.seguimento?.trim();
		if (temPlano) {
			const planoParts = [];
			if (plan?.condutas?.trim())
				planoParts.push(
					`<p style="font-size: 11px; margin: 0 0 5px 0;"><b>Condutas:</b> ${escapeHtml(plan.condutas)}</p>`,
				);
			if (plan?.prescricao?.trim())
				planoParts.push(
					`<p style="font-size: 11px; margin: 0 0 5px 0;"><b>Prescrição:</b> ${escapeHtml(plan.prescricao)}</p>`,
				);
			if (plan?.seguimento?.trim())
				planoParts.push(
					`<p style="font-size: 11px; margin: 0 0 5px 0;"><b>Seguimento:</b> ${escapeHtml(plan.seguimento)}</p>`,
				);
			sections.push(`
				<div style="margin-bottom: 20px;">
					<h2 style="font-size: 16px; font-weight: bold; color: #000; border-bottom: 1px solid #666; padding-bottom: 5px; margin-bottom: 10px;">P | PLANO</h2>
					${planoParts.join("")}
				</div>
			`);
		}

		// Rodapé
		sections.push(`
			<div style="text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666;">
				Documento gerado eletronicamente via Sistema de Anamnese
			</div>
		`);

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<style>
					body { font-family: Arial, Helvetica, sans-serif; line-height: 1.4; color: #000; }
					p { margin: 0 0 8px 0; }
				</style>
			</head>
			<body>
				${sections.join("")}
			</body>
			</html>
		`;
	}

	/**
	 * Gera HTML do Subjetivo para PDF
	 */
	function gerarSubjetivoHTML() {
		const parts = [];

		// Identificação completa
		const id = subjective.identificacao;
		const temIdentificacao =
			id.idade ||
			id.ocupacao ||
			id.naturalidade ||
			id.acompanhante ||
			id.sexo ||
			id.genero ||
			id.raca ||
			id.estadoCivil ||
			id.escolaridade ||
			id.religiao;
		if (temIdentificacao) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Identificação</h3>',
			);
			const campos = [];
			if (id.idade) campos.push(`<b>Idade:</b> ${escapeHtml(id.idade)}`);
			if (id.ocupacao)
				campos.push(`<b>Ocupação:</b> ${escapeHtml(id.ocupacao)}`);
			if (id.naturalidade)
				campos.push(
					`<b>Naturalidade:</b> ${escapeHtml(id.naturalidade)}`,
				);
			if (id.acompanhante)
				campos.push(
					`<b>Acompanhante:</b> ${escapeHtml(id.acompanhante)}`,
				);
			if (id.sexo) campos.push(`<b>Sexo:</b> ${escapeHtml(id.sexo)}`);
			if (id.genero)
				campos.push(
					`<b>Gênero:</b> ${escapeHtml(id.genero === "Outros" ? id.generoOutro || id.genero : id.genero)}`,
				);
			if (id.raca)
				campos.push(
					`<b>Raça:</b> ${escapeHtml(id.raca === "Outros" ? id.racaOutro || id.raca : id.raca)}`,
				);
			if (id.estadoCivil)
				campos.push(
					`<b>Estado Civil:</b> ${escapeHtml(id.estadoCivil === "Outros" ? id.estadoCivilOutro || id.estadoCivil : id.estadoCivil)}`,
				);
			if (id.escolaridade)
				campos.push(
					`<b>Escolaridade:</b> ${escapeHtml(id.escolaridade === "Outros" ? id.escolaridadeOutro || id.escolaridade : id.escolaridade)}`,
				);
			if (id.religiao)
				campos.push(
					`<b>Religião:</b> ${escapeHtml(id.religiao === "Outros" ? id.religiaoOutro || id.religiao : id.religiao)}`,
				);
			parts.push(
				`<p style="font-size: 11px; margin: 0;">${campos.join(" | ")}</p>`,
			);
			parts.push("</div>");
		}

		// Queixa Principal
		if (subjective.queixaPrincipal?.trim()) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Queixa Principal</h3>',
			);
			parts.push(
				`<p style="font-size: 11px; margin: 0; white-space: pre-wrap;">${escapeHtml(subjective.queixaPrincipal)}</p>`,
			);
			parts.push("</div>");
		}

		// HMA
		if (subjective.hma?.trim()) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">HMA</h3>',
			);
			parts.push(
				`<p style="font-size: 11px; margin: 0; white-space: pre-wrap;">${escapeHtml(subjective.hma)}</p>`,
			);
			parts.push("</div>");
		}

		// Revisão de Sistemas
		if (subjective.revisaoSistemas?.trim()) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Revisão de Sistemas</h3>',
			);
			parts.push(
				`<p style="font-size: 11px; margin: 0; white-space: pre-wrap;">${escapeHtml(subjective.revisaoSistemas)}</p>`,
			);
			parts.push("</div>");
		}

		// História Familiar
		const familyEntries = Object.entries(familyHistory).filter(
			([_, entry]) => entry.checked,
		);
		if (familyEntries.length > 0 || subjective.historiaFamiliar?.trim()) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">História Familiar</h3>',
			);
			if (familyEntries.length > 0) {
				parts.push(
					'<ul style="margin: 0 0 5px 0; padding-left: 20px; font-size: 11px;">',
				);
				familyEntries.forEach(([key, entry]) => {
					const label =
						familyHistoryOptions.find((o) => o.id === key)?.label ||
						key;
					if (entry.parentes && entry.parentes.length > 0) {
						entry.parentes.forEach((p) => {
							const parentesco = p.parentesco
								? ` (${escapeHtml(p.parentesco)}${p.idade ? `, ${p.idade} anos` : ""})`
								: "";
							parts.push(
								`<li>${escapeHtml(label)}${parentesco}${p.detalhes ? `: ${escapeHtml(p.detalhes)}` : ""}</li>`,
							);
						});
					} else {
						parts.push(
							`<li>${escapeHtml(label)}${entry.detalhes ? `: ${escapeHtml(entry.detalhes)}` : ""}</li>`,
						);
					}
				});
				parts.push("</ul>");
			}
			if (subjective.historiaFamiliar?.trim()) {
				parts.push(
					`<p style="font-size: 11px; margin: 0; white-space: pre-wrap;"><b>Observações:</b> ${escapeHtml(subjective.historiaFamiliar)}</p>`,
				);
			}
			parts.push("</div>");
		}

		// História Ocupacional
		if (subjective.ocupacional?.trim()) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">História Ocupacional</h3>',
			);
			parts.push(
				`<p style="font-size: 11px; margin: 0; white-space: pre-wrap;">${escapeHtml(subjective.ocupacional)}</p>`,
			);
			parts.push("</div>");
		}

		// História Psicossocial
		if (subjective.psicossocial?.trim()) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">História Psicossocial</h3>',
			);
			parts.push(
				`<p style="font-size: 11px; margin: 0; white-space: pre-wrap;">${escapeHtml(subjective.psicossocial)}</p>`,
			);
			parts.push("</div>");
		}

		// Hábitos de Vida
		if (subjective.habitos?.trim()) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Hábitos de Vida</h3>',
			);
			parts.push(
				`<p style="font-size: 11px; margin: 0; white-space: pre-wrap;">${escapeHtml(subjective.habitos)}</p>`,
			);
			parts.push("</div>");
		}

		// Recordatório Alimentar
		const ra = subjective.recordatorioAlimentar;
		const temRecordatorio =
			ra.cafeManha ||
			ra.lancheManha ||
			ra.almoco ||
			ra.lancheTarde ||
			ra.cafeTarde ||
			ra.lancheAntesJantar ||
			ra.jantar ||
			ra.lancheDepoisJantar;
		if (temRecordatorio) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Recordatório Alimentar</h3>',
			);
			parts.push(
				'<ul style="margin: 0; padding-left: 20px; font-size: 11px;">',
			);
			if (ra.cafeManha)
				parts.push(
					`<li><b>Café da Manhã:</b> ${escapeHtml(ra.cafeManha)}</li>`,
				);
			if (ra.lancheManha)
				parts.push(
					`<li><b>Lanche da Manhã:</b> ${escapeHtml(ra.lancheManha)}</li>`,
				);
			if (ra.almoco)
				parts.push(`<li><b>Almoço:</b> ${escapeHtml(ra.almoco)}</li>`);
			if (ra.lancheTarde)
				parts.push(
					`<li><b>Lanche da Tarde:</b> ${escapeHtml(ra.lancheTarde)}</li>`,
				);
			if (ra.cafeTarde)
				parts.push(
					`<li><b>Café da Tarde:</b> ${escapeHtml(ra.cafeTarde)}</li>`,
				);
			if (ra.lancheAntesJantar)
				parts.push(
					`<li><b>Lanche antes do Jantar:</b> ${escapeHtml(ra.lancheAntesJantar)}</li>`,
				);
			if (ra.jantar)
				parts.push(`<li><b>Jantar:</b> ${escapeHtml(ra.jantar)}</li>`);
			if (ra.lancheDepoisJantar)
				parts.push(
					`<li><b>Lanche após o Jantar:</b> ${escapeHtml(ra.lancheDepoisJantar)}</li>`,
				);
			parts.push("</ul>");
			parts.push("</div>");
		}

		// História Ginecológica
		const gineco = subjective.ginecologica;
		const temGineco =
			gineco.g ||
			gineco.p ||
			gineco.n ||
			gineco.c ||
			gineco.a ||
			gineco.e ||
			gineco.dum ||
			gineco.mac;
		if (temGineco) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">História Ginecológica (GPNCAE)</h3>',
			);
			const campos = [];
			if (gineco.g) campos.push(`<b>G:</b> ${escapeHtml(gineco.g)}`);
			if (gineco.p) campos.push(`<b>P:</b> ${escapeHtml(gineco.p)}`);
			if (gineco.n) campos.push(`<b>N:</b> ${escapeHtml(gineco.n)}`);
			if (gineco.c) campos.push(`<b>C:</b> ${escapeHtml(gineco.c)}`);
			if (gineco.a) campos.push(`<b>A:</b> ${escapeHtml(gineco.a)}`);
			if (gineco.e) campos.push(`<b>E:</b> ${escapeHtml(gineco.e)}`);
			if (gineco.dum)
				campos.push(`<b>DUM:</b> ${escapeHtml(gineco.dum)}`);
			if (gineco.mac)
				campos.push(`<b>MAC:</b> ${escapeHtml(gineco.mac)}`);
			parts.push(
				`<p style="font-size: 11px; margin: 0;">${campos.join(" | ")}</p>`,
			);
			parts.push("</div>");
		}

		// Doenças (com detalhes completos)
		if (diseases.length > 0) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Doenças de Base (História Patológica Pregressa)</h3>',
			);
			parts.push(
				'<ul style="margin: 0; padding-left: 20px; font-size: 11px;">',
			);
			diseases.forEach((d) => {
				let descricao = escapeHtml(d.subcat_desc);
				if (d.subcat)
					descricao += ` <span style="color: #666;">[${escapeHtml(d.subcat)}]</span>`;
				const detalhes = [];
				if (d.mesAnoDiagnostico)
					detalhes.push(
						`Diagnóstico: ${escapeHtml(d.mesAnoDiagnostico)}`,
					);
				if (d.historico?.trim())
					detalhes.push(`Histórico: ${escapeHtml(d.historico)}`);
				if (d.queixasAtuais?.trim())
					detalhes.push(
						`Queixas atuais: ${escapeHtml(d.queixasAtuais)}`,
					);
				if (detalhes.length > 0) {
					parts.push(
						`<li>${descricao}<br/><span style="padding-left: 10px; color: #555;">${detalhes.join(" | ")}</span></li>`,
					);
				} else {
					parts.push(`<li>${descricao}</li>`);
				}
			});
			parts.push("</ul>");
			parts.push("</div>");
		}

		// História Patológica (Alergia, Cirurgias, Internações, Traumatismos)
		const pat = subjective.patologicos;
		const temPatologicos =
			pat.alergia || pat.cirurgias || pat.internacoes || pat.traumatismos;
		if (temPatologicos) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">História Patológica</h3>',
			);
			parts.push(
				'<ul style="margin: 0; padding-left: 20px; font-size: 11px;">',
			);
			if (pat.alergia)
				parts.push(
					`<li><b>Alergias:</b> ${escapeHtml(pat.alergia)}</li>`,
				);
			if (pat.cirurgias)
				parts.push(
					`<li><b>Cirurgias prévias:</b> ${escapeHtml(pat.cirurgias)}</li>`,
				);
			if (pat.internacoes)
				parts.push(
					`<li><b>Internações:</b> ${escapeHtml(pat.internacoes)}</li>`,
				);
			if (pat.traumatismos)
				parts.push(
					`<li><b>Traumatismos:</b> ${escapeHtml(pat.traumatismos)}</li>`,
				);
			parts.push("</ul>");
			parts.push("</div>");
		}

		// Medicamentos
		if (medications.length > 0) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Medicamentos de Uso Contínuo</h3>',
			);
			parts.push(
				'<ul style="margin: 0; padding-left: 20px; font-size: 11px;">',
			);
			medications.forEach((m) => {
				const freq = describeFrequencyForPDF(m);
				parts.push(
					`<li>${escapeHtml(m.principio_ativo)} ${escapeHtml(m.concentracao)} - ${escapeHtml(freq)}${m.observacoes ? ` (${escapeHtml(m.observacoes)})` : ""}</li>`,
				);
			});
			parts.push("</ul>");
			parts.push("</div>");
		}

		return parts.join("");
	}

	/**
	 * Gera HTML do Objetivo para PDF
	 */
	function gerarObjetivoHTML() {
		const parts = [];

		// Sinais Vitais
		const sv = objective.sinaisVitais;
		const temSinaisVitais =
			sv.pas ||
			sv.pad ||
			sv.temperatura ||
			sv.frequenciaCardiaca ||
			sv.frequenciaRespiratoria ||
			sv.spo2;
		if (temSinaisVitais) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Sinais Vitais</h3>',
			);
			const campos = [];
			if (sv.pas || sv.pad)
				campos.push(
					`<b>PA:</b> ${sv.pas || "--"}/${sv.pad || "--"} mmHg`,
				);
			if (sv.temperatura) campos.push(`<b>Temp:</b> ${sv.temperatura}°C`);
			if (sv.frequenciaCardiaca)
				campos.push(`<b>FC:</b> ${sv.frequenciaCardiaca} bpm`);
			if (sv.frequenciaRespiratoria)
				campos.push(`<b>FR:</b> ${sv.frequenciaRespiratoria} irpm`);
			if (sv.spo2) campos.push(`<b>SpO2:</b> ${sv.spo2}%`);
			parts.push(
				`<p style="font-size: 11px; margin: 0;">${campos.join(" | ")}</p>`,
			);
			parts.push("</div>");
		}

		// Antropometria
		const ant = objective.antropometria;
		const temAntropometria = ant.altura || ant.peso || ant.imc;
		if (temAntropometria) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Antropometria</h3>',
			);
			const campos = [];
			if (ant.altura) campos.push(`<b>Altura:</b> ${ant.altura} cm`);
			if (ant.peso) campos.push(`<b>Peso:</b> ${ant.peso} kg`);
			if (ant.imc) campos.push(`<b>IMC:</b> ${ant.imc} kg/m²`);
			parts.push(
				`<p style="font-size: 11px; margin: 0;">${campos.join(" | ")}</p>`,
			);
			parts.push("</div>");
		}

		// Exame Físico Geral
		const ef = objective.exameFisico;
		const temExameFisico =
			ef.geral ||
			ef.aparelhoDigestorio ||
			ef.aparelhoCardiovascular ||
			ef.neurologico ||
			ef.respiratorioInferior ||
			ef.respiratorioSuperior;
		if (temExameFisico) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Exame Físico</h3>',
			);
			if (ef.geral)
				parts.push(
					`<p style="font-size: 11px; margin: 0 0 3px 0;"><b>Geral:</b> ${escapeHtml(ef.geral)}</p>`,
				);
			if (ef.aparelhoDigestorio)
				parts.push(
					`<p style="font-size: 11px; margin: 0 0 3px 0;"><b>Digestório:</b> ${escapeHtml(ef.aparelhoDigestorio)}</p>`,
				);
			if (ef.aparelhoCardiovascular)
				parts.push(
					`<p style="font-size: 11px; margin: 0 0 3px 0;"><b>Cardiovascular:</b> ${escapeHtml(ef.aparelhoCardiovascular)}</p>`,
				);
			if (ef.neurologico)
				parts.push(
					`<p style="font-size: 11px; margin: 0 0 3px 0;"><b>Neurológico:</b> ${escapeHtml(ef.neurologico)}</p>`,
				);
			if (ef.respiratorioInferior)
				parts.push(
					`<p style="font-size: 11px; margin: 0 0 3px 0;"><b>Respiratório:</b> ${escapeHtml(ef.respiratorioInferior)}</p>`,
				);
			parts.push("</div>");
		}

		// Exame Ginecológico Detalhado
		const gin = objective.exameFisico.ginecologico;
		const mamas = gin?.mamas;
		const genitalia = gin?.genitalia;
		const temGineco =
			mamas?.inspecaoEstatica?.posicao ||
			mamas?.inspecaoEstatica?.simetria ||
			mamas?.inspecaoEstatica?.volume ||
			mamas?.inspecaoEstatica?.mamilos ||
			mamas?.inspecaoEstatica?.observacoes ||
			mamas?.inspecaoDinamica?.observacoes ||
			mamas?.palpacao ||
			mamas?.expressao?.resultado ||
			mamas?.expressao?.observacoes ||
			genitalia?.externa ||
			genitalia?.interna ||
			genitalia?.toqueVaginal;
		if (temGineco) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Exame Ginecológico</h3>',
			);

			// Mamas
			if (mamas) {
				parts.push(
					'<h4 style="font-size: 12px; font-weight: bold; color: #444; margin: 5px 0 3px 0;">Mamas</h4>',
				);

				// Inspeção Estática
				const insE = mamas.inspecaoEstatica;
				if (
					insE?.posicao ||
					insE?.simetria ||
					insE?.volume ||
					insE?.mamilos ||
					insE?.observacoes
				) {
					parts.push(
						'<p style="font-size: 11px; margin: 0 0 2px 0;"><b>Inspeção Estática:</b></p>',
					);
					const inspecoes = [];
					if (insE?.posicao)
						inspecoes.push(`Posição: ${escapeHtml(insE.posicao)}`);
					if (insE?.simetria)
						inspecoes.push(
							`Simetria: ${escapeHtml(insE.simetria)}`,
						);
					if (insE?.volume)
						inspecoes.push(`Volume: ${escapeHtml(insE.volume)}`);
					if (insE?.mamilos)
						inspecoes.push(`Mamilos: ${escapeHtml(insE.mamilos)}`);
					if (insE?.observacoes)
						inspecoes.push(`Obs: ${escapeHtml(insE.observacoes)}`);
					parts.push(
						`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px;">${inspecoes.join(" | ")}</p>`,
					);
				}

				// Inspeção Dinâmica
				const insD = mamas.inspecaoDinamica;
				if (insD?.observacoes) {
					parts.push(
						'<p style="font-size: 11px; margin: 0 0 2px 0;"><b>Inspeção Dinâmica:</b></p>',
					);
					parts.push(
						`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px;">${escapeHtml(insD.observacoes)}</p>`,
					);
				}

				// Palpação
				if (mamas.palpacao) {
					parts.push(
						'<p style="font-size: 11px; margin: 0 0 2px 0;"><b>Palpação:</b></p>',
					);
					parts.push(
						`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px;">${escapeHtml(mamas.palpacao)}</p>`,
					);
				}

				// Expressão
				const exp = mamas.expressao;
				if (exp?.resultado || exp?.observacoes) {
					parts.push(
						'<p style="font-size: 11px; margin: 0 0 2px 0;"><b>Expressão:</b></p>',
					);
					const expressao = [];
					if (exp?.resultado)
						expressao.push(
							`Resultado: ${escapeHtml(exp.resultado)}`,
						);
					if (exp?.observacoes)
						expressao.push(`Obs: ${escapeHtml(exp.observacoes)}`);
					parts.push(
						`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px;">${expressao.join(" | ")}</p>`,
					);
				}
			}

			// Genitália
			if (genitalia) {
				parts.push(
					'<h4 style="font-size: 12px; font-weight: bold; color: #444; margin: 5px 0 3px 0;">Genitália</h4>',
				);

				if (genitalia.externa) {
					parts.push(
						'<p style="font-size: 11px; margin: 0 0 2px 0;"><b>Externa:</b></p>',
					);
					parts.push(
						`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px;">${escapeHtml(genitalia.externa)}</p>`,
					);
				}

				if (genitalia.interna) {
					parts.push(
						'<p style="font-size: 11px; margin: 0 0 2px 0;"><b>Interna:</b></p>',
					);
					parts.push(
						`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px;">${escapeHtml(genitalia.interna)}</p>`,
					);
				}

				if (genitalia.toqueVaginal) {
					parts.push(
						'<p style="font-size: 11px; margin: 0 0 2px 0;"><b>Toque Vaginal:</b></p>',
					);
					parts.push(
						`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px;">${escapeHtml(genitalia.toqueVaginal)}</p>`,
					);
				}
			}
			parts.push("</div>");
		}

		// Exames Laboratoriais (Pivot por Pacote)
		if (laboratorioPivotPorPacote.length > 0) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Exames Laboratoriais</h3>',
			);

			for (const pacoteData of laboratorioPivotPorPacote) {
				parts.push(
					`<p style="font-size: 11px; font-weight: bold; margin: 8px 0 4px 0;">${escapeHtml(pacoteData.pacote)}</p>`,
				);
				parts.push(
					'<table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px;">',
				);

				const thStyle =
					"border: 1px solid #ccc; padding: 4px; text-align: left; background-color: #f0f0f0;";
				let head = `<thead><tr><th style="${thStyle}">Exame</th><th style="${thStyle}">Val. Ref.</th><th style="${thStyle}">Unidade</th>`;
				for (const data of pacoteData.datas) {
					const dataLabel =
						data === "Sem data"
							? "Sem data"
							: new Date(data).toLocaleDateString("pt-BR");
					head += `<th style="${thStyle} text-align: center;">${dataLabel}</th>`;
				}
				head += "</tr></thead>";
				parts.push(head);

				parts.push("<tbody>");
				const tdStyle = "border: 1px solid #ccc; padding: 4px;";
				const tdCenterStyle =
					"border: 1px solid #ccc; padding: 4px; text-align: center;";
				for (const exame of pacoteData.exames) {
					let row = `<tr><td style="${tdStyle}">${escapeHtml(exame.nome)}</td><td style="${tdStyle}">${escapeHtml(exame.valoresReferencia || "-")}</td><td style="${tdStyle}">${escapeHtml(exame.unidade || "-")}</td>`;
					for (const data of pacoteData.datas) {
						row += `<td style="${tdCenterStyle}">${escapeHtml(exame.resultadosPorData[data] || "-")}</td>`;
					}
					row += "</tr>";
					parts.push(row);
				}
				parts.push("</tbody></table>");
			}
			parts.push("</div>");
		}

		// Exames de Imagem Detalhados
		if (imagemSelecionados.length > 0) {
			parts.push('<div style="margin-bottom: 10px;">');
			parts.push(
				'<h3 style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Exames de Imagem e Funcionais</h3>',
			);
			parts.push(
				'<ul style="margin: 0; padding-left: 20px; font-size: 11px;">',
			);
			imagemSelecionados.forEach((ex) => {
				const data = ex.dataRealizacao
					? ` <span style="color: #666;">[${new Date(ex.dataRealizacao).toLocaleDateString("pt-BR")}]</span>`
					: "";
				const motivo = ex.motivo
					? ` - Motivo: ${escapeHtml(ex.motivo)}`
					: "";
				const executor = ex.medicoExecutor
					? ` - Executor: ${escapeHtml(ex.medicoExecutor)}`
					: "";
				const resultado = ex.resultado
					? `<br/><span style="padding-left: 10px; color: #555;">Resultado: ${escapeHtml(ex.resultado)}</span>`
					: "";
				parts.push(
					`<li><b>${escapeHtml(ex.nome)}</b>${data}${motivo}${executor}${resultado}</li>`,
				);
			});
			parts.push("</ul>");
			parts.push("</div>");
		}

		return parts.join("");
	}

	/**
	 * Escapa caracteres HTML para segurança
	 * @param {string | null | undefined} text
	 * @returns {string}
	 */
	function escapeHtml(text) {
		if (text === null || text === undefined) return "";
		const str = String(text);
		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	/**
	 * Descreve a frequência do medicamento para PDF
	 * @param {{ frequenciaTipo: string; diario?: { manha?: string; tarde?: string; noite?: string }; semanal?: string; intervalo?: string; especial?: string; doseQual?: string; }} med
	 * @returns {string}
	 */
	function describeFrequencyForPDF(med) {
		switch (med.frequenciaTipo) {
			case "diario":
				const parts = [];
				if (med.diario?.manha) parts.push(`Manhã: ${med.diario.manha}`);
				if (med.diario?.tarde) parts.push(`Tarde: ${med.diario.tarde}`);
				if (med.diario?.noite) parts.push(`Noite: ${med.diario.noite}`);
				return parts.length > 0 ? parts.join(", ") : "Diário";
			case "semanal":
				return med.doseQual
					? `${med.semanal || ""} (${med.doseQual})`
					: med.semanal || "";
			case "intervalo":
				return med.doseQual
					? `A cada ${med.intervalo || ""} (${med.doseQual})`
					: `A cada ${med.intervalo || ""}`;
			case "especial":
				return med.especial || "";
			default:
				return "";
		}
	}

	// ==========================================
	// FUNÇÃO DE LIMPEZA DE MEMÓRIA
	// ==========================================

	/**
	 * Limpa a memória e inicia uma nova consulta
	 * Reseta todos os arrays e estados para valores iniciais
	 */
	function limparMemoriaConsulta() {
		// Limpa o store principal
		clearConsultaDraft();

		// Reseta arrays de doenças e medicamentos
		diseases = [];
		medications = [];

		// Reseta exames laboratoriais e de imagem
		laboratorioSelecionados = [];
		imagemSelecionados = [];

		// Reseta o estado objetivo para valores iniciais
		objective = {
			sinaisVitais: {
				pas: "",
				pad: "",
				temperatura: "",
				frequenciaCardiaca: "",
				frequenciaRespiratoria: "",
				spo2: "",
			},
			antropometria: {
				altura: "",
				peso: "",
				circunferenciaAbdominal: "",
				imc: "",
			},
			exameFisico: {
				geral: "",
				aparelhoDigestorio: "",
				aparelhoCardiovascular: "",
				sistemaLinfatico: "",
				neurologico: "",
				respiratorioInferior: "",
				respiratorioSuperior: "",
				ginecologico: {
					mamas: {
						inspecaoEstatica: {
							posicao: "",
							simetria: "",
							volume: "",
							mamilos: "",
							ausenciaAbaulamentosRetracoes: false,
							observacoes: "",
						},
						inspecaoDinamica: {
							ausenciaAbaulamentosRetracoes: false,
							observacoes: "",
						},
						palpacao: "",
						expressao: {
							resultado: "",
							observacoes: "",
						},
					},
					genitalia: {
						externa: "",
						interna: "",
						toqueVaginal: "",
					},
				},
			},
		};

		// Reseta estados subjetivos, avaliação e plano
		subjective = {
			identificacao: {
				idade: "",
				ocupacao: "",
				naturalidade: "",
				acompanhante: "",
				sexo: "",
				genero: "",
				generoOutro: "",
				raca: "",
				racaOutro: "",
				estadoCivil: "",
				estadoCivilOutro: "",
				escolaridade: "",
				escolaridadeOutro: "",
				religiao: "",
				religiaoOutro: "",
			},
			queixaPrincipal: "",
			hma: "",
			revisaoSistemas: "",
			patologicos: {
				alergia: "",
				cirurgias: "",
				internacoes: "",
				traumatismos: "",
			},
			historiaFamiliar: "",
			ocupacional: "",
			psicossocial: "",
			habitos: "",
			recordatorioAlimentar: {
				cafeManha: "",
				lancheManha: "",
				almoco: "",
				lancheTarde: "",
				cafeTarde: "",
				lancheAntesJantar: "",
				jantar: "",
				lancheDepoisJantar: "",
			},
			ginecologica: {
				g: "",
				p: "",
				n: "",
				c: "",
				a: "",
				e: "",
				dum: "",
				mac: "",
			},
		};

		assessment = { hipoteses: "", riscos: "", observacoes: "" };

		plan = { condutas: "", prescricao: "", seguimento: "" };

		familyHistory = createEmptyFamilyHistory();

		// Limpa a busca de CID
		diseaseSearch = "";
		diseaseSearchResults = [];

		// Fecha o dialog
		resetDialogRef?.close();

		// Feedback visual
		aviso = "Memória limpa com sucesso! Nova consulta iniciada.";
		setTimeout(() => (aviso = ""), 3000);
	}

	// ==========================================
	// FUNÇÕES DE EXAMES LABORATORIAIS
	// ==========================================

	async function openLaboratoryModal() {
		labModo = "pacote";
		labPacoteSelecionado = "";
		labDataExecucao = ""; // Reseta data de execução
		labExameManual = { nome: "", valoresReferencia: "", unidade: "" };
		labSearch = "";
		labSearchResults = [];
		labExamesEmEdicao = []; // Limpa exames em edição
		labDialogRef?.showModal();
		// Carrega os pacotes disponíveis
		await carregarPacotesLaboratoriais();
	}

	function closeLaboratoryModal() {
		labDialogRef?.close();
	}

	/**
	 * Carrega a lista de pacotes únicos disponíveis
	 */
	async function carregarPacotesLaboratoriais() {
		labPacotesLoading = true;
		try {
			const response = await fetch("/api/exames?listarPacotes=true");
			const data = await response.json();
			if (!response.ok)
				throw new Error(data?.error || "Falha ao carregar pacotes.");
			labPacotesDisponiveis = data.pacotes ?? [];
		} catch (e) {
			erro = e instanceof Error ? e.message : "Erro ao carregar pacotes.";
		} finally {
			labPacotesLoading = false;
		}
	}

	/**
	 * Seleciona um pacote e carrega todos os exames associados
	 * @param {string} pacote
	 */
	async function selecionarPacoteLaboratorial(pacote) {
		if (!pacote) return;
		// Verifica se a data foi preenchida
		if (!labDataExecucao) {
			erro = "Informe a Data de Execução antes de selecionar um pacote.";
			return;
		}
		labPacoteSelecionado = pacote;
		labLoading = true;
		try {
			const response = await fetch(
				`/api/exames?pacote=${encodeURIComponent(pacote)}`,
			);
			const data = await response.json();
			if (!response.ok)
				throw new Error(
					data?.error || "Falha ao carregar exames do pacote.",
				);

			// Adiciona todos os exames do pacote à lista de edição
			const examesDoPacote = (data.exames ?? []).map(
				(
					/** @type {{ id: number; nome: string; valores_referencia: string | null; unidade_medida: string | null; significado: string | null; }} */ exame,
				) => ({
					id: createId(),
					nome: exame.nome,
					pacote: pacote,
					valoresReferencia: exame.valores_referencia || "",
					unidade: exame.unidade_medida || "",
					significado: exame.significado || "",
					dataExecucao: labDataExecucao,
					resultado: "",
					selecionado: false,
				}),
			);

			labExamesEmEdicao = [...labExamesEmEdicao, ...examesDoPacote];
		} catch (e) {
			erro =
				e instanceof Error
					? e.message
					: "Erro ao carregar exames do pacote.";
		} finally {
			labLoading = false;
		}
	}

	/**
	 * Remove um exame da lista de edição
	 * @param {string} id
	 */
	function removerExameDaEdicao(id) {
		labExamesEmEdicao = labExamesEmEdicao.filter((ex) => ex.id !== id);
	}

	/**
	 * Confirma os exames em edição e adiciona à lista principal
	 */
	function confirmarExamesLaboratoriais() {
		if (labExamesEmEdicao.length === 0) {
			erro = "Nenhum exame selecionado.";
			return;
		}
		// Valida que todos os exames têm data
		if (!labExamesEmEdicao.every((ex) => ex.dataExecucao)) {
			erro = "Todos os exames devem ter uma Data de Execução.";
			return;
		}
		laboratorioSelecionados = [
			...laboratorioSelecionados,
			...labExamesEmEdicao,
		];
		labExamesEmEdicao = [];
		labPacoteSelecionado = "";
		labDataExecucao = "";
		closeLaboratoryModal();
	}

	async function buscarExamesLaboratoriais() {
		labLoading = true;
		try {
			const params = new URLSearchParams({ page: "1", limit: "100" });
			if (labSearch.trim()) params.set("q", labSearch.trim());
			if (labPacoteSelecionado)
				params.set("pacote", labPacoteSelecionado);

			const response = await fetch(`/api/exames?${params.toString()}`);
			const data = await response.json();
			if (!response.ok)
				throw new Error(data?.error || "Falha ao buscar exames.");
			labSearchResults = data.items ?? [];
		} catch (e) {
			erro = e instanceof Error ? e.message : "Erro ao buscar exames.";
		} finally {
			labLoading = false;
		}
	}

	function scheduleLabSearch() {
		clearTimeout(labSearchTimer);
		labSearchTimer = setTimeout(buscarExamesLaboratoriais, 250);
	}

	/**
	 * @param {{ nome: string; pacote?: string | null; valores_referencia?: string | null; unidade_medida?: string | null; }} exame
	 */
	function adicionarExameLaboratorial(exame) {
		const novoExame = {
			id: createId(),
			nome: exame.nome,
			pacote: exame.pacote || labPacoteSelecionado || "Exame Avulso",
			valoresReferencia: exame.valores_referencia || "",
			unidade: exame.unidade_medida || "",
			resultado: "",
			selecionado: false,
		};
		laboratorioSelecionados = [...laboratorioSelecionados, novoExame];
	}

	function adicionarExameLaboratorialManual() {
		if (!labExameManual.nome.trim()) {
			erro = "Informe o nome do exame.";
			return;
		}
		const novoExame = {
			id: createId(),
			nome: labExameManual.nome.trim(),
			pacote: "Exame Manual",
			valoresReferencia: labExameManual.valoresReferencia.trim(),
			unidade: labExameManual.unidade.trim(),
			resultado: "",
			selecionado: false,
		};
		laboratorioSelecionados = [...laboratorioSelecionados, novoExame];
		labExameManual = { nome: "", valoresReferencia: "", unidade: "" };
		erro = "";
	}



	/**
	 * @param {string} id
	 */
	function excluirLaboratorio(id) {
		if (!window.confirm("Excluir este exame?")) return;
		laboratorioSelecionados = [
			...laboratorioSelecionados.filter((item) => item.id !== id),
		];
	}

	function excluirLaboratorioSelecionados() {
		if (!window.confirm("Excluir os exames selecionados?")) return;
		laboratorioSelecionados = [
			...laboratorioSelecionados.filter((item) => !item.selecionado),
		];
	}

	function toggleTodosLaboratorio() {
		const novoEstado = !laboratorioSelecionadosTodos;
		laboratorioSelecionados = laboratorioSelecionados.map((item) => ({
			...item,
			selecionado: novoEstado,
		}));
	}

	/**
	 * @param {any[]} itens
	 */
	function toggleGrupoLaboratorio(itens) {
		const novoEstado = !itens.every((i) => i.selecionado);
		const idsDoGrupo = new Set(itens.map((i) => i.id));
		laboratorioSelecionados = laboratorioSelecionados.map((item) =>
			idsDoGrupo.has(item.id)
				? { ...item, selecionado: novoEstado }
				: item,
		);
	}

	// ==========================================
	// FUNÇÕES DE EXAMES DE IMAGEM/FUNCIONAIS
	// ==========================================

	function openImagemModal() {
		imagemExameManual = "";
		imagemDataRealizacao = "";
		imagemSearch = "";
		imagemSearchResults = [];
		imagemDialogRef?.showModal();
	}

	function closeImagemModal() {
		imagemDialogRef?.close();
	}

	async function buscarProcedimentos() {
		imagemLoading = true;
		try {
			const params = new URLSearchParams({ page: "1", limit: "50" });
			if (imagemSearch.trim()) params.set("q", imagemSearch.trim());

			const response = await fetch(
				`/api/procedimentos?${params.toString()}`,
			);
			const data = await response.json();
			if (!response.ok)
				throw new Error(
					data?.error || "Falha ao buscar procedimentos.",
				);
			imagemSearchResults = data.items ?? [];
		} catch (e) {
			erro =
				e instanceof Error
					? e.message
					: "Erro ao buscar procedimentos.";
		} finally {
			imagemLoading = false;
		}
	}

	function scheduleImagemSearch() {
		clearTimeout(imagemSearchTimer);
		imagemSearchTimer = setTimeout(buscarProcedimentos, 250);
	}

	/**
	 * @param {{ descricao: string; }} procedimento
	 */
	function adicionarExameImagem(procedimento) {
		const novoExame = {
			id: createId(),
			nome: procedimento.descricao,
			dataRealizacao: imagemDataRealizacao,
			motivo: "",
			resultado: "",
			medicoExecutor: "",
		};
		imagemSelecionados = [...imagemSelecionados, novoExame];
	}

	function adicionarExameImagemManual() {
		if (!imagemExameManual.trim()) {
			erro = "Informe o nome do exame.";
			return;
		}
		const novoExame = {
			id: createId(),
			nome: imagemExameManual.trim(),
			dataRealizacao: imagemDataRealizacao,
			motivo: "",
			resultado: "",
			medicoExecutor: "",
		};
		imagemSelecionados = [...imagemSelecionados, novoExame];
		imagemExameManual = "";
		imagemDataRealizacao = "";
	}

	/**
	 * @param {string} id
	 */
	function excluirImagem(id) {
		if (!window.confirm("Excluir este exame?")) return;
		imagemSelecionados = [
			...imagemSelecionados.filter((item) => item.id !== id),
		];
	}

	async function carregarCalculadoras() {
		calculadorasLoading = true;
		try {
			const res = await fetch("/api/calculadoras");
			const data = await res.json();
			if (res.ok) {
				areasClinicas = data.areas || [];
				calculadorasRisco = data.calculadoras || [];
			}
		} catch (e) {
			console.error("Erro ao carregar calculadoras", e);
		} finally {
			calculadorasLoading = false;
		}
	}

	function openCalculadorasModal() {
		console.log("Tentando abrir modal. DialogRef:", calculadorasDialogRef);
		calculadorasTab = "lista";
		carregarCalculadoras();
		if (calculadorasDialogRef) {
			calculadorasDialogRef.showModal();
		} else {
			alert(
				"Erro: A janela pop-up não pôde ser instanciada pelo navegador.",
			);
		}
	}

	function closeCalculadorasModal() {
		calculadorasDialogRef?.close();
	}

	async function salvarNovaArea() {
		if (!novaAreaNome.trim()) return;
		try {
			const res = await fetch("/api/calculadoras", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tipo: "area", nome: novaAreaNome }),
			});
			if (res.ok) {
				novaAreaNome = "";
				carregarCalculadoras();
			} else {
				alert("Erro ao salvar área");
			}
		} catch (e) {
			alert("Erro na requisição");
		}
	}

	async function salvarNovaCalculadora() {
		if (!novaCalc.area_id || !novaCalc.nome.trim() || !novaCalc.link.trim())
			return;
		try {
			const res = await fetch("/api/calculadoras", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tipo: "calculadora", ...novaCalc }),
			});
			if (res.ok) {
				novaCalc = { area_id: "", nome: "", descricao: "", link: "" };
				carregarCalculadoras();
				calculadorasTab = "lista";
			} else {
				alert("Erro ao salvar calculadora");
			}
		} catch (e) {
			alert("Erro na requisição");
		}
	}

	onMount(() => {
		let loaded = false;
		const unsubscribe = consultaDraft.subscribe((draft) => {
			if (!loaded) {
				applyDraftSnapshot(draft);
				loaded = true;
				draftHydrated = true;
			}
		});

		// Carrega doenças, medicamentos e exames de forma independente com reatividade garantida
		const storedDiseases = loadFromLocalStorage(DISEASES_STORAGE_KEY, []);
		const storedMedications = loadFromLocalStorage(
			MEDICATIONS_STORAGE_KEY,
			[],
		);
		const storedLaboratorio = loadFromLocalStorage(
			LABORATORIO_STORAGE_KEY,
			[],
		);
		const storedImagem = loadFromLocalStorage(IMAGEM_STORAGE_KEY, []);

		if (Array.isArray(storedDiseases) && storedDiseases.length > 0) {
			diseases = [...storedDiseases]; // Reatividade por propagação
		}
		if (Array.isArray(storedMedications) && storedMedications.length > 0) {
			medications = storedMedications.map((item) => ({
				...item,
				diario: normalizeDailyFrequency(item.diario),
				doseQual: item.doseQual || "",
			})); // Reatividade por propagação via map
		}
		if (Array.isArray(storedLaboratorio) && storedLaboratorio.length > 0) {
			laboratorioSelecionados = [...storedLaboratorio]; // Reatividade por propagação
		}
		if (Array.isArray(storedImagem) && storedImagem.length > 0) {
			imagemSelecionados = [...storedImagem]; // Reatividade por propagação
		}

		carregarGuias();
		return unsubscribe;
	});
	onDestroy(() => {
		clearTimeout(diseaseSearchTimer);
		clearTimeout(medicationSearchTimer);
		clearTimeout(labSearchTimer);
		clearTimeout(imagemSearchTimer);
	});
</script>

<svelte:head>
	<title>Consulta Médica</title>
</svelte:head>

<main class="min-h-screen bg-slate-100 py-5">
	<div class="mx-auto max-w-7xl px-3 sm:px-4">
		<header
			class="mb-4 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm"
		>
			<p
				class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500"
			>
				Consulta Médica
			</p>
			<div
				class="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
			>
				<div class="max-w-3xl">
					<h1
						class="text-2xl font-semibold tracking-tight text-slate-900"
					>
						Estrutura SOAP avançada para atendimento ambulatorial
					</h1>
					<p class="mt-1 text-sm text-slate-600">
						Monte o raciocínio clínico com histórico estratificado
						por CID-10, medicações agrupadas por classe e
						textos-guia editáveis.
					</p>
				</div>
				<div class="flex flex-col gap-2">
					<div
						class="grid gap-2 text-xs text-slate-600 sm:grid-cols-3"
					>
						<div
							class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
						>
							<p class="font-semibold text-slate-800">
								{diseases.length}
							</p>
							<p>Doenças registradas</p>
						</div>
						<div
							class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
						>
							<p class="font-semibold text-slate-800">
								{medications.length}
							</p>
							<p>Medicamentos ativos</p>
						</div>
						<div
							class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
						>
							<p class="font-semibold text-slate-800">
								{Object.values(familyHistory).filter(
									(item) => item.checked,
								).length}
							</p>
							<p>Antecedentes familiares</p>
						</div>
					</div>
					<button
						type="button"
						on:click={exportarPDF}
						class="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
					>
						Exportar Consulta (PDF)
					</button>
					<button
						type="button"
						on:click={() => resetDialogRef?.showModal()}
						class="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
					>
						Limpar memória / Nova consulta
					</button>
				</div>
			</div>
		</header>

		{#if erro}
			<p
				class="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
			>
				{erro}
			</p>
		{/if}
		{#if guideWarning}
			<p
				class="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
			>
				{guideWarning}
			</p>
		{/if}
		{#if aviso}
			<p
				class="mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700"
			>
				{aviso}
			</p>
		{/if}

		<div class="space-y-4">
			<details
				open
				class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
			>
				<summary
					class="flex cursor-pointer list-none items-center justify-between bg-slate-900 px-5 py-4 text-white"
				>
					<div>
						<p
							class="text-xs uppercase tracking-[0.28em] text-slate-300"
						>
							SOAP
						</p>
						<h2 class="text-lg font-semibold">S | Subjetivo</h2>
					</div>
					<div class="flex items-center gap-3">
						<button
							type="button"
							on:click|stopPropagation={exportarSubjetivo}
							class="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/30"
						>
							Copiar Anamnese (S)
						</button>
						<span
							class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200"
							>História clínica</span
						>
					</div>
				</summary>

				<div class="space-y-4 p-4">
					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900"
							>Identificação</summary
						>
						<div
							class="grid gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-4"
						>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Idade</span>
								<input
									bind:value={subjective.identificacao.idade}
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Ocupação</span>
								<input
									bind:value={
										subjective.identificacao.ocupacao
									}
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Naturalidade</span>
								<input
									bind:value={
										subjective.identificacao.naturalidade
									}
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Nome do acompanhante</span>
								<input
									bind:value={
										subjective.identificacao.acompanhante
									}
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>

							<div
								class="space-y-2 text-xs text-slate-700 xl:col-span-2"
							>
								<span class="block">Sexo biológico</span>
								<div class="flex flex-wrap gap-2">
									<label
										class="rounded-full border border-slate-300 bg-white px-3 py-1.5"
										><input
											class="mr-1"
											type="radio"
											bind:group={
												subjective.identificacao.sexo
											}
											value="Feminino"
										/>Feminino</label
									>
									<label
										class="rounded-full border border-slate-300 bg-white px-3 py-1.5"
										><input
											class="mr-1"
											type="radio"
											bind:group={
												subjective.identificacao.sexo
											}
											value="Masculino"
										/>Masculino</label
									>
								</div>
							</div>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Gênero</span>
								<select
									bind:value={subjective.identificacao.genero}
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								>
									<option value="">Selecione</option>
									{#each generoOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.genero === "Outros"}
									<input
										type="text"
										bind:value={
											subjective.identificacao.generoOutro
										}
										placeholder="Especifique"
										class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									/>
								{/if}
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Raça</span>
								<select
									bind:value={subjective.identificacao.raca}
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								>
									<option value="">Selecione</option>
									{#each racaOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.raca === "Outros"}
									<input
										type="text"
										bind:value={
											subjective.identificacao.racaOutro
										}
										placeholder="Especifique"
										class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									/>
								{/if}
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Estado civil</span>
								<select
									bind:value={
										subjective.identificacao.estadoCivil
									}
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								>
									<option value="">Selecione</option>
									{#each estadoCivilOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.estadoCivil === "Outros"}
									<input
										type="text"
										bind:value={
											subjective.identificacao
												.estadoCivilOutro
										}
										placeholder="Especifique"
										class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									/>
								{/if}
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Escolaridade</span>
								<select
									bind:value={
										subjective.identificacao.escolaridade
									}
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								>
									<option value="">Selecione</option>
									{#each escolaridadeOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.escolaridade === "Outros"}
									<input
										type="text"
										bind:value={
											subjective.identificacao
												.escolaridadeOutro
										}
										placeholder="Especifique"
										class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									/>
								{/if}
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Religião</span>
								<select
									bind:value={
										subjective.identificacao.religiao
									}
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								>
									<option value="">Selecione</option>
									{#each religiaoOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.religiao === "Outros"}
									<input
										type="text"
										bind:value={
											subjective.identificacao
												.religiaoOutro
										}
										placeholder="Especifique"
										class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									/>
								{/if}
							</label>
						</div>
					</details>

					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900"
							>Queixa Principal</summary
						>
						<div class="px-4 pb-4">
							<input
								bind:value={subjective.queixaPrincipal}
								placeholder="Dor torácica há 2 semanas, dispneia aos esforços..."
								class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
						</div>
					</details>

					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900"
							>História da Moléstia Atual (HMA)</summary
						>
						<section class="px-4 pb-4">
							<div
								class="rounded-2xl border border-slate-200 bg-white p-4"
							>
								<div
									class="mb-2 flex items-start justify-between gap-3"
								>
									<div>
										<h3
											class="text-sm font-semibold text-slate-900"
										>
											HMA
										</h3>
										<p class="text-xs text-slate-500">
											Linha narrativa da queixa atual.
										</p>
									</div>
									<div class="flex items-center gap-2">
										<span
											class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600"
											>i</span
										>
										<button
											type="button"
											on:click={() =>
												openGuideEditor("hma")}
											class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
											>Editar</button
										>
									</div>
								</div>
								<div class="relative">
									<textarea
										use:autogrow
										bind:value={subjective.hma}
										on:focus={() =>
											(activeGuideKey = "hma")}
										on:blur={() => (activeGuideKey = "")}
										rows="5"
										class="relative z-10 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									></textarea>
									{#if activeGuideKey === "hma"}
										<p
											class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xl rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm"
										>
											{guides.hma}
										</p>
									{/if}
								</div>
							</div>
						</section>
					</details>

					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900"
							>Revisão de Sistemas</summary
						>
						<section class="px-4 pb-4">
							<div
								class="rounded-2xl border border-slate-200 bg-white p-4"
							>
								<div
									class="mb-2 flex items-start justify-between gap-3"
								>
									<div>
										<h3
											class="text-sm font-semibold text-slate-900"
										>
											Revisão de Sistemas
										</h3>
										<p class="text-xs text-slate-500">
											Checklist narrativo focado nos
											sistemas.
										</p>
									</div>
									<div class="flex items-center gap-2">
										<span
											class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600"
											>i</span
										>
										<button
											type="button"
											on:click={() =>
												openGuideEditor(
													"revisao_sistemas",
												)}
											class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
											>Editar</button
										>
									</div>
								</div>
								<div class="relative">
									<textarea
										use:autogrow
										bind:value={subjective.revisaoSistemas}
										on:focus={() =>
											(activeGuideKey =
												"revisao_sistemas")}
										on:blur={() => (activeGuideKey = "")}
										rows="5"
										class="relative z-10 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									></textarea>
									{#if activeGuideKey === "revisao_sistemas"}
										<p
											class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xl rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm"
										>
											{guides.revisao_sistemas}
										</p>
									{/if}
								</div>
							</div>
						</section>
					</details>

					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900"
							>História Patológica Pregressa</summary
						>
						<div
							class="grid gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-4"
						>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Alergia</span>
								<textarea
									use:autogrow
									bind:value={subjective.patologicos.alergia}
									rows="3"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Cirurgias</span>
								<textarea
									use:autogrow
									bind:value={
										subjective.patologicos.cirurgias
									}
									rows="3"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Internações</span>
								<textarea
									use:autogrow
									bind:value={
										subjective.patologicos.internacoes
									}
									rows="3"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Traumatismos</span>
								<textarea
									use:autogrow
									bind:value={
										subjective.patologicos.traumatismos
									}
									rows="3"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</label>
						</div>

						<div class="border-t border-slate-200 px-4 py-4">
							<div
								class="mb-3 flex items-center justify-between gap-3"
							>
								<div>
									<h3
										class="text-sm font-semibold text-slate-900"
									>
										Doenças estratificadas por CID-10
									</h3>
									<p class="text-xs text-slate-500">
										Agrupamento automático por capítulo com
										edição local do histórico.
									</p>
								</div>
								<button
									type="button"
									on:click={() => openDiseaseModal()}
									class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
									>Adicionar Doença</button
								>
							</div>

							{#if Object.keys(diseaseGroups).length === 0}
								<div
									class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500"
								>
									Nenhuma doença adicionada.
								</div>
							{:else}
								<div class="space-y-3">
									{#each Object.entries(diseaseGroups) as [chapter, items]}
										<section
											class="rounded-2xl border border-slate-200 bg-white p-3"
										>
											<div
												class="mb-2 flex items-center justify-between"
											>
												<h4
													class="text-sm font-semibold text-slate-900"
												>
													{chapter}
												</h4>
												<span
													class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
													>{items.length} item(ns)</span
												>
											</div>
											<div class="space-y-2">
												{#each items as item}
													<article
														class="rounded-2xl border border-slate-200 bg-slate-50 p-3"
													>
														<div
															class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
														>
															<div>
																<p
																	class="text-sm font-semibold text-slate-900"
																>
																	{item.subcat_desc}
																</p>
																<p
																	class="text-xs text-slate-500"
																>
																	{item.subcat ||
																		"Sem código"}{item.cat_desc
																		? ` • ${item.cat_desc}`
																		: ""}
																	{item.mesAnoDiagnostico
																		? ` • Diagnóstico: ${item.mesAnoDiagnostico}`
																		: ""}
																</p>
																{#if item.historico}
																	<p
																		class="mt-2 text-xs text-slate-700"
																	>
																		<span
																			class="font-semibold"
																			>Histórico:</span
																		>
																		{item.historico}
																	</p>
																{/if}
																{#if item.queixasAtuais}
																	<p
																		class="mt-1 text-xs text-slate-700"
																	>
																		<span
																			class="font-semibold"
																			>Queixas
																			atuais:</span
																		>
																		{item.queixasAtuais}
																	</p>
																{/if}
															</div>
															<div
																class="flex items-center gap-2"
															>
																<button
																	type="button"
																	on:click={() =>
																		openDiseaseModal(
																			item,
																		)}
																	class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white"
																	>Editar</button
																>
																<button
																	type="button"
																	on:click={() =>
																		deleteDisease(
																			item.id,
																		)}
																	class="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
																	>Excluir</button
																>
															</div>
														</div>
													</article>
												{/each}
											</div>
										</section>
									{/each}
								</div>
							{/if}
						</div>

						<div class="border-t border-slate-200 px-4 py-4">
							<div
								class="mb-3 flex items-center justify-between gap-3"
							>
								<div>
									<h3
										class="text-sm font-semibold text-slate-900"
									>
										Medicamentos
									</h3>
									<p class="text-xs text-slate-500">
										Busca em tempo real na base RENAME e
										organização automática por classe.
									</p>
								</div>
								<button
									type="button"
									on:click={() => openMedicationModal()}
									class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
									>Adicionar Medicamento</button
								>
							</div>

							{#if Object.keys(medicationGroups).length === 0}
								<div
									class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500"
								>
									Nenhum medicamento adicionado.
								</div>
							{:else}
								<div class="space-y-3">
									{#each Object.entries(medicationGroups) as [group, items]}
										<section
											class="rounded-2xl border border-slate-200 bg-white p-3"
										>
											<div
												class="mb-2 flex items-center justify-between"
											>
												<h4
													class="text-sm font-semibold text-slate-900"
												>
													{group}
												</h4>
												<span
													class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
													>{items.length} item(ns)</span
												>
											</div>
											<div
												class="grid gap-2 xl:grid-cols-2"
											>
												{#each items as item}
													<div
														role="button"
														tabindex="0"
														on:click={() =>
															pesquisarMedicamento(
																item.principio_ativo,
															)}
														on:keydown={(event) => {
															if (
																event.key ===
																"Enter"
															)
																pesquisarMedicamento(
																	item.principio_ativo,
																);
														}}
														class="group relative cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-400 hover:bg-white"
													>
														<div
															class="flex items-start justify-between gap-3"
														>
															<div
																class="min-w-0 space-y-1"
															>
																<p
																	class="text-base font-semibold text-slate-900"
																>
																	{item.principio_ativo}
																</p>
																<p
																	class="text-sm text-slate-700"
																>
																	{[
																		item.concentracao,
																		item.forma_farmaceutica,
																	]
																		.filter(
																			Boolean,
																		)
																		.join(
																			" • ",
																		) ||
																		"Concentração e forma não informadas"}
																</p>
																<p
																	class="text-xs text-slate-700"
																>
																	{describeFrequency(
																		item,
																	)}
																</p>
																{#if item.observacoes}
																	<p
																		class="pt-1 text-xs text-slate-600"
																	>
																		{item.observacoes}
																	</p>
																{/if}
															</div>
															<div
																class="flex items-center gap-2"
															>
																<button
																	type="button"
																	on:click|stopPropagation={() =>
																		openMedicationModal(
																			item,
																		)}
																	class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white"
																	>Editar</button
																>
																<button
																	type="button"
																	on:click|stopPropagation={() =>
																		deleteMedication(
																			item.id,
																		)}
																	class="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
																	>Excluir</button
																>
															</div>
														</div>
														<div
															class="pointer-events-none absolute right-3 top-3 z-20 hidden max-w-xs rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-xs text-slate-600 opacity-90 shadow-xl backdrop-blur group-hover:block"
														>
															<p>
																<span
																	class="font-semibold"
																	>Fornecimento SUS:</span
																>
																{item.fornecimento_sus ||
																	"Não informado"}
															</p>
														</div>
													</div>
												{/each}
											</div>
										</section>
									{/each}
								</div>
							{/if}
						</div>
					</details>

					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900"
							>História Familiar</summary
						>
						<div class="grid gap-3 px-4 pb-4 lg:grid-cols-2">
							{#each familyHistoryOptions as option}
								<div
									class="rounded-2xl border border-slate-200 bg-white p-3"
								>
									<div
										class="flex items-center justify-between gap-2"
									>
										<label
											class="flex items-center gap-2 text-sm font-medium text-slate-800"
										>
											<input
												type="checkbox"
												bind:checked={
													familyHistory[option.id]
														.checked
												}
											/>
											{option.label}
										</label>
										{#if familyHistory[option.id].checked}
											<button
												type="button"
												on:click={() =>
													addFamilyRelative(
														option.id,
													)}
												class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-100"
												aria-label={`Adicionar parente com ${option.label}`}
											>
												+
											</button>
										{/if}
									</div>
									{#if familyHistory[option.id].checked}
										<div class="mt-3 space-y-2">
											{#each familyHistory[option.id].parentes as relative}
												<div
													class="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-[1fr_0.8fr_auto]"
												>
													<label
														class="space-y-1 text-xs text-slate-700"
													>
														<span
															>Grau de parentesco</span
														>
														<input
															bind:value={
																relative.parentesco
															}
															placeholder="Pai, avó, irmão..."
															class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
														/>
													</label>
													<label
														class="space-y-1 text-xs text-slate-700"
													>
														<span
															>Idade do familiar</span
														>
														<input
															bind:value={
																relative.idade
															}
															placeholder="50 anos"
															class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
														/>
													</label>
													<button
														type="button"
														on:click={() =>
															removeFamilyRelative(
																option.id,
																relative.id,
															)}
														disabled={familyHistory[
															option.id
														].parentes.length <= 1}
														class="self-end rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
													>
														Remover
													</button>
												</div>
											{/each}
											{#if option.id === "outros"}
												<label
													class="block space-y-1 text-xs text-slate-700"
												>
													<span>Detalhes</span>
													<input
														bind:value={
															familyHistory[
																option.id
															].detalhes
														}
														class="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
													/>
												</label>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</details>

					<div class="grid gap-4 lg:grid-cols-3">
						<section
							class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
						>
							<div
								class="mb-2 flex items-start justify-between gap-3"
							>
								<div>
									<h3
										class="text-sm font-semibold text-slate-900"
									>
										História Ocupacional
									</h3>
									<p class="text-xs text-slate-500">
										Exposição e carga laboral.
									</p>
								</div>
								<div class="flex items-center gap-2">
									<span
										class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600"
										>i</span
									>
									<button
										type="button"
										on:click={() =>
											openGuideEditor("ocupacional")}
										class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white"
										>Editar</button
									>
								</div>
							</div>
							<div class="relative">
								<textarea
									use:autogrow
									bind:value={subjective.ocupacional}
									on:focus={() =>
										(activeGuideKey = "ocupacional")}
									on:blur={() => (activeGuideKey = "")}
									rows="4"
									class="relative z-10 w-full rounded-xl border border-slate-300 bg-white/85 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
								{#if activeGuideKey === "ocupacional"}
									<p
										class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xs rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm"
									>
										{guides.ocupacional}
									</p>
								{/if}
							</div>
						</section>

						<section
							class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
						>
							<div
								class="mb-2 flex items-start justify-between gap-3"
							>
								<div>
									<h3
										class="text-sm font-semibold text-slate-900"
									>
										História Psicossocial
									</h3>
									<p class="text-xs text-slate-500">
										Rede de apoio e vulnerabilidades.
									</p>
								</div>
								<div class="flex items-center gap-2">
									<span
										class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600"
										>i</span
									>
									<button
										type="button"
										on:click={() =>
											openGuideEditor("psicossocial")}
										class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white"
										>Editar</button
									>
								</div>
							</div>
							<div class="relative">
								<textarea
									use:autogrow
									bind:value={subjective.psicossocial}
									on:focus={() =>
										(activeGuideKey = "psicossocial")}
									on:blur={() => (activeGuideKey = "")}
									rows="4"
									class="relative z-10 w-full rounded-xl border border-slate-300 bg-white/85 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
								{#if activeGuideKey === "psicossocial"}
									<p
										class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xs rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm"
									>
										{guides.psicossocial}
									</p>
								{/if}
							</div>
						</section>

						<section
							class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
						>
							<div
								class="mb-2 flex items-start justify-between gap-3"
							>
								<div>
									<h3
										class="text-sm font-semibold text-slate-900"
									>
										Hábitos de Vida
									</h3>
									<p class="text-xs text-slate-500">
										Sono, atividade física, substâncias e
										rotina.
									</p>
								</div>
								<div class="flex items-center gap-2">
									<span
										class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600"
										>i</span
									>
									<button
										type="button"
										on:click={() =>
											openGuideEditor("habitos")}
										class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white"
										>Editar</button
									>
								</div>
							</div>
							<div class="relative">
								<textarea
									use:autogrow
									bind:value={subjective.habitos}
									on:focus={() =>
										(activeGuideKey = "habitos")}
									on:blur={() => (activeGuideKey = "")}
									rows="4"
									class="relative z-10 w-full rounded-xl border border-slate-300 bg-white/85 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
								{#if activeGuideKey === "habitos"}
									<p
										class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xs rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm"
									>
										{guides.habitos}
									</p>
								{/if}
							</div>
							<div
								class="mt-4 rounded-2xl border border-slate-200 bg-white p-3"
							>
								<div
									class="mb-3 flex items-start justify-between gap-3"
								>
									<div>
										<h4
											class="text-sm font-semibold text-slate-900"
										>
											Recordatório Alimentar
										</h4>
										<p class="text-xs text-slate-500">
											Registro das refeições do dia.
										</p>
									</div>
									<div class="flex items-center gap-2">
										<span
											class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600"
											>i</span
										>
										<button
											type="button"
											on:click={() =>
												openGuideEditor(
													"recordatorio_alimentar",
												)}
											class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
											>Editar</button
										>
									</div>
								</div>
								<div class="relative">
									<div class="grid gap-2">
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>Café da manhã</span><input
												bind:value={
													subjective
														.recordatorioAlimentar
														.cafeManha
												}
												on:focus={() =>
													(activeGuideKey =
														"recordatorio_alimentar")}
												on:blur={() =>
													(activeGuideKey = "")}
												class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>Lanche da manhã</span><input
												bind:value={
													subjective
														.recordatorioAlimentar
														.lancheManha
												}
												on:focus={() =>
													(activeGuideKey =
														"recordatorio_alimentar")}
												on:blur={() =>
													(activeGuideKey = "")}
												class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>Almoço</span><input
												bind:value={
													subjective
														.recordatorioAlimentar
														.almoco
												}
												on:focus={() =>
													(activeGuideKey =
														"recordatorio_alimentar")}
												on:blur={() =>
													(activeGuideKey = "")}
												class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>Lanche da tarde</span><input
												bind:value={
													subjective
														.recordatorioAlimentar
														.lancheTarde
												}
												on:focus={() =>
													(activeGuideKey =
														"recordatorio_alimentar")}
												on:blur={() =>
													(activeGuideKey = "")}
												class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>Café da tarde</span><input
												bind:value={
													subjective
														.recordatorioAlimentar
														.cafeTarde
												}
												on:focus={() =>
													(activeGuideKey =
														"recordatorio_alimentar")}
												on:blur={() =>
													(activeGuideKey = "")}
												class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>Lanche antes do jantar</span
											><input
												bind:value={
													subjective
														.recordatorioAlimentar
														.lancheAntesJantar
												}
												on:focus={() =>
													(activeGuideKey =
														"recordatorio_alimentar")}
												on:blur={() =>
													(activeGuideKey = "")}
												class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>Jantar</span><input
												bind:value={
													subjective
														.recordatorioAlimentar
														.jantar
												}
												on:focus={() =>
													(activeGuideKey =
														"recordatorio_alimentar")}
												on:blur={() =>
													(activeGuideKey = "")}
												class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>Lanche depois do jantar</span
											><input
												bind:value={
													subjective
														.recordatorioAlimentar
														.lancheDepoisJantar
												}
												on:focus={() =>
													(activeGuideKey =
														"recordatorio_alimentar")}
												on:blur={() =>
													(activeGuideKey = "")}
												class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
									</div>
									{#if activeGuideKey === "recordatorio_alimentar"}
										<p
											class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xs rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm"
										>
											{guides.recordatorio_alimentar}
										</p>
									{/if}
								</div>
							</div>
						</section>
					</div>
					{#if subjective.identificacao.sexo === "Feminino"}
						<details
							open
							class="rounded-2xl border border-slate-200 bg-slate-50/70"
						>
							<summary
								class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900"
								>História Ginecológica</summary
							>
							<div
								class="grid gap-3 px-4 pb-4 lg:grid-cols-[1fr_1fr_1fr]"
							>
								<section
									class="rounded-2xl border border-slate-200 bg-white p-3 lg:col-span-3"
								>
									<p
										class="mb-2 text-xs font-semibold text-slate-700"
									>
										GPNCAE
									</p>
									<div
										class="grid grid-cols-3 gap-2 sm:grid-cols-6"
									>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>G</span><input
												type="number"
												min="0"
												bind:value={
													subjective.ginecologica.g
												}
												class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>P</span><input
												type="number"
												min="0"
												bind:value={
													subjective.ginecologica.p
												}
												class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>N</span><input
												type="number"
												min="0"
												bind:value={
													subjective.ginecologica.n
												}
												class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>C</span><input
												type="number"
												min="0"
												bind:value={
													subjective.ginecologica.c
												}
												class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>A</span><input
												type="number"
												min="0"
												bind:value={
													subjective.ginecologica.a
												}
												class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
										<label
											class="space-y-1 text-xs text-slate-700"
											><span>E</span><input
												type="number"
												min="0"
												bind:value={
													subjective.ginecologica.e
												}
												class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
											/></label
										>
									</div>
								</section>
								<label class="space-y-1 text-xs text-slate-700">
									<span>DUM</span>
									<input
										type="date"
										bind:value={subjective.ginecologica.dum}
										class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									/>
								</label>
								<label
									class="space-y-1 text-xs text-slate-700 lg:col-span-2"
								>
									<span>MAC</span>
									<input
										bind:value={subjective.ginecologica.mac}
										placeholder="Métodos anticoncepcionais"
										class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									/>
								</label>
							</div>
						</details>
					{/if}
				</div>
			</details>

			<details
				open
				class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
			>
				<summary
					class="flex cursor-pointer list-none items-center justify-between bg-slate-800 px-5 py-4 text-white"
				>
					<div>
						<p
							class="text-xs uppercase tracking-[0.28em] text-slate-300"
						>
							SOAP
						</p>
						<h2 class="text-lg font-semibold">O | Objetivo</h2>
					</div>
					<div class="flex items-center gap-3">
						<button
							type="button"
							on:click|stopPropagation={exportarObjetivo}
							class="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/30"
						>
							Copiar Exame Físico e Testes (O)
						</button>
						<span
							class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200"
							>Exame físico e métricas</span
						>
					</div>
				</summary>

				<div class="space-y-4 p-4">
					<!-- Sinais Vitais -->
					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900"
						>
							<span>Sinais Vitais</span>
							<span
								class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
								>i</span
							>
						</summary>
						<div
							class="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
						>
							<label class="space-y-1 text-xs text-slate-700">
								<span>PAS (mmHg)</span>
								<input
									type="number"
									bind:value={objective.sinaisVitais.pas}
									placeholder="120"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>PAD (mmHg)</span>
								<input
									type="number"
									bind:value={objective.sinaisVitais.pad}
									placeholder="80"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Temperatura (°C)</span>
								<input
									type="number"
									step="0.1"
									bind:value={
										objective.sinaisVitais.temperatura
									}
									placeholder="36.5"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>FC (bpm)</span>
								<input
									type="number"
									bind:value={
										objective.sinaisVitais
											.frequenciaCardiaca
									}
									placeholder="72"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>FR (irpm)</span>
								<input
									type="number"
									bind:value={
										objective.sinaisVitais
											.frequenciaRespiratoria
									}
									placeholder="16"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>SpO2 (%)</span>
								<input
									type="number"
									bind:value={objective.sinaisVitais.spo2}
									placeholder="98"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
						</div>
					</details>

					<!-- Dados Antropométricos -->
					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900"
						>
							<span>Dados Antropométricos</span>
							<span
								class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
								>i</span
							>
						</summary>
						<div
							class="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4"
						>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Altura (cm)</span>
								<input
									type="number"
									bind:value={objective.antropometria.altura}
									placeholder="170"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Peso (kg)</span>
								<input
									type="number"
									step="0.1"
									bind:value={objective.antropometria.peso}
									placeholder="70.5"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Circunferência Abdominal (cm)</span>
								<input
									type="number"
									step="0.1"
									bind:value={
										objective.antropometria
											.circunferenciaAbdominal
									}
									placeholder="85.0"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>IMC (calculado)</span>
								<input
									type="text"
									readonly
									bind:value={objective.antropometria.imc}
									placeholder="--"
									class="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 font-semibold text-slate-700 outline-none"
								/>
							</label>
						</div>
					</details>

					<!-- Exame Físico -->
					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900"
							>Exame Físico</summary
						>
						<div class="space-y-3 px-4 pb-4">
							<!-- Geral -->
							<div
								class="rounded-2xl border border-slate-200 bg-white p-3"
							>
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span
											class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
											>i</span
										>
										<span
											class="text-xs font-semibold text-slate-700"
											>Geral (Ectoscopia, estado geral,
											consciência)</span
										>
									</div>
									<button
										type="button"
										on:click={() =>
											(objective.exameFisico.geral =
												loadTemplate(
													"ef_geral",
													objective.exameFisico.geral,
												))}
										class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
									>
										Carregar Template
									</button>
								</div>
								<textarea
									use:autogrow
									bind:value={objective.exameFisico.geral}
									rows="3"
									placeholder="Descreva o estado geral, consciência, marcha, ectoscopia..."
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</div>

							<!-- Aparelho Digestório -->
							<div
								class="rounded-2xl border border-slate-200 bg-white p-3"
							>
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span
											class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
											>i</span
										>
										<span
											class="text-xs font-semibold text-slate-700"
											>Aparelho Digestório</span
										>
									</div>
									<button
										type="button"
										on:click={() =>
											(objective.exameFisico.aparelhoDigestorio =
												loadTemplate(
													"ef_digestorio",
													objective.exameFisico.aparelhoDigestorio,
												))}
										class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
									>
										Carregar Template
									</button>
								</div>
								<textarea
									use:autogrow
									bind:value={
										objective.exameFisico.aparelhoDigestorio
									}
									rows="3"
									placeholder="Inspeção, palpação, percussão, ausculta abdominal..."
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</div>

							<!-- Aparelho Cardiovascular -->
							<div
								class="rounded-2xl border border-slate-200 bg-white p-3"
							>
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span
											class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
											>i</span
										>
										<span
											class="text-xs font-semibold text-slate-700"
											>Aparelho Cardiovascular</span
										>
									</div>
									<button
										type="button"
										on:click={() =>
											(objective.exameFisico.aparelhoCardiovascular =
												loadTemplate(
													"ef_cardiovascular",
													objective.exameFisico.aparelhoCardiovascular,
												))}
										class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
									>
										Carregar Template
									</button>
								</div>
								<textarea
									use:autogrow
									bind:value={
										objective.exameFisico
											.aparelhoCardiovascular
									}
									rows="3"
									placeholder="Inspeção, palpação, ausculta cardíaca e periférica..."
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</div>

							<!-- Sistema Linfático -->
							<div
								class="rounded-2xl border border-slate-200 bg-white p-3"
							>
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span
											class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
											>i</span
										>
										<span
											class="text-xs font-semibold text-slate-700"
											>Sistema Linfático</span
										>
									</div>
									<button
										type="button"
										on:click={() =>
											(objective.exameFisico.sistemaLinfatico =
												loadTemplate(
													"ef_linfatico",
													objective.exameFisico.sistemaLinfatico,
												))}
										class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
									>
										Carregar Template
									</button>
								</div>
								<textarea
									use:autogrow
									bind:value={
										objective.exameFisico.sistemaLinfatico
									}
									rows="2"
									placeholder="Linfonodos palpáveis, características..."
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</div>

							<!-- Neurológico -->
							<div
								class="rounded-2xl border border-slate-200 bg-white p-3"
							>
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span
											class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
											>i</span
										>
										<span
											class="text-xs font-semibold text-slate-700"
											>Neurológico</span
										>
									</div>
									<button
										type="button"
										on:click={() =>
											(objective.exameFisico.neurologico =
												loadTemplate(
													"ef_neurologico",
													objective.exameFisico.neurologico,
												))}
										class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
									>
										Carregar Template
									</button>
								</div>
								<textarea
									use:autogrow
									bind:value={
										objective.exameFisico.neurologico
									}
									rows="3"
									placeholder="Nível de consciência, pupilas, força muscular, sensibilidade, reflexos..."
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</div>

							<!-- Respiratório Inferior -->
							<div
								class="rounded-2xl border border-slate-200 bg-white p-3"
							>
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span
											class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
											>i</span
										>
										<span
											class="text-xs font-semibold text-slate-700"
											>Respiratório Inferior</span
										>
									</div>
									<button
										type="button"
										on:click={() =>
											(objective.exameFisico.respiratorioInferior =
												loadTemplate(
													"ef_respiratorio_inferior",
													objective.exameFisico.respiratorioInferior,
												))}
										class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
									>
										Carregar Template
									</button>
								</div>
								<textarea
									use:autogrow
									bind:value={
										objective.exameFisico
											.respiratorioInferior
									}
									rows="3"
									placeholder="Inspeção torácica, expansibilidade, percussão, ausculta pulmonar..."
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</div>

							<!-- Respiratório Superior -->
							<div
								class="rounded-2xl border border-slate-200 bg-white p-3"
							>
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span
											class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600"
											>i</span
										>
										<span
											class="text-xs font-semibold text-slate-700"
											>Respiratório Superior (ORL)</span
										>
									</div>
									<button
										type="button"
										on:click={() =>
											(objective.exameFisico.respiratorioSuperior =
												loadTemplate(
													"ef_respiratorio_superior",
													objective.exameFisico.respiratorioSuperior,
												))}
										class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
									>
										Carregar Template
									</button>
								</div>
								<textarea
									use:autogrow
									bind:value={
										objective.exameFisico
											.respiratorioSuperior
									}
									rows="3"
									placeholder="Orofaringe, cavidade nasal, ouvido externo e médio..."
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</div>

							<!-- Exame Ginecológico (condicional) -->
							{#if subjective.identificacao.sexo === "Feminino"}
								<div
									class="rounded-2xl border border-pink-200 bg-pink-50/30 p-4 lg:col-span-2"
								>
									<div class="mb-3 flex items-center gap-2">
										<span
											class="flex h-6 w-6 items-center justify-center rounded-full border border-pink-300 text-xs text-pink-600"
											>i</span
										>
										<span
											class="text-sm font-semibold text-pink-800"
											>Exame Ginecológico</span
										>
									</div>

									<!-- Exame das Mamas -->
									<details
										open
										class="mb-3 rounded-xl border border-pink-200 bg-white"
									>
										<summary
											class="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-pink-700"
											>Exame das Mamas</summary
										>
										<div class="space-y-3 p-3">
											<!-- Inspeção Estática -->
											<div
												class="rounded-lg border border-slate-200 bg-slate-50/50 p-3"
											>
												<p
													class="mb-2 text-xs font-semibold text-slate-700"
												>
													Inspeção Estática
												</p>
												<div class="grid gap-2 text-xs">
													<!-- Posição -->
													<div
														class="flex flex-wrap items-center gap-2"
													>
														<span
															class="text-slate-600"
															>Posição:</span
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.posicao
																}
																value="topicas"
															/> Tópicas</label
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.posicao
																}
																value="ptoticas"
															/> Ptóticas</label
														>
													</div>
													<!-- Simetria -->
													<div
														class="flex flex-wrap items-center gap-2"
													>
														<span
															class="text-slate-600"
															>Simetria:</span
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.simetria
																}
																value="simetricas"
															/> Simétricas</label
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.simetria
																}
																value="assimetricas"
															/> Assimétricas</label
														>
													</div>
													<!-- Volume -->
													<div
														class="flex flex-wrap items-center gap-2"
													>
														<span
															class="text-slate-600"
															>Volume:</span
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.volume
																}
																value="eutroficas"
															/> Eutróficas</label
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.volume
																}
																value="hipotroficas"
															/> Hipotróficas</label
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.volume
																}
																value="hipertroficas"
															/> Hipertróficas</label
														>
													</div>
													<!-- Mamilos -->
													<div
														class="flex flex-wrap items-center gap-2"
													>
														<span
															class="text-slate-600"
															>Mamilos:</span
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.mamilos
																}
																value="proeminentes"
															/> Proeminentes</label
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.mamilos
																}
																value="planos"
															/> Planos</label
														>
														<label
															class="flex items-center gap-1"
															><input
																type="radio"
																bind:group={
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.inspecaoEstatica
																		.mamilos
																}
																value="invertidos"
															/> Invertidos</label
														>
													</div>
													<!-- Checkbox isolado -->
													<label
														class="flex items-center gap-2"
													>
														<input
															type="checkbox"
															bind:checked={
																objective
																	.exameFisico
																	.ginecologico
																	.mamas
																	.inspecaoEstatica
																	.ausenciaAbaulamentosRetracoes
															}
														/>
														<span
															>Ausência de
															abaulamentos e
															retrações</span
														>
													</label>
													<!-- Observações -->
													<input
														bind:value={
															objective
																.exameFisico
																.ginecologico
																.mamas
																.inspecaoEstatica
																.observacoes
														}
														placeholder="Observações..."
														class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
													/>
												</div>
											</div>

											<!-- Inspeção Dinâmica -->
											<div
												class="rounded-lg border border-slate-200 bg-slate-50/50 p-3"
											>
												<p
													class="mb-2 text-xs font-semibold text-slate-700"
												>
													Inspeção Dinâmica
												</p>
												<label
													class="mb-2 flex items-center gap-2 text-xs"
												>
													<input
														type="checkbox"
														bind:checked={
															objective
																.exameFisico
																.ginecologico
																.mamas
																.inspecaoDinamica
																.ausenciaAbaulamentosRetracoes
														}
													/>
													<span
														>Ausência de
														abaulamentos ou
														retrações</span
													>
												</label>
												<input
													bind:value={
														objective.exameFisico
															.ginecologico.mamas
															.inspecaoDinamica
															.observacoes
													}
													placeholder="Observações..."
													class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
												/>
											</div>

											<!-- Palpação das Mamas -->
											<div
												class="rounded-lg border border-slate-200 bg-slate-50/50 p-3"
											>
												<div
													class="mb-2 flex items-center justify-between"
												>
													<p
														class="text-xs font-semibold text-slate-700"
													>
														Palpação das Mamas
													</p>
													<button
														type="button"
														on:click={() =>
															(objective.exameFisico.ginecologico.mamas.palpacao =
																loadTemplate(
																	"mamas_palpacao",
																	objective
																		.exameFisico
																		.ginecologico
																		.mamas
																		.palpacao,
																))}
														class="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300"
													>
														Carregar Template
													</button>
												</div>
												<textarea
													use:autogrow
													bind:value={
														objective.exameFisico
															.ginecologico.mamas
															.palpacao
													}
													rows="4"
													placeholder="Descreva a palpação das mamas..."
													class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
												></textarea>
												<button
													type="button"
													disabled={savingGuide}
													on:click={() =>
														salvarTemplate(
															"mamas_palpacao",
															objective
																.exameFisico
																.ginecologico
																.mamas.palpacao,
														)}
													class="mt-2 rounded-full bg-pink-600 px-3 py-1 text-xs text-white hover:bg-pink-700 disabled:opacity-50"
												>
													{savingGuide
														? "Salvando..."
														: "Salvar como Template"}
												</button>
											</div>

											<!-- Expressão -->
											<div
												class="rounded-lg border border-slate-200 bg-slate-50/50 p-3"
											>
												<p
													class="mb-2 text-xs font-semibold text-slate-700"
												>
													Expressão
												</p>
												<div
													class="mb-2 flex flex-wrap items-center gap-3 text-xs"
												>
													<label
														class="flex items-center gap-1"
														><input
															type="radio"
															bind:group={
																objective
																	.exameFisico
																	.ginecologico
																	.mamas
																	.expressao
																	.resultado
															}
															value="positiva"
														/> Positiva</label
													>
													<label
														class="flex items-center gap-1"
														><input
															type="radio"
															bind:group={
																objective
																	.exameFisico
																	.ginecologico
																	.mamas
																	.expressao
																	.resultado
															}
															value="negativa"
														/> Negativa</label
													>
												</div>
												<input
													bind:value={
														objective.exameFisico
															.ginecologico.mamas
															.expressao
															.observacoes
													}
													placeholder="Observações..."
													class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
												/>
											</div>
										</div>
									</details>

									<!-- Exame da Genitália -->
									<details
										open
										class="rounded-xl border border-pink-200 bg-white"
									>
										<summary
											class="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-pink-700"
											>Exame da Genitália</summary
										>
										<div class="space-y-3 p-3">
											<!-- Genitália Externa -->
											<div
												class="rounded-lg border border-slate-200 bg-slate-50/50 p-3"
											>
												<div
													class="mb-2 flex items-center justify-between"
												>
													<p
														class="text-xs font-semibold text-slate-700"
													>
														Genitália Externa
													</p>
													<button
														type="button"
														on:click={() =>
															(objective.exameFisico.ginecologico.genitalia.externa =
																loadTemplate(
																	"genitalia_externa",
																	objective
																		.exameFisico
																		.ginecologico
																		.genitalia
																		.externa,
																))}
														class="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300"
													>
														Carregar Template
													</button>
												</div>
												<textarea
													use:autogrow
													bind:value={
														objective.exameFisico
															.ginecologico
															.genitalia.externa
													}
													rows="3"
													placeholder="Descreva o exame da genitália externa..."
													class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
												></textarea>
												<button
													type="button"
													disabled={savingGuide}
													on:click={() =>
														salvarTemplate(
															"genitalia_externa",
															objective
																.exameFisico
																.ginecologico
																.genitalia
																.externa,
														)}
													class="mt-2 rounded-full bg-pink-600 px-3 py-1 text-xs text-white hover:bg-pink-700 disabled:opacity-50"
												>
													{savingGuide
														? "Salvando..."
														: "Salvar como Template"}
												</button>
											</div>

											<!-- Genitália Interna -->
											<div
												class="rounded-lg border border-slate-200 bg-slate-50/50 p-3"
											>
												<div
													class="mb-2 flex items-center justify-between"
												>
													<p
														class="text-xs font-semibold text-slate-700"
													>
														Genitália Interna
													</p>
													<button
														type="button"
														on:click={() =>
															(objective.exameFisico.ginecologico.genitalia.interna =
																loadTemplate(
																	"genitalia_interna",
																	objective
																		.exameFisico
																		.ginecologico
																		.genitalia
																		.interna,
																))}
														class="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300"
													>
														Carregar Template
													</button>
												</div>
												<textarea
													use:autogrow
													bind:value={
														objective.exameFisico
															.ginecologico
															.genitalia.interna
													}
													rows="3"
													placeholder="Descreva o exame da genitália interna..."
													class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
												></textarea>
												<button
													type="button"
													disabled={savingGuide}
													on:click={() =>
														salvarTemplate(
															"genitalia_interna",
															objective
																.exameFisico
																.ginecologico
																.genitalia
																.interna,
														)}
													class="mt-2 rounded-full bg-pink-600 px-3 py-1 text-xs text-white hover:bg-pink-700 disabled:opacity-50"
												>
													{savingGuide
														? "Salvando..."
														: "Salvar como Template"}
												</button>
											</div>

											<!-- Toque Vaginal -->
											<div
												class="rounded-lg border border-slate-200 bg-slate-50/50 p-3"
											>
												<div
													class="mb-2 flex items-center justify-between"
												>
													<p
														class="text-xs font-semibold text-slate-700"
													>
														Toque Vaginal / Bimanual
													</p>
													<button
														type="button"
														on:click={() =>
															(objective.exameFisico.ginecologico.genitalia.toqueVaginal =
																loadTemplate(
																	"genitalia_toque",
																	objective
																		.exameFisico
																		.ginecologico
																		.genitalia
																		.toqueVaginal,
																))}
														class="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300"
													>
														Carregar Template
													</button>
												</div>
												<textarea
													use:autogrow
													bind:value={
														objective.exameFisico
															.ginecologico
															.genitalia
															.toqueVaginal
													}
													rows="3"
													placeholder="Descreva o toque vaginal..."
													class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
												></textarea>
												<button
													type="button"
													disabled={savingGuide}
													on:click={() =>
														salvarTemplate(
															"genitalia_toque",
															objective
																.exameFisico
																.ginecologico
																.genitalia
																.toqueVaginal,
														)}
													class="mt-2 rounded-full bg-pink-600 px-3 py-1 text-xs text-white hover:bg-pink-700 disabled:opacity-50"
												>
													{savingGuide
														? "Salvando..."
														: "Salvar como Template"}
												</button>
											</div>
										</div>
									</details>
								</div>
							{/if}
						</div>
					</details>

					<!-- Exames Laboratoriais -->
					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900"
						>
							<span>Exames Laboratoriais</span>
							<button
								type="button"
								on:click|stopPropagation={() =>
									openLaboratoryModal()}
								class="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
							>
								+ Adicionar
							</button>
						</summary>
						<div class="px-4 pb-4">
							{#if laboratorioSelecionados.length === 0}
								<div
									class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500"
								>
									Nenhum exame laboratorial adicionado.
								</div>
							{:else}
								<div class="space-y-4">
									<!-- Botão excluir selecionados -->
									<div
										class="flex items-center justify-between"
									>
										<label
											class="flex items-center gap-2 text-xs text-slate-700"
										>
											<input
												type="checkbox"
												checked={laboratorioSelecionadosTodos}
												on:change={toggleTodosLaboratorio}
											/>
											Selecionar todos
										</label>
										{#if laboratorioSelecionados.some((item) => item.selecionado)}
											<button
												type="button"
												on:click={excluirLaboratorioSelecionados}
												class="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
											>
												Excluir Selecionados
											</button>
										{/if}
									</div>

									<!-- Tabelas Pivot por Pacote: Exames em linhas, Datas em colunas -->
									<div class="flex flex-col gap-4">
										{#each laboratorioPivotPorPacote as pacoteData}
											<div
												class="rounded-2xl border border-slate-200 bg-white p-3"
											>
												<h4
													class="mb-2 font-semibold text-slate-900 px-2"
												>
													{pacoteData.pacote}
												</h4>
												<div class="overflow-x-auto">
													<table
														class="w-full text-xs"
													>
														<thead
															class="bg-slate-100 text-slate-700"
														>
															<tr>
																<th
																	class="px-2 py-2 text-left sticky left-0 bg-slate-100 z-10"
																	>Exame</th
																>
																<th
																	class="px-2 py-2 text-left"
																	>Referência</th
																>
																<th
																	class="px-2 py-2 text-left"
																	>Unidade</th
																>
																{#each pacoteData.datas as data}
																	<th
																		class="px-2 py-2 text-center min-w-[120px]"
																	>
																		{data ===
																		"Sem data"
																			? "Sem data"
																			: new Date(
																					data,
																				).toLocaleDateString(
																					"pt-BR",
																				)}
																	</th>
																{/each}
															</tr>
														</thead>
														<tbody>
															{#each pacoteData.exames as exame}
																<tr
																	class="border-t border-slate-100"
																>
																	<td
																		class="px-2 py-2 sticky left-0 bg-white z-10"
																	>
																		{#if exame.significado}
																			<span
																				class="group relative cursor-help border-b border-dotted border-slate-400"
																				title={exame.significado}
																			>
																				{exame.nome}
																				<div
																					class="absolute left-0 top-full z-20 mt-1 hidden w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-lg group-hover:block"
																				>
																					<p
																						class="text-xs text-slate-700"
																					>
																						{exame.significado}
																					</p>
																				</div>
																			</span>
																		{:else}
																			{exame.nome}
																		{/if}
																	</td>
																	<td
																		class="px-2 py-2 text-slate-500"
																		>{exame.valoresReferencia ||
																			"-"}</td
																	>
																	<td
																		class="px-2 py-2 text-slate-500"
																		>{exame.unidade ||
																			"-"}</td
																	>
																	{#each pacoteData.datas as data}
																		<td
																			class="px-2 py-2"
																		>
																			<input
																				value={exame
																					.resultadosPorData[
																					data
																				] ||
																					""}
																				on:input={(
																					e,
																				) => {
																					// Find and update the original item
																					const item =
																						laboratorioSelecionados.find(
																							(
																								i,
																							) =>
																								i.nome ===
																									exame.nome &&
																								(i.dataExecucao ||
																									"Sem data") ===
																									data,
																						);
																					const target =
																						/** @type {HTMLInputElement} */ (
																							e.target
																						);
																					if (
																						item
																					)
																						item.resultado =
																							target?.value ||
																							"";
																					laboratorioSelecionados =
																						[
																							...laboratorioSelecionados,
																						]; // Trigger reactivity
																				}}
																				placeholder="..."
																				class="w-full rounded border border-slate-300 px-2 py-1 text-xs text-center"
																			/>
																		</td>
																	{/each}
																</tr>
															{/each}
														</tbody>
													</table>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</details>

					<!-- Exames de Imagem e Funcionais -->
					<details
						open
						class="rounded-2xl border border-slate-200 bg-slate-50/70"
					>
						<summary
							class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900"
						>
							<span>Exames de Imagem e Funcionais</span>
							<button
								type="button"
								on:click|stopPropagation={() =>
									openImagemModal()}
								class="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
							>
								+ Adicionar
							</button>
						</summary>
						<div class="px-4 pb-4">
							{#if imagemSelecionados.length === 0}
								<div
									class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500"
								>
									Nenhum exame de imagem ou funcional
									adicionado.
								</div>
							{:else}
								<div class="grid gap-3 lg:grid-cols-2">
									{#each imagemSelecionados as item}
										<div
											class="rounded-2xl border border-slate-200 bg-white p-3"
										>
											<div
												class="mb-2 flex items-center justify-between"
											>
												<div>
													<h4
														class="text-sm font-semibold text-slate-900"
													>
														{item.nome}
													</h4>
													{#if item.dataRealizacao}
														<p
															class="text-xs text-slate-500"
														>
															Data: {new Date(
																item.dataRealizacao,
															).toLocaleDateString(
																"pt-BR",
															)}
														</p>
													{/if}
												</div>
												<button
													type="button"
													on:click={() =>
														excluirImagem(item.id)}
													class="text-slate-400 hover:text-red-600"
													aria-label="Excluir exame de imagem"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-4 w-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														><path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/></svg
													>
												</button>
											</div>
											<div class="space-y-2">
												<label
													class="block text-xs text-slate-700"
												>
													<span class="mb-1 block"
														>Motivo do exame</span
													>
													<input
														bind:value={item.motivo}
														placeholder="Indicação clínica..."
														class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
													/>
												</label>
												<label
													class="block text-xs text-slate-700"
												>
													<span class="mb-1 block"
														>Resultado / Impressões
														Diagnósticas</span
													>
													<textarea
														use:autogrow
														bind:value={
															item.resultado
														}
														rows="2"
														placeholder="Descreva os achados..."
														class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
													></textarea>
												</label>
												<label
													class="block text-xs text-slate-700"
												>
													<span class="mb-1 block"
														>Médico executor</span
													>
													<input
														bind:value={
															item.medicoExecutor
														}
														placeholder="Nome do médico..."
														class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
													/>
												</label>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</details>
				</div>
			</details>

			<details
				open
				class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
			>
				<summary
					class="flex cursor-pointer list-none items-center justify-between bg-slate-700 px-5 py-4 text-white"
				>
					<div>
						<p
							class="text-xs uppercase tracking-[0.28em] text-slate-300"
						>
							SOAP
						</p>
						<h2 class="text-lg font-semibold">A | Avaliação</h2>
					</div>
					<span
						class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200"
						>Síntese diagnóstica</span
					>
				</summary>
				<div class="grid gap-4 p-4 lg:grid-cols-3">
					<section
						class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
					>
						<h3 class="text-sm font-semibold text-slate-900">
							Hipóteses diagnósticas
						</h3>
						<textarea
							use:autogrow
							bind:value={assessment.hipoteses}
							rows="6"
							placeholder="Hipóteses principais, diferenciais e justificativas."
							class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						></textarea>
					</section>
					<section
						class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
					>
						<div class="flex items-center justify-between">
							<h3 class="text-sm font-semibold text-slate-900">
								Estratificação de risco
							</h3>
							<button
								type="button"
								on:click={openCalculadorasModal}
								class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
							>
								Escores de Risco
							</button>
						</div>
						<textarea
							use:autogrow
							bind:value={assessment.riscos}
							rows="6"
							placeholder="Gravidade, sinais de alarme, risco cardiovascular, social ou funcional."
							class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						></textarea>
					</section>
					<section
						class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
					>
						<h3 class="text-sm font-semibold text-slate-900">
							Síntese clínica
						</h3>
						<textarea
							use:autogrow
							bind:value={assessment.observacoes}
							rows="6"
							placeholder="Resumo final da leitura clínica e prioridades da consulta."
							class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						></textarea>
					</section>
				</div>
			</details>

			<details
				open
				class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
			>
				<summary
					class="flex cursor-pointer list-none items-center justify-between bg-slate-600 px-5 py-4 text-white"
				>
					<div>
						<p
							class="text-xs uppercase tracking-[0.28em] text-slate-200"
						>
							SOAP
						</p>
						<h2 class="text-lg font-semibold">P | Plano</h2>
					</div>
					<span
						class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100"
						>Conduta e seguimento</span
					>
				</summary>
				<div class="grid gap-4 p-4 lg:grid-cols-[1.25fr_1fr_1fr]">
					<section
						class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
					>
						<h3 class="text-sm font-semibold text-slate-900">
							Condutas imediatas
						</h3>
						<textarea
							use:autogrow
							bind:value={plan.condutas}
							rows="7"
							placeholder="Solicitações, orientações, encaminhamentos e monitorização."
							class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						></textarea>
					</section>
					<section
						class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
					>
						<h3 class="text-sm font-semibold text-slate-900">
							Prescrição
						</h3>
						<div
							class="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500"
						>
							Área pronta para futura integração com os
							medicamentos selecionados.
						</div>
						<textarea
							use:autogrow
							bind:value={plan.prescricao}
							rows="5"
							placeholder="Posologia, ajustes e restrições."
							class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						></textarea>
					</section>
					<section
						class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
					>
						<h3 class="text-sm font-semibold text-slate-900">
							Seguimento
						</h3>
						<textarea
							use:autogrow
							bind:value={plan.seguimento}
							rows="7"
							placeholder="Retorno, metas terapêuticas, red flags e exames pendentes."
							class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						></textarea>
					</section>
				</div>
			</details>
		</div>
	</div>
</main>

<dialog
	bind:this={guideDialogRef}
	class="w-full max-w-2xl rounded-3xl p-0 backdrop:bg-slate-950/30"
>
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div class="flex items-start justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">
					Editar texto-guia
				</h2>
				<p class="text-xs text-slate-500">{editingGuideLabel}</p>
			</div>
			<button
				type="button"
				on:click={closeGuideEditor}
				class="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
				>Fechar</button
			>
		</div>
		<textarea
			bind:value={editingGuideText}
			rows="8"
			class="mt-4 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
		></textarea>
		<div class="mt-4 flex justify-end gap-2">
			<button
				type="button"
				on:click={closeGuideEditor}
				class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100"
				>Cancelar</button
			>
			<button
				type="button"
				disabled={savingGuide}
				on:click={saveGuide}
				class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
			>
				{savingGuide ? "Salvando..." : "Salvar guia"}
			</button>
		</div>
	</div>
</dialog>

<dialog
	bind:this={diseaseDialogRef}
	class="w-full max-w-4xl rounded-3xl p-0 backdrop:bg-slate-950/30"
>
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div
			class="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between"
		>
			<div>
				<h2 class="text-lg font-semibold text-slate-900">
					{editingDiseaseId ? "Editar doença" : "Adicionar doença"}
				</h2>
				<p class="text-xs text-slate-500">
					Pesquise na base CID-10 ou faça entrada manual com capítulo
					obrigatório.
				</p>
			</div>
			<div class="flex gap-2">
				<button
					type="button"
					on:click={() => (diseaseMode = "cid")}
					class={`rounded-full px-4 py-2 text-xs ${diseaseMode === "cid" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
					>Busca CID</button
				>
				<button
					type="button"
					on:click={() => (diseaseMode = "manual")}
					class={`rounded-full px-4 py-2 text-xs ${diseaseMode === "manual" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
					>Manual</button
				>
			</div>
		</div>

		<div class="mt-4 grid gap-4 lg:grid-cols-[1.05fr_1fr]">
			<section class="space-y-3">
				{#if diseaseMode === "cid"}
					<label class="space-y-1 text-xs text-slate-700">
						<span>Pesquisar CID-10</span>
						<input
							bind:value={diseaseSearch}
							on:input={scheduleDiseaseSearch}
							placeholder="Ex: doenças hipertensivas, diabetes mellitus..."
							class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						/>
					</label>

					{#if diseaseLoading || diseaseSearchResults.length > 0}
						<div
							class="rounded-2xl border border-slate-200 bg-slate-50 p-2"
						>
							{#if diseaseLoading}
								<p
									class="px-3 py-10 text-center text-xs text-slate-500"
								>
									Pesquisando CID-10...
								</p>
							{:else}
								<div class="max-h-60 space-y-2 overflow-y-auto">
									{#each diseaseSearchResults as item}
										<button
											type="button"
											on:click={() =>
												selectDiseaseSuggestion(item)}
											class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-100"
										>
											<p
												class="text-sm font-semibold text-slate-900"
											>
												{item.cat_desc}
											</p>
											<p
												class="mt-1 text-xs text-slate-500"
											>
												{item.subcat_desc} • {item.subcat}
											</p>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				{:else}
					<div class="grid gap-3 md:grid-cols-2">
						<label class="space-y-1 text-xs text-slate-700">
							<span>Código manual</span>
							<input
								bind:value={diseaseForm.subcat}
								placeholder="Opcional"
								class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
						</label>
						<label class="space-y-1 text-xs text-slate-700">
							<span>Capítulo</span>
							<select
								bind:value={diseaseForm.cap}
								class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							>
								<option value="">Selecione</option>
								{#each chapterOptions as item}
									<option value={item.cap}
										>{item.cap} • {item.cap_desc}</option
									>
								{/each}
							</select>
						</label>
					</div>
				{/if}

				<label class="space-y-1 text-xs text-slate-700">
					<span>Descrição da doença</span>
					<input
						bind:value={diseaseForm.subcat_desc}
						class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
					/>
				</label>
				<div class="grid gap-3 md:grid-cols-2">
					<label class="space-y-1 text-xs text-slate-700">
						<span>Categoria</span>
						<input
							bind:value={diseaseForm.cat_desc}
							placeholder="Opcional"
							class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						/>
					</label>
					<label class="space-y-1 text-xs text-slate-700">
						<span>Mês/Ano do diagnóstico</span>
						<input
							bind:value={diseaseForm.mesAnoDiagnostico}
							placeholder="MM/AAAA"
							class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						/>
					</label>
				</div>
			</section>

			<section class="space-y-3">
				<label class="space-y-1 text-xs text-slate-700">
					<span>Histórico da doença</span>
					<textarea
						use:autogrow
						bind:value={diseaseForm.historico}
						rows="8"
						class="min-h-48 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
					></textarea>
				</label>
				<label class="space-y-1 text-xs text-slate-700">
					<span>Queixas atuais</span>
					<textarea
						use:autogrow
						bind:value={diseaseForm.queixasAtuais}
						rows="8"
						class="min-h-48 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
					></textarea>
				</label>
				<div
					class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500"
				>
					Capítulo atual: {diseaseForm.cap
						? `${diseaseForm.cap} • ${diseaseForm.cap_desc || chapterOptions.find((item) => item.cap === diseaseForm.cap)?.cap_desc || ""}`
						: "não informado"}
				</div>
			</section>
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<button
				type="button"
				on:click={closeDiseaseModal}
				class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100"
				>Cancelar</button
			>
			<button
				type="button"
				on:click={saveDisease}
				class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
				>Salvar doença</button
			>
		</div>
	</div>
</dialog>

<dialog
	bind:this={medicationDialogRef}
	class="w-full max-w-4xl rounded-3xl p-0 backdrop:bg-slate-950/30"
>
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div class="border-b border-slate-200 pb-4">
			<h2 class="text-lg font-semibold text-slate-900">
				{editingMedicationId
					? "Editar medicamento"
					: "Adicionar medicamento"}
			</h2>
			<p class="text-xs text-slate-500">
				Busque na base de medicamentos e complemente a posologia da
				consulta.
			</p>
		</div>

		<div class="mt-4 grid gap-4 lg:grid-cols-[1.05fr_1fr]">
			<section class="space-y-3">
				<label class="space-y-1 text-xs text-slate-700">
					<span>Pesquisar medicamento</span>
					<input
						bind:value={medicationSearch}
						on:input={scheduleMedicationSearch}
						placeholder="Ex: losartana, sertralina..."
						class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
					/>
				</label>
				<button
					type="button"
					on:click={startManualMedication}
					class="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
				>
					Não encontrei - Adicionar Manualmente
				</button>

				{#if medicationLoading || medicationSearchResults.length > 0}
					<div
						class="rounded-2xl border border-slate-200 bg-slate-50 p-2"
					>
						{#if medicationLoading}
							<p
								class="px-3 py-10 text-center text-xs text-slate-500"
							>
								Pesquisando medicamentos...
							</p>
						{:else}
							<div class="max-h-60 space-y-2 overflow-y-auto">
								{#each medicationSearchResults as item}
									<button
										type="button"
										on:click={() =>
											selectMedicationSuggestion(item)}
										class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-100"
									>
										<p class="text-sm text-slate-900">
											<span class="font-semibold"
												>{item.principio_ativo}</span
											>
											{#if item.concentracao}
												<span class="font-semibold">
													• {item.concentracao}</span
												>
											{/if}
										</p>
										<p class="mt-1 text-xs text-slate-500">
											{item.forma_farmaceutica ||
												"Forma farmacêutica não informada"}
										</p>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</section>

			<section class="space-y-3">
				<div class="grid gap-3 md:grid-cols-2">
					<label
						class="space-y-1 text-xs text-slate-700 md:col-span-2"
					>
						<span>Princípio ativo</span>
						<input
							readonly={!medicationManualMode &&
								Boolean(medicationForm.sourceId)}
							bind:value={medicationForm.principio_ativo}
							class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 read-only:border-slate-200 read-only:bg-slate-100 read-only:text-slate-600"
						/>
					</label>
					<label class="space-y-1 text-xs text-slate-700">
						<span>Concentração</span>
						<input
							readonly={!medicationManualMode}
							bind:value={medicationForm.concentracao}
							class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 read-only:border-slate-200 read-only:bg-slate-100 read-only:text-slate-600"
						/>
					</label>
					<label class="space-y-1 text-xs text-slate-700">
						<span>Forma farmacêutica</span>
						<input
							readonly={!medicationManualMode}
							bind:value={medicationForm.forma_farmaceutica}
							class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 read-only:border-slate-200 read-only:bg-slate-100 read-only:text-slate-600"
						/>
					</label>
					<label
						class="space-y-1 text-xs text-slate-700 md:col-span-2"
					>
						<span>Classe farmacêutica</span>
						<input
							bind:value={medicationForm.classe}
							class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						/>
					</label>
				</div>

				<section
					class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
				>
					<h3 class="text-sm font-semibold text-slate-900">
						Dose e Frequência
					</h3>
					<div class="mt-3 flex flex-wrap gap-2 text-xs">
						<label
							class="rounded-full border border-slate-300 bg-white px-3 py-1.5"
							><input
								class="mr-1"
								type="radio"
								bind:group={medicationForm.frequenciaTipo}
								value="diario"
							/>Diário</label
						>
						<label
							class="rounded-full border border-slate-300 bg-white px-3 py-1.5"
							><input
								class="mr-1"
								type="radio"
								bind:group={medicationForm.frequenciaTipo}
								value="semanal"
							/>Semanal</label
						>
						<label
							class="rounded-full border border-slate-300 bg-white px-3 py-1.5"
							><input
								class="mr-1"
								type="radio"
								bind:group={medicationForm.frequenciaTipo}
								value="intervalo"
							/>Intervalo</label
						>
						<label
							class="rounded-full border border-slate-300 bg-white px-3 py-1.5"
							><input
								class="mr-1"
								type="radio"
								bind:group={medicationForm.frequenciaTipo}
								value="especial"
							/>Especial</label
						>
					</div>

					{#if medicationForm.frequenciaTipo === "diario"}
						<div class="mt-3 grid gap-2 sm:grid-cols-3">
							<label class="space-y-1 text-xs text-slate-700">
								<span>Manhã</span>
								<input
									type="text"
									bind:value={medicationForm.diario.manha}
									placeholder="1 cp"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Tarde</span>
								<input
									type="text"
									bind:value={medicationForm.diario.tarde}
									placeholder="1/2 cp"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Noite</span>
								<input
									type="text"
									bind:value={medicationForm.diario.noite}
									placeholder="5 mL"
									class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
								/>
							</label>
						</div>
					{:else if medicationForm.frequenciaTipo === "semanal"}
						<select
							bind:value={medicationForm.semanal}
							class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						>
							<option>1x por semana</option>
							<option>2x por semana</option>
							<option>3x por semana</option>
							<option>Segunda a sexta</option>
							<option>Fim de semana</option>
						</select>
						<label
							class="mt-3 block space-y-1 text-xs text-slate-700"
						>
							<span>Qual a dose?</span>
							<input
								bind:value={medicationForm.doseQual}
								placeholder="Ex: 1 comprimido, 20 UI, 5 mL"
								class="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
						</label>
					{:else if medicationForm.frequenciaTipo === "intervalo"}
						<select
							bind:value={medicationForm.intervalo}
							class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						>
							<option>12h</option>
							<option>8h</option>
							<option>6h</option>
							<option>4h</option>
						</select>
						<label
							class="mt-3 block space-y-1 text-xs text-slate-700"
						>
							<span>Qual a dose?</span>
							<input
								bind:value={medicationForm.doseQual}
								placeholder="Ex: 1 comprimido, 20 UI, 5 mL"
								class="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
						</label>
					{:else}
						<input
							bind:value={medicationForm.especial}
							placeholder="Ex: usar se dor, antes de dormir, em jejum..."
							class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						/>
					{/if}
				</section>

				<label class="space-y-1 text-xs text-slate-700">
					<span>Observações</span>
					<textarea
						use:autogrow
						bind:value={medicationForm.observacoes}
						rows="3"
						class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
					></textarea>
				</label>
			</section>
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<button
				type="button"
				on:click={closeMedicationModal}
				class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100"
				>Cancelar</button
			>
			<button
				type="button"
				on:click={saveMedication}
				class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
				>Salvar medicamento</button
			>
		</div>
	</div>
</dialog>

<!-- Modal Exames Laboratoriais -->
<dialog
	bind:this={labDialogRef}
	class="w-full max-w-4xl rounded-3xl p-0 backdrop:bg-slate-950/30"
>
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div class="border-b border-slate-200 pb-4">
			<h2 class="text-lg font-semibold text-slate-900">
				Adicionar Exame Laboratorial
			</h2>
			<p class="text-xs text-slate-500">
				Selecione um pacote para adicionar múltiplos exames ou adicione
				manualmente.
			</p>
		</div>

		<div class="mt-4 space-y-4">
			<div class="flex gap-2">
				<button
					type="button"
					on:click={() => (labModo = "pacote")}
					class={`rounded-full px-4 py-2 text-xs ${labModo === "pacote" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
					>Por Pacote</button
				>
				<button
					type="button"
					on:click={() => (labModo = "manual")}
					class={`rounded-full px-4 py-2 text-xs ${labModo === "manual" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
					>Manual</button
				>
			</div>

			{#if labModo === "pacote"}
				<!-- Seleção de Pacote -->
				<div class="space-y-3">
					<!-- Data de Execução (obrigatória) -->
					<label class="space-y-1 text-xs text-slate-700">
						<span
							>Data de Execução <span class="text-red-500">*</span
							></span
						>
						<input
							type="date"
							bind:value={labDataExecucao}
							class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						/>
						<p class="text-xs text-slate-500">
							Informe a data antes de selecionar um pacote
						</p>
					</label>

					<label class="space-y-1 text-xs text-slate-700">
						<span>Selecione um pacote de exames</span>
						{#if labPacotesLoading}
							<div
								class="flex items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2"
							>
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
								></div>
								<span class="text-sm text-slate-500"
									>Carregando pacotes...</span
								>
							</div>
						{:else}
							<select
								bind:value={labPacoteSelecionado}
								on:change={() =>
									labPacoteSelecionado &&
									selecionarPacoteLaboratorial(
										labPacoteSelecionado,
									)}
								disabled={!labDataExecucao}
								class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
							>
								<option value=""
									>{labDataExecucao
										? "Escolha um pacote..."
										: "Informe a data acima primeiro"}</option
								>
								{#each labPacotesDisponiveis as pacote}
									<option value={pacote}>{pacote}</option>
								{/each}
							</select>
						{/if}
					</label>

					<!-- Lista de Exames em Edição -->
					{#if labExamesEmEdicao.length > 0}
						<div
							class="rounded-2xl border border-slate-200 bg-slate-50 p-3"
						>
							<div class="mb-2 flex items-center justify-between">
								<h3
									class="text-sm font-semibold text-slate-900"
								>
									Exames selecionados ({labExamesEmEdicao.length})
								</h3>
								<p class="text-xs text-slate-500">
									Edite os valores de referência antes de
									confirmar
								</p>
							</div>
							<div class="max-h-72 space-y-2 overflow-y-auto">
								{#each labExamesEmEdicao as exame, index (exame.id)}
									<div
										class="rounded-xl border border-slate-200 bg-white p-3"
									>
										<div
											class="mb-2 flex items-center justify-between"
										>
											<div
												class="group relative flex items-center gap-2"
											>
												{#if exame.significado}
													<p
														class="cursor-help border-b border-dotted border-slate-400 text-sm font-semibold text-slate-900"
														title={exame.significado}
													>
														{exame.nome}
													</p>
													<!-- Tooltip -->
													<div
														class="absolute left-0 top-full z-10 mt-1 hidden w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-lg group-hover:block"
													>
														<p
															class="text-xs text-slate-700"
														>
															{exame.significado}
														</p>
													</div>
												{:else}
													<p
														class="text-sm font-semibold text-slate-900"
													>
														{exame.nome}
													</p>
												{/if}
											</div>
											<button
												type="button"
												on:click={() =>
													removerExameDaEdicao(
														exame.id,
													)}
												class="rounded-full p-1.5 text-red-600 hover:bg-red-50"
												title="Remover exame"
											>
												<svg
													class="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>
										<div class="grid gap-2 sm:grid-cols-2">
											<label
												class="space-y-1 text-xs text-slate-700"
											>
												<span
													>Valores de Referência</span
												>
												<input
													bind:value={
														labExamesEmEdicao[index]
															.valoresReferencia
													}
													placeholder="Ex: 70-100 mg/dL"
													class="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
												/>
											</label>
											<label
												class="space-y-1 text-xs text-slate-700"
											>
												<span>Unidade</span>
												<input
													bind:value={
														labExamesEmEdicao[index]
															.unidade
													}
													placeholder="Ex: mg/dL"
													class="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
												/>
											</label>
										</div>
									</div>
								{/each}
							</div>
							<div class="mt-3 flex justify-end">
								<button
									type="button"
									on:click={confirmarExamesLaboratoriais}
									class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
								>
									Confirmar ({labExamesEmEdicao.length} exame{labExamesEmEdicao.length >
									1
										? "s"
										: ""})
								</button>
							</div>
						</div>
					{:else if labPacoteSelecionado}
						{#if labLoading}
							<div
								class="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-8"
							>
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
								></div>
								<span class="text-sm text-slate-500"
									>Carregando exames do pacote...</span
								>
							</div>
						{:else}
							<div
								class="rounded-2xl border border-slate-200 bg-slate-50 py-8 text-center"
							>
								<p class="text-sm text-slate-500">
									Selecione um pacote para visualizar os
									exames
								</p>
							</div>
						{/if}
					{/if}
				</div>
			{:else if labModo === "manual"}
				<!-- Modo Manual -->
				<div class="grid gap-3">
					<label class="space-y-1 text-xs text-slate-700">
						<span>Nome do exame</span>
						<input
							bind:value={labExameManual.nome}
							placeholder="Ex: Glicose em jejum"
							class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
						/>
					</label>
					<div class="grid gap-3 sm:grid-cols-2">
						<label class="space-y-1 text-xs text-slate-700">
							<span>Valores de Referência</span>
							<input
								bind:value={labExameManual.valoresReferencia}
								placeholder="Ex: 70-100 mg/dL"
								class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
						</label>
						<label class="space-y-1 text-xs text-slate-700">
							<span>Unidade</span>
							<input
								bind:value={labExameManual.unidade}
								placeholder="Ex: mg/dL"
								class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
						</label>
					</div>
					<button
						type="button"
						on:click={adicionarExameLaboratorialManual}
						class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
						>Adicionar Exame</button
					>
				</div>

			{/if}
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<button
				type="button"
				on:click={closeLaboratoryModal}
				class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100"
				>Fechar</button
			>
		</div>
	</div>
</dialog>

<!-- Modal Exames de Imagem -->
<dialog
	bind:this={imagemDialogRef}
	class="w-full max-w-4xl rounded-3xl p-0 backdrop:bg-slate-950/30"
>
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div class="border-b border-slate-200 pb-4">
			<h2 class="text-lg font-semibold text-slate-900">
				Adicionar Exame de Imagem/Funcional
			</h2>
			<p class="text-xs text-slate-500">
				Busque na base de procedimentos ou adicione manualmente.
			</p>
		</div>

		<div class="mt-4 space-y-3">
			<!-- Data de Realização -->
			<label class="space-y-1 text-xs text-slate-700">
				<span>Data de Realização</span>
				<input
					type="date"
					bind:value={imagemDataRealizacao}
					class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
				/>
			</label>

			<label class="space-y-1 text-xs text-slate-700">
				<span>Buscar procedimento</span>
				<input
					bind:value={imagemSearch}
					on:input={scheduleImagemSearch}
					placeholder="Ex: radiografia, tomografia..."
					class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
				/>
			</label>

			{#if imagemLoading || imagemSearchResults.length > 0}
				<div
					class="rounded-2xl border border-slate-200 bg-slate-50 p-2"
				>
					{#if imagemLoading}
						<p
							class="px-3 py-10 text-center text-xs text-slate-500"
						>
							Buscando procedimentos...
						</p>
					{:else}
						<div class="max-h-60 space-y-2 overflow-y-auto">
							{#each imagemSearchResults as proc}
								<button
									type="button"
									on:click={() => adicionarExameImagem(proc)}
									class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-100"
								>
									<p
										class="text-sm font-semibold text-slate-900"
									>
										{proc.descricao}
									</p>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<div class="border-t border-slate-200 pt-3">
				<p class="mb-2 text-xs font-semibold text-slate-700">
					Ou adicione manualmente:
				</p>
				<div class="flex gap-2">
					<input
						bind:value={imagemExameManual}
						placeholder="Nome do exame"
						class="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
					/>
					<button
						type="button"
						on:click={adicionarExameImagemManual}
						class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
						>Adicionar</button
					>
				</div>
			</div>
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<button
				type="button"
				on:click={closeImagemModal}
				class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100"
				>Fechar</button
			>
		</div>
	</div>
</dialog>

<!-- Reset Confirmation Dialog -->
<dialog
	bind:this={resetDialogRef}
	class="rounded-3xl p-0 shadow-2xl backdrop:bg-slate-900/50"
>
	<div class="w-[400px] bg-white p-6">
		<div class="mb-4 text-center">
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
			>
				<svg
					class="h-6 w-6 text-red-600"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-slate-900">
				Limpar memória?
			</h3>
			<p class="mt-2 text-sm text-slate-600">
				Esta ação irá apagar todos os dados da consulta atual (doenças,
				medicamentos, exames, etc.).
				<br /><br />
				<strong>Esta ação não pode ser desfeita.</strong>
			</p>
		</div>

		<div class="flex gap-3">
			<button
				type="button"
				on:click={() => resetDialogRef?.close()}
				class="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
			>
				Cancelar
			</button>
			<button
				type="button"
				on:click={limparMemoriaConsulta}
				class="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
			>
				Sim, limpar
			</button>
		</div>
	</div>
</dialog>
<!-- Modal de Escores de Risco -->
<dialog
	bind:this={calculadorasDialogRef}
	class="w-full max-w-4xl max-h-[85vh] rounded-3xl p-0 backdrop:bg-slate-950/30 overflow-hidden"
>
	<div
		class="flex flex-col bg-white overflow-hidden"
		style="max-height: 85vh;"
	>
		<div
			class="flex items-center justify-between border-b border-slate-200 px-6 py-4"
		>
			<h3 class="text-lg font-semibold text-slate-900">
				Escores de Risco e Calculadoras
			</h3>
			<button
				type="button"
				on:click={closeCalculadorasModal}
				class="text-slate-400 hover:text-slate-600"
			>
				✕
			</button>
		</div>

		<!-- Abas -->
		<div class="flex gap-4 border-b border-slate-200 px-6">
			<button
				type="button"
				class="border-b-2 px-1 py-3 text-sm font-medium {calculadorasTab ===
				'lista'
					? 'border-slate-900 text-slate-900'
					: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
				on:click={() => (calculadorasTab = "lista")}
			>
				Calculadoras Salvas
			</button>
			<button
				type="button"
				class="border-b-2 px-1 py-3 text-sm font-medium {calculadorasTab ===
				'gerenciar'
					? 'border-slate-900 text-slate-900'
					: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
				on:click={() => (calculadorasTab = "gerenciar")}
			>
				Gerenciar Calculadoras
			</button>
		</div>

		<div class="flex-1 overflow-y-auto p-6">
			{#if calculadorasLoading}
				<div class="py-8 text-center text-slate-500">Carregando...</div>
			{:else if calculadorasTab === "lista"}
				{#if areasClinicas.length === 0}
					<div class="py-8 text-center text-slate-500">
						Nenhuma área clínica ou calculadora salva.
						<br />Vá para a aba "Gerenciar Calculadoras" para
						adicionar.
					</div>
				{:else}
					<div class="flex flex-col gap-8">
						{#each Object.entries(calculadorasPorArea) as [areaNome, calcs]}
							<div>
								<h4
									class="mb-4 text-base font-semibold text-slate-800 border-b border-slate-100 pb-2"
								>
									{areaNome}
								</h4>
								{#if calcs.length === 0}
									<p class="text-sm text-slate-500 italic">
										Nenhuma calculadora nesta área.
									</p>
								{:else}
									<div
										class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
									>
										{#each calcs as calc}
											<div
												class="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300"
											>
												<h5
													class="font-semibold text-slate-900"
												>
													{calc.nome}
												</h5>
												{#if calc.descricao}
													<p
														class="mt-1 text-xs text-slate-600 line-clamp-2"
													>
														{calc.descricao}
													</p>
												{/if}
												<div class="mt-auto pt-3">
													<a
														href={calc.link}
														target="_blank"
														rel="noopener noreferrer"
														class="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
													>
														Abrir Calculadora ↗
													</a>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<div class="grid gap-8 lg:grid-cols-2">
					<!-- Nova Área -->
					<div
						class="rounded-2xl border border-slate-200 bg-slate-50 p-5"
					>
						<h4 class="mb-4 font-semibold text-slate-900">
							Nova Área Clínica
						</h4>
						<div class="flex flex-col gap-3">
							<input
								type="text"
								bind:value={novaAreaNome}
								placeholder="Ex: Cardiologia, Nefrologia"
								class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
							<button
								type="button"
								on:click={salvarNovaArea}
								disabled={!novaAreaNome.trim()}
								class="w-full rounded-xl bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
							>
								Salvar Área
							</button>
						</div>
					</div>

					<!-- Nova Calculadora -->
					<div
						class="rounded-2xl border border-slate-200 bg-slate-50 p-5"
					>
						<h4 class="mb-4 font-semibold text-slate-900">
							Nova Calculadora
						</h4>
						<div class="flex flex-col gap-3">
							<select
								bind:value={novaCalc.area_id}
								class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							>
								<option value="">Selecione a Área...</option>
								{#each areasClinicas as area}
									<option value={area.id}>{area.nome}</option>
								{/each}
							</select>
							<input
								type="text"
								bind:value={novaCalc.nome}
								placeholder="Nome (ex: ASCVD Risk)"
								class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
							<input
								type="text"
								bind:value={novaCalc.descricao}
								placeholder="Descrição (opcional)"
								class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
							<input
								type="url"
								bind:value={novaCalc.link}
								placeholder="URL (https://...)"
								class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
							/>
							<button
								type="button"
								on:click={salvarNovaCalculadora}
								disabled={!novaCalc.area_id ||
									!novaCalc.nome.trim() ||
									!novaCalc.link.trim()}
								class="mt-2 w-full rounded-xl bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
							>
								Salvar Calculadora
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</dialog>
