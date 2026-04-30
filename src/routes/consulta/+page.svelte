<script>
	import { onDestroy, onMount } from 'svelte';
	import { consultaDraft } from '$lib/consultaStore';
	import { loadFromLocalStorage, saveToLocalStorage } from '$lib/useLocalStorage.js';

	/** @typedef {{ id: number; subcat: string; subcat_desc: string; grupo: string; cat: string; cat_desc: string; cap: string; cap_desc: string; }} CidSearchItem */
	/** @typedef {{ sourceId: number | null; principio_ativo: string; concentracao: string; classe: string; forma_farmaceutica: string; fornecimento_sus: string; observacoes: string; frequenciaTipo: string; diario: { manha: string; tarde: string; noite: string; }; semanal: string; intervalo: string; especial: string; doseQual: string; }} MedicationForm */
	/** @typedef {{ subcat: string; subcat_desc: string; cat: string; cat_desc: string; cap: string; cap_desc: string; mesAnoDiagnostico: string; historico: string; queixasAtuais: string; }} DiseaseForm */
	/** @typedef {{ id: string; mode: string; subcat: string; subcat_desc: string; cat: string; cat_desc: string; cap: string; cap_desc: string; mesAnoDiagnostico: string; historico: string; queixasAtuais: string; }} DiseaseItem */
	/** @typedef {{ id: number; principio_ativo: string; concentracao: string; forma_farmaceutica: string; unidade_fornecimento: string; fornecimento_sus: string; classe: string; }} MedicationSearchItem */
	/** @typedef {{ id: string; sourceId: number | null; principio_ativo: string; concentracao: string; classe: string; forma_farmaceutica: string; fornecimento_sus: string; observacoes: string; frequenciaTipo: string; diario: { manha: string; tarde: string; noite: string; }; semanal: string; intervalo: string; especial: string; doseQual: string; }} ConsultationMedication */
	/** @typedef {{ id: string; parentesco: string; idade: string; detalhes: string; }} FamilyHistoryRelative */
	/** @typedef {{ checked: boolean; parentes: FamilyHistoryRelative[]; detalhes: string; }} FamilyHistoryEntry */

	const generoOptions = ['Cis', 'Trans', 'Não-binário', 'Outros'];
	const racaOptions = ['Preta', 'Parda', 'Branca', 'Indígena', 'Quilombola', 'Outros'];
	const estadoCivilOptions = ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Viúvo(a)', 'Outros'];
	const escolaridadeOptions = [
		'Sem escolaridade formal',
		'Fundamental incompleto',
		'Fundamental completo',
		'Médio incompleto',
		'Médio completo',
		'Superior incompleto',
		'Superior completo',
		'Pós-graduação',
		'Outros'
	];
	const religiaoOptions = ['Católica', 'Evangélica', 'Espírita', 'Religiões de matriz africana', 'Sem religião', 'Outros'];
	const familyHistoryOptions = [
		{ id: 'dm1', label: 'DM1' },
		{ id: 'dm2', label: 'DM2' },
		{ id: 'has', label: 'HAS' },
		{ id: 'dac', label: 'DAC' },
		{ id: 'ave', label: 'AVE' },
		{ id: 'dislipidemia', label: 'Dislipidemia' },
		{ id: 'cancer', label: 'Câncer' },
		{ id: 'colelitiase', label: 'Colelitíase' },
		{ id: 'varizes', label: 'Varizes' },
		{ id: 'outros', label: 'Outros' }
	];
	const chapterOptions = [
		{ cap: 'I', cap_desc: 'Algumas doenças infecciosas e parasitárias' },
		{ cap: 'II', cap_desc: 'Neoplasias' },
		{ cap: 'III', cap_desc: 'Doenças do sangue, órgãos hematopoéticos e transtornos imunitários' },
		{ cap: 'IV', cap_desc: 'Doenças endócrinas, nutricionais e metabólicas' },
		{ cap: 'V', cap_desc: 'Transtornos mentais e comportamentais' },
		{ cap: 'VI', cap_desc: 'Doenças do sistema nervoso' },
		{ cap: 'VII', cap_desc: 'Doenças do olho e anexos' },
		{ cap: 'VIII', cap_desc: 'Doenças do ouvido e da apófise mastoide' },
		{ cap: 'IX', cap_desc: 'Doenças do aparelho circulatório' },
		{ cap: 'X', cap_desc: 'Doenças do aparelho respiratório' },
		{ cap: 'XI', cap_desc: 'Doenças do aparelho digestivo' },
		{ cap: 'XII', cap_desc: 'Doenças da pele e tecido subcutâneo' },
		{ cap: 'XIII', cap_desc: 'Doenças do sistema osteomuscular e tecido conjuntivo' },
		{ cap: 'XIV', cap_desc: 'Doenças do aparelho geniturinário' },
		{ cap: 'XV', cap_desc: 'Gravidez, parto e puerpério' },
		{ cap: 'XVI', cap_desc: 'Algumas afecções originadas no período perinatal' },
		{ cap: 'XVII', cap_desc: 'Malformações congênitas, deformidades e anomalias cromossômicas' },
		{ cap: 'XVIII', cap_desc: 'Sintomas, sinais e achados anormais de exames' },
		{ cap: 'XIX', cap_desc: 'Lesões, envenenamentos e outras consequências de causas externas' },
		{ cap: 'XX', cap_desc: 'Causas externas de morbidade e mortalidade' },
		{ cap: 'XXI', cap_desc: 'Fatores que influenciam o estado de saúde e o contato com serviços' },
		{ cap: 'XXII', cap_desc: 'Códigos para propósitos especiais' }
	];
	/** @type {Record<string, string>} */
	const guideSectionLabels = {
		hma: 'HMA',
		revisao_sistemas: 'Revisão de Sistemas',
		ocupacional: 'História Ocupacional',
		psicossocial: 'História Psicossocial',
		habitos: 'Hábitos de Vida',
		recordatorio_alimentar: 'Recordatório Alimentar'
	};
	/** @type {Record<string, string>} */
	const defaultGuides = {
		hma: 'Descreva cronologia, fatores de melhora/piora, intensidade, sintomas associados e impacto funcional.',
		revisao_sistemas:
			'Registre sinais e sintomas por sistemas, destacando positivos e negativos relevantes para o raciocínio clínico.',
		ocupacional:
			'Inclua ocupação atual, exposições, carga física, ergonomia, afastamentos e relação com sintomas.',
		psicossocial:
			'Explore contexto familiar, suporte social, moradia, renda, estressores, espiritualidade e segurança.',
		habitos: 'Documente sono, atividade física, alimentação, etilismo, tabagismo, drogas e sexualidade quando pertinente.',
		recordatorio_alimentar:
			'Registre refeições em ordem cronológica, incluindo horários, quantidades aproximadas, bebidas e beliscos fora das refeições.'
	};

	let aviso = '';
	let erro = '';
	let guideWarning = '';
	let savingGuide = false;
	let activeGuideKey = '';
	let draftHydrated = false;
	/** @type {Record<string, string>} */
	let guides = { ...defaultGuides };
	let editingGuideKey = '';
	let editingGuideLabel = '';
	let editingGuideText = '';
	/** @type {HTMLDialogElement | null} */
	let guideDialogRef;

	/** @type {HTMLDialogElement | null} */
	let diseaseDialogRef;
	let diseaseSearch = '';
	/** @type {CidSearchItem[]} */
	let diseaseSearchResults = [];
	let diseaseLoading = false;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let diseaseSearchTimer;
	let diseaseMode = 'cid';
	/** @type {string | null} */
	let editingDiseaseId = null;
	/** @type {DiseaseForm} */
	let diseaseForm = createEmptyDiseaseForm();
	/** @type {DiseaseItem[]} */
	let diseases = [];

	/** @type {HTMLDialogElement | null} */
	let medicationDialogRef;
	let medicationSearch = '';
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
			idade: '',
			ocupacao: '',
			naturalidade: '',
			acompanhante: '',
			sexo: '',
			genero: '',
			generoOutro: '',
			raca: '',
			racaOutro: '',
			estadoCivil: '',
			estadoCivilOutro: '',
			escolaridade: '',
			escolaridadeOutro: '',
			religiao: '',
			religiaoOutro: ''
		},
		queixaPrincipal: '',
		hma: '',
		revisaoSistemas: '',
		patologicos: {
			alergia: '',
			cirurgias: '',
			internacoes: '',
			traumatismos: ''
		},
		ocupacional: '',
		psicossocial: '',
		habitos: '',
		recordatorioAlimentar: {
			cafeManha: '',
			lancheManha: '',
			almoco: '',
			lancheTarde: '',
			cafeTarde: '',
			lancheAntesJantar: '',
			jantar: '',
			lancheDepoisJantar: ''
		},
		ginecologica: {
			g: '',
			p: '',
			n: '',
			c: '',
			a: '',
			e: '',
			dum: '',
			mac: ''
		}
	};

	/** @typedef {{ id: string; nome: string; pacote?: string; valoresReferencia?: string; unidade?: string; resultado?: string; selecionado?: boolean; }} LaboratorioItem */
	/** @typedef {{ id: string; nome: string; motivo?: string; resultado?: string; medicoExecutor?: string; }} ImagemItem */

	// Variáveis para Exames Laboratoriais
	/** @type {LaboratorioItem[]} */
	let laboratorioSelecionados = [];
	/** @type {HTMLDialogElement | null} */
	let labDialogRef;
	let labSearch = '';
	let labLoading = false;
	/** @type {Array<{ id: number; nome: string; pacote: string | null; valores_referencia: string | null; unidade_medida: string | null; }>} */
	let labSearchResults = [];
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let labSearchTimer;
	let labModo = 'pacote'; // 'pacote' ou 'manual'
	let labPacoteSelecionado = '';
	let labExameManual = { nome: '', valoresReferencia: '', unidade: '' };

	// Variáveis para Exames de Imagem
	/** @type {ImagemItem[]} */
	let imagemSelecionados = [];
	/** @type {HTMLDialogElement | null} */
	let imagemDialogRef;
	let imagemSearch = '';
	let imagemLoading = false;
	/** @type {Array<{ id: number; descricao: string; }>} */
	let imagemSearchResults = [];
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let imagemSearchTimer;
	let imagemExameManual = '';

	let objective = {
		// Sinais Vitais
		sinaisVitais: {
			pas: '',
			pad: '',
			temperatura: '',
			frequenciaCardiaca: '',
			frequenciaRespiratoria: '',
			spo2: ''
		},
		// Dados Antropométricos
		antropometria: {
			altura: '',
			peso: '',
			circunferenciaAbdominal: '',
			imc: ''
		},
		// Exame Físico
		exameFisico: {
			geral: '',
			aparelhoDigestorio: '',
			aparelhoCardiovascular: '',
			sistemaLinfatico: '',
			neurologico: '',
			respiratorioInferior: '',
			respiratorioSuperior: '',
			ginecologico: ''
		}
	};

	// Cálculo automático do IMC (reativo)
	$: if (objective.antropometria.peso && objective.antropometria.altura) {
		const peso = parseFloat(objective.antropometria.peso);
		const altura = parseFloat(objective.antropometria.altura) / 100; // converter cm para m
		if (peso > 0 && altura > 0) {
			const imc = peso / (altura * altura);
			objective.antropometria.imc = imc.toFixed(1);
		} else {
			objective.antropometria.imc = '';
		}
	} else {
		objective.antropometria.imc = '';
	}

	let assessment = {
		hipoteses: '',
		riscos: '',
		observacoes: ''
	};

	let plan = {
		condutas: '',
		prescricao: '',
		seguimento: ''
	};

	/** @type {Record<string, FamilyHistoryEntry>} */
	let familyHistory = createEmptyFamilyHistory();

	// Chaves para persistência independente de doenças e medicamentos
	const DISEASES_STORAGE_KEY = 'consulta-doencas-v1';
	const MEDICATIONS_STORAGE_KEY = 'consulta-medicamentos-v1';

	$: diseaseGroups = groupBy(diseases, (item) => item.cap_desc || 'Sem capítulo definido');
	$: medicationGroups = groupBy(medications, (item) => item.classe || 'Classe não informada');
	$: laboratorioAgrupado = groupBy(laboratorioSelecionados, (item) => item.pacote || 'Exames Avulsos');
	$: laboratorioSelecionadosTodos = laboratorioSelecionados.length > 0 && laboratorioSelecionados.every((item) => item.selecionado);
	$: if (draftHydrated) {
		consultaDraft.set(buildDraftSnapshot());
	}

	// Persistência explícita de doenças e medicamentos com reatividade garantida
	$: if (draftHydrated && diseases) {
		saveToLocalStorage(DISEASES_STORAGE_KEY, diseases);
	}
	$: if (draftHydrated && medications) {
		saveToLocalStorage(MEDICATIONS_STORAGE_KEY, medications);
	}

	/**
	 * @param {HTMLTextAreaElement} node
	 */
	function autogrow(node) {
		const resize = () => {
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight}px`;
		};

		queueMicrotask(resize);
		node.addEventListener('input', resize);

		return {
			update: resize,
			destroy() {
				node.removeEventListener('input', resize);
			}
		};
	}

	/** @returns {DiseaseForm} */
	function createEmptyDiseaseForm() {
		return {
			subcat: '',
			subcat_desc: '',
			cat: '',
			cat_desc: '',
			cap: '',
			cap_desc: '',
			mesAnoDiagnostico: '',
			historico: '',
			queixasAtuais: ''
		};
	}

	/** @returns {MedicationForm} */
	function createEmptyMedicationForm() {
		return {
			sourceId: null,
			principio_ativo: '',
			concentracao: '',
			classe: '',
			forma_farmaceutica: '',
			fornecimento_sus: '',
			observacoes: '',
			frequenciaTipo: 'diario',
			diario: {
				manha: '',
				tarde: '',
				noite: ''
			},
			semanal: 'Segunda a sexta',
			intervalo: '12h',
			especial: '',
			doseQual: ''
		};
	}

	/** @returns {Record<string, FamilyHistoryEntry>} */
	function createEmptyFamilyHistory() {
		return familyHistoryOptions.reduce((acc, option) => {
			acc[option.id] = {
				checked: false,
				parentes: [createFamilyRelative()],
				detalhes: ''
			};
			return acc;
		}, /** @type {Record<string, FamilyHistoryEntry>} */ ({}));
	}

	/** @returns {FamilyHistoryRelative} */
	function createFamilyRelative() {
		return {
			id: createId(),
			parentesco: '',
			idade: '',
			detalhes: ''
		};
	}

	function createId() {
		return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
			const response = await fetch('/api/guias-consulta');
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Falha ao carregar textos-guia.');
			}

			guides = { ...defaultGuides, ...(data.guides ?? {}) };
			guideWarning = data.warning ?? '';
		} catch (e) {
			guideWarning = e instanceof Error ? e.message : 'Não foi possível carregar os textos-guia.';
		}
	}

	/**
	 * @param {string} key
	 */
	function openGuideEditor(key) {
		editingGuideKey = key;
		editingGuideLabel = guideSectionLabels[key] ?? key;
		editingGuideText = guides[key] ?? '';
		guideDialogRef?.showModal();
	}

	function closeGuideEditor() {
		guideDialogRef?.close();
	}

	async function saveGuide() {
		if (!editingGuideKey || !editingGuideText.trim()) {
			erro = 'O texto-guia não pode ficar vazio.';
			return;
		}

		savingGuide = true;
		erro = '';
		try {
			const response = await fetch('/api/guias-consulta', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					secao: editingGuideKey,
					conteudo: editingGuideText
				})
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Falha ao salvar texto-guia.');
			}

			guides = {
				...guides,
				[editingGuideKey]: editingGuideText.trim()
			};
			closeGuideEditor();
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado ao salvar guia.';
		} finally {
			savingGuide = false;
		}
	}

	/**
	 * @param {DiseaseItem | null} [item=null]
	 */
	function openDiseaseModal(item = null) {
		editingDiseaseId = item?.id ?? null;
		diseaseMode = item?.mode ?? 'cid';
		diseaseSearch = item ? `${item.subcat} ${item.subcat_desc}`.trim() : '';
		diseaseSearchResults = [];
		diseaseForm = item
			? {
					subcat: item.subcat ?? '',
					subcat_desc: item.subcat_desc ?? '',
					cat: item.cat ?? '',
					cat_desc: item.cat_desc ?? '',
					cap: item.cap ?? '',
					cap_desc: item.cap_desc ?? '',
					mesAnoDiagnostico: item.mesAnoDiagnostico ?? '',
					historico: item.historico ?? '',
					queixasAtuais: item.queixasAtuais ?? ''
				}
			: createEmptyDiseaseForm();
		diseaseDialogRef?.showModal();
		if (!item) {
			queueMicrotask(() => {
				diseaseSearch = '';
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
				parentes: [...(familyHistory[optionId]?.parentes ?? []), createFamilyRelative()]
			}
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
				parentes: current.length > 1 ? current.filter((relative) => relative.id !== relativeId) : current
			}
		};
	}

	function closeDiseaseModal() {
		diseaseDialogRef?.close();
	}

	function scheduleDiseaseSearch() {
		clearTimeout(diseaseSearchTimer);
		if (!diseaseSearch.trim() || diseaseMode !== 'cid') {
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
				page: '1',
				limit: '50'
			});
			const response = await fetch(`/api/cid10?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Falha ao pesquisar CID-10.');
			}

			diseaseSearchResults = data.items ?? [];
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado na busca CID-10.';
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
			subcat: item.subcat ?? '',
			subcat_desc: item.subcat_desc ?? '',
			cat: item.cat ?? '',
			cat_desc: item.cat_desc ?? '',
			cap: item.cap ?? '',
			cap_desc: item.cap_desc ?? ''
		};
		diseaseSearch = `${item.cat_desc} - ${item.subcat}`;
		diseaseSearchResults = [];
	}

	function saveDisease() {
		const manualChapter = chapterOptions.find((item) => item.cap === diseaseForm.cap);
		const finalDisease = {
			id: editingDiseaseId ?? createId(),
			mode: diseaseMode,
			subcat: diseaseForm.subcat.trim(),
			subcat_desc: diseaseForm.subcat_desc.trim(),
			cat: diseaseForm.cat.trim(),
			cat_desc: diseaseForm.cat_desc.trim(),
			cap: diseaseForm.cap.trim(),
			cap_desc: (diseaseForm.cap_desc || manualChapter?.cap_desc || '').trim(),
			mesAnoDiagnostico: diseaseForm.mesAnoDiagnostico.trim(),
			historico: diseaseForm.historico.trim(),
			queixasAtuais: diseaseForm.queixasAtuais.trim()
		};

		if (!finalDisease.subcat_desc || !finalDisease.cap) {
			erro = 'Preencha a descrição da doença e o capítulo CID.';
			return;
		}

		if (editingDiseaseId) {
			diseases = [...diseases.map((item) => (item.id === editingDiseaseId ? finalDisease : item))];
		} else {
			diseases = [...diseases, finalDisease];
		}

		closeDiseaseModal();
	}

	/**
	 * @param {string} id
	 */
	function deleteDisease(id) {
		if (!window.confirm('Excluir esta doença do prontuário em montagem?')) return;
		diseases = [...diseases.filter((item) => item.id !== id)];
	}

	/**
	 * @param {ConsultationMedication | null} [item=null]
	 */
	function openMedicationModal(item = null) {
		editingMedicationId = item?.id ?? null;
		medicationSearch = item?.principio_ativo ?? '';
		medicationSearchResults = [];
		medicationForm = item
			? {
					sourceId: item.sourceId ?? null,
					principio_ativo: item.principio_ativo ?? '',
					concentracao: item.concentracao ?? '',
					classe: item.classe ?? '',
					forma_farmaceutica: item.forma_farmaceutica ?? '',
					fornecimento_sus: item.fornecimento_sus ?? '',
					observacoes: item.observacoes ?? '',
					frequenciaTipo: item.frequenciaTipo ?? 'diario',
					diario: normalizeDailyFrequency(item.diario),
					semanal: item.semanal ?? 'Segunda a sexta',
					intervalo: item.intervalo ?? '12h',
					especial: item.especial ?? '',
					doseQual: item.doseQual ?? ''
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
				page: '1',
				limit: '50'
			});
			const response = await fetch(`/api/medicamentos?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Falha ao pesquisar medicamentos.');
			}
			medicationSearchResults = data.items ?? [];
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado na busca de medicamentos.';
		} finally {
			medicationLoading = false;
		}
	}

	function startManualMedication() {
		medicationManualMode = true;
		medicationSearch = '';
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
			principio_ativo: item.principio_ativo ?? '',
			concentracao: item.concentracao ?? '',
			classe: item.classe ?? '',
			forma_farmaceutica: item.forma_farmaceutica ?? '',
			fornecimento_sus: item.fornecimento_sus ?? ''
		};
		medicationSearch = item.principio_ativo ?? '';
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
			doseQual: medicationForm.doseQual.trim()
		};

		if (!finalMedication.principio_ativo) {
			erro = 'Preencha o princípio ativo.';
			return;
		}

		if (editingMedicationId) {
			medications = [...medications.map((item) => (item.id === editingMedicationId ? finalMedication : item))];
		} else {
			medications = [...medications, finalMedication];
		}

		closeMedicationModal();
	}

	/**
	 * @param {string} id
	 */
	function deleteMedication(id) {
		if (!window.confirm('Excluir este medicamento do prontuário em montagem?')) return;
		medications = [...medications.filter((item) => item.id !== id)];
	}

	/**
	 * @param {ConsultationMedication} item
	 */
	function describeFrequency(item) {
		if (item.frequenciaTipo === 'diario') {
			const periods = [
				item.diario?.manha ? `Manhã: ${item.diario.manha}` : '',
				item.diario?.tarde ? `Tarde: ${item.diario.tarde}` : '',
				item.diario?.noite ? `Noite: ${item.diario.noite}` : ''
			].filter(Boolean);
			return periods.length ? `Diário (${periods.join(', ')})` : 'Diário';
		}
		if (item.frequenciaTipo === 'semanal') {
			const doseInfo = item.doseQual ? ` - ${item.doseQual}` : '';
			return `Semanal: ${item.semanal}${doseInfo}`;
		}
		if (item.frequenciaTipo === 'intervalo') {
			const doseInfo = item.doseQual ? ` - ${item.doseQual}` : '';
			return `Intervalo: a cada ${item.intervalo}${doseInfo}`;
		}
		return `Especial: ${item.especial || 'não informado'}`;
	}

	/**
	 * @param {unknown} diario
	 */
	function normalizeDailyFrequency(diario) {
		const value = /** @type {{ manha?: unknown; tarde?: unknown; noite?: unknown } | undefined} */ (diario);
		return {
			manha: typeof value?.manha === 'string' ? value.manha : value?.manha ? '1' : '',
			tarde: typeof value?.tarde === 'string' ? value.tarde : value?.tarde ? '1' : '',
			noite: typeof value?.noite === 'string' ? value.noite : value?.noite ? '1' : ''
		};
	}

	function buildDraftSnapshot() {
		return {
			version: 1,
			subjective,
			objective: {
				sinaisVitais: { ...objective.sinaisVitais },
				antropometria: { ...objective.antropometria },
				exameFisico: { ...objective.exameFisico }
			},
			assessment,
			plan,
			familyHistory,
			diseases: [...diseases],
			medications: [...medications]
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
					...(draft.subjective.identificacao ?? {})
				},
				patologicos: {
					...subjective.patologicos,
					...(draft.subjective.patologicos ?? {})
				},
				recordatorioAlimentar: {
					...subjective.recordatorioAlimentar,
					...(draft.subjective.recordatorioAlimentar ?? {})
				},
				ginecologica: {
					...subjective.ginecologica,
					...(draft.subjective.ginecologica ?? {})
				}
			};
		}
		if (draft.objective) {
			objective = {
				sinaisVitais: { ...objective.sinaisVitais, ...(draft.objective.sinaisVitais ?? {}) },
				antropometria: { ...objective.antropometria, ...(draft.objective.antropometria ?? {}) },
				exameFisico: { ...objective.exameFisico, ...(draft.objective.exameFisico ?? {}) }
			};
		}
		if (draft.assessment) assessment = { ...assessment, ...draft.assessment };
		if (draft.plan) plan = { ...plan, ...draft.plan };
		if (draft.familyHistory) {
			const nextFamilyHistory = createEmptyFamilyHistory();
			for (const option of familyHistoryOptions) {
				const stored = draft.familyHistory[option.id];
				if (stored) {
					const legacyStored = /** @type {FamilyHistoryEntry & { parentesco?: string; idade?: string }} */ (stored);
					nextFamilyHistory[option.id] = {
						checked: Boolean(stored.checked),
						detalhes: stored.detalhes ?? '',
						parentes: Array.isArray(stored.parentes)
							? stored.parentes.map((relative) => ({
									id: relative.id ?? createId(),
									parentesco: relative.parentesco ?? '',
									idade: relative.idade ?? '',
									detalhes: relative.detalhes ?? ''
								}))
							: [
									{
										id: createId(),
										parentesco: legacyStored.parentesco ?? '',
										idade: legacyStored.idade ?? '',
										detalhes: stored.detalhes ?? ''
									}
								]
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
				doseQual: item.doseQual || ''
			}));
		}
	}

	/**
	 * @param {string} principioAtivo
	 */
	function pesquisarMedicamento(principioAtivo) {
		const query = `medicamento de referência, classe, mecanismo de ação, indicações, contra-indicações, efeitos adversos e metabolismo do medicamento ${principioAtivo}`;
		window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
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
		if (typeof value === 'string') return value.trim() === '';
		if (Array.isArray(value)) return value.length === 0;
		if (typeof value === 'object') return Object.keys(value).length === 0;
		if (typeof value === 'number') return false; // 0 é um valor válido
		return !value;
	}

	/**
	 * Schema de mapeamento para exportação do Subjetivo
	 * Define como cada campo deve ser formatado e exibido
	 * @type {any}
	 */
	const subjetivoSchema = {
		identificacao: {
			title: 'IDENTIFICAÇÃO',
			fields: {
				idade: { label: 'Idade', formatter: (/** @type {string} */ v) => v },
				ocupacao: { label: 'Ocupação', formatter: (/** @type {string} */ v) => v },
				naturalidade: { label: 'Naturalidade', formatter: (/** @type {string} */ v) => v },
				acompanhante: { label: 'Acompanhante', formatter: (/** @type {string} */ v) => v },
				sexo: { label: 'Sexo biológico', formatter: (/** @type {string} */ v) => v },
				genero: { label: 'Gênero', formatter: (/** @type {string} */ v, /** @type {any} */ obj) => v === 'Outros' ? obj.generoOutro || v : v },
				raca: { label: 'Raça', formatter: (/** @type {string} */ v, /** @type {any} */ obj) => v === 'Outros' ? obj.racaOutro || v : v },
				estadoCivil: { label: 'Estado civil', formatter: (/** @type {string} */ v, /** @type {any} */ obj) => v === 'Outros' ? obj.estadoCivilOutro || v : v },
				escolaridade: { label: 'Escolaridade', formatter: (/** @type {string} */ v, /** @type {any} */ obj) => v === 'Outros' ? obj.escolaridadeOutro || v : v },
				religiao: { label: 'Religião', formatter: (/** @type {string} */ v, /** @type {any} */ obj) => v === 'Outros' ? obj.religiaoOutro || v : v }
			}
		},
		queixaPrincipal: { label: 'QUEIXA PRINCIPAL', isSimple: true },
		hma: { label: 'HMA', isSimple: true },
		revisaoSistemas: { label: 'REVISÃO DE SISTEMAS', isSimple: true },
		patologicos: {
			title: 'HISTÓRIA PATOLÓGICA PREGRESSA',
			fields: {
				alergia: { label: 'Alergia', formatter: (/** @type {string} */ v) => v },
				cirurgias: { label: 'Cirurgias', formatter: (/** @type {string} */ v) => v },
				internacoes: { label: 'Internações', formatter: (/** @type {string} */ v) => v },
				traumatismos: { label: 'Traumatismos', formatter: (/** @type {string} */ v) => v }
			}
		},
		ocupacional: { label: 'HISTÓRIA OCUPACIONAL', isSimple: true },
		psicossocial: { label: 'HISTÓRIA PSICOSSOCIAL', isSimple: true },
		habitos: { label: 'HÁBITOS DE VIDA', isSimple: true },
		recordatorioAlimentar: {
			title: 'RECORDATÓRIO ALIMENTAR',
			fields: {
				cafeManha: { label: 'Café da manhã', formatter: (/** @type {string} */ v) => v },
				lancheManha: { label: 'Lanche da manhã', formatter: (/** @type {string} */ v) => v },
				almoco: { label: 'Almoço', formatter: (/** @type {string} */ v) => v },
				lancheTarde: { label: 'Lanche da tarde', formatter: (/** @type {string} */ v) => v },
				cafeTarde: { label: 'Café da tarde', formatter: (/** @type {string} */ v) => v },
				lancheAntesJantar: { label: 'Lanche antes do jantar', formatter: (/** @type {string} */ v) => v },
				jantar: { label: 'Jantar', formatter: (/** @type {string} */ v) => v },
				lancheDepoisJantar: { label: 'Lanche depois do jantar', formatter: (/** @type {string} */ v) => v }
			}
		},
		ginecologica: {
			title: 'HISTÓRIA GINECOLÓGICA',
			condition: (/** @type {any} */ data) => data.identificacao?.sexo === 'Feminino',
			fields: {
				g: { label: 'G', formatter: (/** @type {string} */ v) => v },
				p: { label: 'P', formatter: (/** @type {string} */ v) => v },
				n: { label: 'N', formatter: (/** @type {string} */ v) => v },
				c: { label: 'C', formatter: (/** @type {string} */ v) => v },
				a: { label: 'A', formatter: (/** @type {string} */ v) => v },
				e: { label: 'E', formatter: (/** @type {string} */ v) => v },
				dum: { label: 'DUM', formatter: (/** @type {string} */ v) => v },
				mac: { label: 'MAC', formatter: (/** @type {string} */ v) => v }
			}
		}
	};

	/**
	 * Exporta os dados do Subjetivo para a área de transferência
	 */
	async function exportarSubjetivo() {
		const lines = [];
		
		// Título principal
		lines.push('## ANAMNESE (S)');
		lines.push('');

		// Itera sobre o schema
		for (const [key, config] of Object.entries(subjetivoSchema)) {
			const data = /** @type {any} */ (subjective)[key];
			
			// Verifica condição (ex: ginecológica só aparece se sexo feminino)
			if (config.condition && !config.condition(subjective)) continue;
			
			if (config.isSimple) {
				// Campos simples (string direta)
				if (!isEmpty(data)) {
					lines.push(`**${config.label}**`);
					lines.push(data);
					lines.push('');
				}
			} else if (config.fields) {
				// Campos compostos (objetos com múltiplos campos)
				const validFields = [];
				
				for (const [fieldKey, fieldConfig] of Object.entries(config.fields)) {
					const value = data?.[fieldKey];
					if (!isEmpty(value)) {
						const formatted = fieldConfig.formatter(value, data);
						validFields.push(`**${fieldConfig.label}:** ${formatted}`);
					}
				}
				
				// Só adiciona a seção se houver campos válidos
				if (validFields.length > 0) {
					lines.push(`**${config.title}**`);
					lines.push(...validFields);
					lines.push('');
				}
			}
		}

		// Doenças estratificadas
		if (diseases.length > 0) {
			lines.push('**DOENÇAS ESTRATIFICADAS**');
			for (const disease of diseases) {
				const parts = [disease.subcat_desc];
				if (disease.subcat) parts.push(`(${disease.subcat})`);
				if (disease.mesAnoDiagnostico) parts.push(`- Diagnóstico: ${disease.mesAnoDiagnostico}`);
				lines.push(`- ${parts.join(' ')}`);
				if (disease.historico) lines.push(`  Histórico: ${disease.historico}`);
				if (disease.queixasAtuais) lines.push(`  Queixas atuais: ${disease.queixasAtuais}`);
			}
			lines.push('');
		}

		// Medicamentos
		if (medications.length > 0) {
			lines.push('**MEDICAMENTOS EM USO**');
			for (const med of medications) {
				const freq = describeFrequency(med);
				lines.push(`- ${med.principio_ativo} ${med.concentracao ? `(${med.concentracao})` : ''} - ${freq}`);
				if (med.observacoes) lines.push(`  Obs: ${med.observacoes}`);
			}
			lines.push('');
		}

		// História familiar
		const familyHistoryEntries = Object.entries(familyHistory).filter(([_, entry]) => entry.checked);
		if (familyHistoryEntries.length > 0) {
			lines.push('**HISTÓRIA FAMILIAR**');
			for (const [key, entry] of familyHistoryEntries) {
				const option = familyHistoryOptions.find((o) => o.id === key);
				if (!option) continue;
				const parentes = entry.parentes.filter((p) => p.parentesco || p.idade).map((p) => {
					return [p.parentesco, p.idade].filter(Boolean).join(' - ');
				});
				if (parentes.length > 0) {
					lines.push(`- ${option.label}: ${parentes.join(', ')}`);
				} else {
					lines.push(`- ${option.label}`);
				}
				if (entry.detalhes) lines.push(`  Detalhes: ${entry.detalhes}`);
			}
			lines.push('');
		}

		const finalText = lines.join('\n');

		try {
			await navigator.clipboard.writeText(finalText);
			aviso = 'Anamnese (Subjetivo) copiada para a área de transferência!';
			setTimeout(() => (aviso = ''), 3000);
		} catch (err) {
			erro = 'Erro ao copiar para a área de transferência. Tente novamente.';
		}
	}

	/**
	 * Exporta os dados do Objetivo para a área de transferência
	 */
	async function exportarObjetivo() {
		const lines = [];

		lines.push('## EXAME FÍSICO E TESTES (O)');
		lines.push('');

		// Sinais Vitais
		const sv = objective.sinaisVitais;
		const sinaisVitaisPreenchidos = sv.pas || sv.pad || sv.temperatura || sv.frequenciaCardiaca || sv.frequenciaRespiratoria || sv.spo2;
		if (sinaisVitaisPreenchidos) {
			lines.push('**SINAIS VITAIS**');
			if (sv.pas || sv.pad) lines.push(`- **PA:** ${sv.pas || '--'}/${sv.pad || '--'} mmHg`);
			if (sv.temperatura) lines.push(`- **Temperatura:** ${sv.temperatura} °C`);
			if (sv.frequenciaCardiaca) lines.push(`- **FC:** ${sv.frequenciaCardiaca} bpm`);
			if (sv.frequenciaRespiratoria) lines.push(`- **FR:** ${sv.frequenciaRespiratoria} irpm`);
			if (sv.spo2) lines.push(`- **SpO2:** ${sv.spo2} %`);
			lines.push('');
		}

		// Antropometria
		const ant = objective.antropometria;
		const antropometriaPreenchida = ant.altura || ant.peso || ant.circunferenciaAbdominal || ant.imc;
		if (antropometriaPreenchida) {
			lines.push('**ANTROPOMETRIA**');
			if (ant.altura) lines.push(`- **Altura:** ${ant.altura} cm`);
			if (ant.peso) lines.push(`- **Peso:** ${ant.peso} kg`);
			if (ant.circunferenciaAbdominal) lines.push(`- **Circunferência Abdominal:** ${ant.circunferenciaAbdominal} cm`);
			if (ant.imc) lines.push(`- **IMC:** ${ant.imc} kg/m²`);
			lines.push('');
		}

		// Exame Físico
		const ef = objective.exameFisico;
		const exameFisicoPreenchido = ef.geral || ef.aparelhoDigestorio || ef.aparelhoCardiovascular || ef.sistemaLinfatico || ef.neurologico || ef.respiratorioInferior || ef.respiratorioSuperior || ef.ginecologico;
		if (exameFisicoPreenchido) {
			lines.push('**EXAME FÍSICO**');
			if (ef.geral) lines.push(`- **Geral:** ${ef.geral}`);
			if (ef.aparelhoDigestorio) lines.push(`- **Aparelho Digestório:** ${ef.aparelhoDigestorio}`);
			if (ef.aparelhoCardiovascular) lines.push(`- **Aparelho Cardiovascular:** ${ef.aparelhoCardiovascular}`);
			if (ef.sistemaLinfatico) lines.push(`- **Sistema Linfático:** ${ef.sistemaLinfatico}`);
			if (ef.neurologico) lines.push(`- **Neurológico:** ${ef.neurologico}`);
			if (ef.respiratorioInferior) lines.push(`- **Respiratório Inferior:** ${ef.respiratorioInferior}`);
			if (ef.respiratorioSuperior) lines.push(`- **Respiratório Superior (ORL):** ${ef.respiratorioSuperior}`);
			if (ef.ginecologico) lines.push(`- **Exame Ginecológico:** ${ef.ginecologico}`);
			lines.push('');
		}

		// Exames Laboratoriais
		if (laboratorioSelecionados.length > 0) {
			lines.push('**EXAMES LABORATORIAIS**');
			for (const [pacote, itens] of Object.entries(laboratorioAgrupado)) {
				lines.push(`*${pacote}:*`);
				for (const item of itens) {
					const resultado = item.resultado ? ` = ${item.resultado}` : '';
					lines.push(`- ${item.nome}${resultado}`);
				}
			}
			lines.push('');
		}

		// Exames de Imagem
		if (imagemSelecionados.length > 0) {
			lines.push('**EXAMES DE IMAGEM E FUNCIONAIS**');
			for (const item of imagemSelecionados) {
				lines.push(`- **${item.nome}**`);
				if (item.motivo) lines.push(`  - Motivo: ${item.motivo}`);
				if (item.resultado) lines.push(`  - Resultado: ${item.resultado}`);
				if (item.medicoExecutor) lines.push(`  - Médico: ${item.medicoExecutor}`);
			}
			lines.push('');
		}

		const finalText = lines.join('\n');

		try {
			await navigator.clipboard.writeText(finalText);
			aviso = 'Exame Físico e Testes (Objetivo) copiados para a área de transferência!';
			setTimeout(() => (aviso = ''), 3000);
		} catch (err) {
			erro = 'Erro ao copiar para a área de transferência. Tente novamente.';
		}
	}

	// ==========================================
	// FUNÇÕES DE EXAMES LABORATORIAIS
	// ==========================================

	function openLaboratoryModal() {
		labModo = 'pacote';
		labPacoteSelecionado = '';
		labExameManual = { nome: '', valoresReferencia: '', unidade: '' };
		labSearch = '';
		labSearchResults = [];
		labDialogRef?.showModal();
	}

	function closeLaboratoryModal() {
		labDialogRef?.close();
	}

	async function buscarExamesLaboratoriais() {
		labLoading = true;
		try {
			const params = new URLSearchParams({ page: '1', limit: '100' });
			if (labSearch.trim()) params.set('q', labSearch.trim());
			if (labPacoteSelecionado) params.set('pacote', labPacoteSelecionado);

			const response = await fetch(`/api/exames?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Falha ao buscar exames.');
			labSearchResults = data.items ?? [];
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro ao buscar exames.';
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
			pacote: exame.pacote || labPacoteSelecionado || 'Exame Avulso',
			valoresReferencia: exame.valores_referencia || '',
			unidade: exame.unidade_medida || '',
			resultado: '',
			selecionado: false
		};
		laboratorioSelecionados = [...laboratorioSelecionados, novoExame];
	}

	function adicionarExameLaboratorialManual() {
		if (!labExameManual.nome.trim()) {
			erro = 'Informe o nome do exame.';
			return;
		}
		const novoExame = {
			id: createId(),
			nome: labExameManual.nome.trim(),
			pacote: 'Exame Manual',
			valoresReferencia: labExameManual.valoresReferencia.trim(),
			unidade: labExameManual.unidade.trim(),
			resultado: '',
			selecionado: false
		};
		laboratorioSelecionados = [...laboratorioSelecionados, novoExame];
		labExameManual = { nome: '', valoresReferencia: '', unidade: '' };
	}

	/**
	 * @param {string} id
	 */
	function excluirLaboratorio(id) {
		if (!window.confirm('Excluir este exame?')) return;
		laboratorioSelecionados = [...laboratorioSelecionados.filter((item) => item.id !== id)];
	}

	function excluirLaboratorioSelecionados() {
		if (!window.confirm('Excluir os exames selecionados?')) return;
		laboratorioSelecionados = [...laboratorioSelecionados.filter((item) => !item.selecionado)];
	}

	function toggleTodosLaboratorio() {
		const novoEstado = !laboratorioSelecionadosTodos;
		laboratorioSelecionados = laboratorioSelecionados.map((item) => ({ ...item, selecionado: novoEstado }));
	}

	/**
	 * @param {any[]} itens
	 */
	function toggleGrupoLaboratorio(itens) {
		const novoEstado = !itens.every((i) => i.selecionado);
		const idsDoGrupo = new Set(itens.map((i) => i.id));
		laboratorioSelecionados = laboratorioSelecionados.map((item) =>
			idsDoGrupo.has(item.id) ? { ...item, selecionado: novoEstado } : item
		);
	}

	// ==========================================
	// FUNÇÕES DE EXAMES DE IMAGEM/FUNCIONAIS
	// ==========================================

	function openImagemModal() {
		imagemExameManual = '';
		imagemSearch = '';
		imagemSearchResults = [];
		imagemDialogRef?.showModal();
	}

	function closeImagemModal() {
		imagemDialogRef?.close();
	}

	async function buscarProcedimentos() {
		imagemLoading = true;
		try {
			const params = new URLSearchParams({ page: '1', limit: '50' });
			if (imagemSearch.trim()) params.set('q', imagemSearch.trim());

			const response = await fetch(`/api/procedimentos?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Falha ao buscar procedimentos.');
			imagemSearchResults = data.items ?? [];
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro ao buscar procedimentos.';
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
			motivo: '',
			resultado: '',
			medicoExecutor: ''
		};
		imagemSelecionados = [...imagemSelecionados, novoExame];
	}

	function adicionarExameImagemManual() {
		if (!imagemExameManual.trim()) {
			erro = 'Informe o nome do exame.';
			return;
		}
		const novoExame = {
			id: createId(),
			nome: imagemExameManual.trim(),
			motivo: '',
			resultado: '',
			medicoExecutor: ''
		};
		imagemSelecionados = [...imagemSelecionados, novoExame];
		imagemExameManual = '';
	}

	/**
	 * @param {string} id
	 */
	function excluirImagem(id) {
		if (!window.confirm('Excluir este exame?')) return;
		imagemSelecionados = [...imagemSelecionados.filter((item) => item.id !== id)];
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

		// Carrega doenças e medicamentos de forma independente com reatividade garantida
		const storedDiseases = loadFromLocalStorage(DISEASES_STORAGE_KEY, []);
		const storedMedications = loadFromLocalStorage(MEDICATIONS_STORAGE_KEY, []);
		
		if (Array.isArray(storedDiseases) && storedDiseases.length > 0) {
			diseases = [...storedDiseases]; // Reatividade por propagação
		}
		if (Array.isArray(storedMedications) && storedMedications.length > 0) {
			medications = storedMedications.map((item) => ({
				...item,
				diario: normalizeDailyFrequency(item.diario),
				doseQual: item.doseQual || ''
			})); // Reatividade por propagação via map
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
		<header class="mb-4 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Consulta Médica</p>
			<div class="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
				<div class="max-w-3xl">
					<h1 class="text-2xl font-semibold tracking-tight text-slate-900">Estrutura SOAP avançada para atendimento ambulatorial</h1>
					<p class="mt-1 text-sm text-slate-600">
						Monte o raciocínio clínico com histórico estratificado por CID-10, medicações agrupadas por classe e textos-guia editáveis.
					</p>
				</div>
				<div class="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
						<p class="font-semibold text-slate-800">{diseases.length}</p>
						<p>Doenças registradas</p>
					</div>
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
						<p class="font-semibold text-slate-800">{medications.length}</p>
						<p>Medicamentos ativos</p>
					</div>
					<div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
						<p class="font-semibold text-slate-800">{Object.values(familyHistory).filter((item) => item.checked).length}</p>
						<p>Antecedentes familiares</p>
					</div>
				</div>
			</div>
		</header>

		{#if erro}
			<p class="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{erro}</p>
		{/if}
		{#if guideWarning}
			<p class="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{guideWarning}</p>
		{/if}
		{#if aviso}
			<p class="mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">{aviso}</p>
		{/if}

		<div class="space-y-4">
			<details open class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<summary class="flex cursor-pointer list-none items-center justify-between bg-slate-900 px-5 py-4 text-white">
					<div>
						<p class="text-xs uppercase tracking-[0.28em] text-slate-300">SOAP</p>
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
						<span class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">História clínica</span>
					</div>
				</summary>

				<div class="space-y-4 p-4">
					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900">Identificação</summary>
						<div class="grid gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-4">
							<label class="space-y-1 text-xs text-slate-700">
								<span>Idade</span>
								<input bind:value={subjective.identificacao.idade} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Ocupação</span>
								<input bind:value={subjective.identificacao.ocupacao} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Naturalidade</span>
								<input bind:value={subjective.identificacao.naturalidade} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Nome do acompanhante</span>
								<input bind:value={subjective.identificacao.acompanhante} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>

							<div class="space-y-2 text-xs text-slate-700 xl:col-span-2">
								<span class="block">Sexo biológico</span>
								<div class="flex flex-wrap gap-2">
									<label class="rounded-full border border-slate-300 bg-white px-3 py-1.5"><input class="mr-1" type="radio" bind:group={subjective.identificacao.sexo} value="Feminino" />Feminino</label>
									<label class="rounded-full border border-slate-300 bg-white px-3 py-1.5"><input class="mr-1" type="radio" bind:group={subjective.identificacao.sexo} value="Masculino" />Masculino</label>
								</div>
							</div>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Gênero</span>
								<select bind:value={subjective.identificacao.genero} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
									<option value="">Selecione</option>
									{#each generoOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.genero === 'Outros'}
									<input type="text" bind:value={subjective.identificacao.generoOutro} placeholder="Especifique" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
								{/if}
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Raça</span>
								<select bind:value={subjective.identificacao.raca} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
									<option value="">Selecione</option>
									{#each racaOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.raca === 'Outros'}
									<input type="text" bind:value={subjective.identificacao.racaOutro} placeholder="Especifique" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
								{/if}
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Estado civil</span>
								<select bind:value={subjective.identificacao.estadoCivil} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
									<option value="">Selecione</option>
									{#each estadoCivilOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.estadoCivil === 'Outros'}
									<input type="text" bind:value={subjective.identificacao.estadoCivilOutro} placeholder="Especifique" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
								{/if}
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Escolaridade</span>
								<select bind:value={subjective.identificacao.escolaridade} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
									<option value="">Selecione</option>
									{#each escolaridadeOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.escolaridade === 'Outros'}
									<input type="text" bind:value={subjective.identificacao.escolaridadeOutro} placeholder="Especifique" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
								{/if}
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Religião</span>
								<select bind:value={subjective.identificacao.religiao} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
									<option value="">Selecione</option>
									{#each religiaoOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								{#if subjective.identificacao.religiao === 'Outros'}
									<input type="text" bind:value={subjective.identificacao.religiaoOutro} placeholder="Especifique" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
								{/if}
							</label>
						</div>
					</details>

					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900">Queixa Principal</summary>
						<div class="px-4 pb-4">
							<input bind:value={subjective.queixaPrincipal} placeholder="Dor torácica há 2 semanas, dispneia aos esforços..." class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
						</div>
					</details>

					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900">História da Moléstia Atual (HMA)</summary>
						<section class="px-4 pb-4">
							<div class="rounded-2xl border border-slate-200 bg-white p-4">
								<div class="mb-2 flex items-start justify-between gap-3">
									<div>
										<h3 class="text-sm font-semibold text-slate-900">HMA</h3>
										<p class="text-xs text-slate-500">Linha narrativa da queixa atual.</p>
									</div>
									<div class="flex items-center gap-2">
										<span class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600">i</span>
										<button type="button" on:click={() => openGuideEditor('hma')} class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100">Editar</button>
									</div>
								</div>
								<div class="relative">
									<textarea
										use:autogrow
										bind:value={subjective.hma}
										on:focus={() => (activeGuideKey = 'hma')}
										on:blur={() => (activeGuideKey = '')}
										rows="5"
										class="relative z-10 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									></textarea>
									{#if activeGuideKey === 'hma'}
										<p class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xl rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm">
											{guides.hma}
										</p>
									{/if}
								</div>
							</div>
						</section>
					</details>

					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900">Revisão de Sistemas</summary>
						<section class="px-4 pb-4">
							<div class="rounded-2xl border border-slate-200 bg-white p-4">
								<div class="mb-2 flex items-start justify-between gap-3">
									<div>
										<h3 class="text-sm font-semibold text-slate-900">Revisão de Sistemas</h3>
										<p class="text-xs text-slate-500">Checklist narrativo focado nos sistemas.</p>
									</div>
									<div class="flex items-center gap-2">
										<span class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600">i</span>
										<button type="button" on:click={() => openGuideEditor('revisao_sistemas')} class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100">Editar</button>
									</div>
								</div>
								<div class="relative">
									<textarea
										use:autogrow
										bind:value={subjective.revisaoSistemas}
										on:focus={() => (activeGuideKey = 'revisao_sistemas')}
										on:blur={() => (activeGuideKey = '')}
										rows="5"
										class="relative z-10 w-full rounded-xl border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
									></textarea>
									{#if activeGuideKey === 'revisao_sistemas'}
										<p class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xl rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm">
											{guides.revisao_sistemas}
										</p>
									{/if}
								</div>
							</div>
						</section>
					</details>

					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900">História Patológica Pregressa</summary>
						<div class="grid gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-4">
							<label class="space-y-1 text-xs text-slate-700">
								<span>Alergia</span>
								<textarea use:autogrow bind:value={subjective.patologicos.alergia} rows="3" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Cirurgias</span>
								<textarea use:autogrow bind:value={subjective.patologicos.cirurgias} rows="3" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Internações</span>
								<textarea use:autogrow bind:value={subjective.patologicos.internacoes} rows="3" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Traumatismos</span>
								<textarea use:autogrow bind:value={subjective.patologicos.traumatismos} rows="3" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</label>
						</div>

						<div class="border-t border-slate-200 px-4 py-4">
							<div class="mb-3 flex items-center justify-between gap-3">
								<div>
									<h3 class="text-sm font-semibold text-slate-900">Doenças estratificadas por CID-10</h3>
									<p class="text-xs text-slate-500">Agrupamento automático por capítulo com edição local do histórico.</p>
								</div>
								<button type="button" on:click={() => openDiseaseModal()} class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800">Adicionar Doença</button>
							</div>

							{#if Object.keys(diseaseGroups).length === 0}
								<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500">
									Nenhuma doença adicionada.
								</div>
							{:else}
								<div class="space-y-3">
									{#each Object.entries(diseaseGroups) as [chapter, items]}
										<section class="rounded-2xl border border-slate-200 bg-white p-3">
											<div class="mb-2 flex items-center justify-between">
												<h4 class="text-sm font-semibold text-slate-900">{chapter}</h4>
												<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{items.length} item(ns)</span>
											</div>
											<div class="space-y-2">
												{#each items as item}
													<article class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
														<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
															<div>
																<p class="text-sm font-semibold text-slate-900">{item.subcat_desc}</p>
																<p class="text-xs text-slate-500">
																	{item.subcat || 'Sem código'}{item.cat_desc ? ` • ${item.cat_desc}` : ''}
																	{item.mesAnoDiagnostico ? ` • Diagnóstico: ${item.mesAnoDiagnostico}` : ''}
																</p>
																{#if item.historico}
																	<p class="mt-2 text-xs text-slate-700"><span class="font-semibold">Histórico:</span> {item.historico}</p>
																{/if}
																{#if item.queixasAtuais}
																	<p class="mt-1 text-xs text-slate-700"><span class="font-semibold">Queixas atuais:</span> {item.queixasAtuais}</p>
																{/if}
															</div>
															<div class="flex items-center gap-2">
																<button type="button" on:click={() => openDiseaseModal(item)} class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white">Editar</button>
																<button type="button" on:click={() => deleteDisease(item.id)} class="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Excluir</button>
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
							<div class="mb-3 flex items-center justify-between gap-3">
								<div>
									<h3 class="text-sm font-semibold text-slate-900">Medicamentos</h3>
									<p class="text-xs text-slate-500">Busca em tempo real na base RENAME e organização automática por classe.</p>
								</div>
								<button type="button" on:click={() => openMedicationModal()} class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800">Adicionar Medicamento</button>
							</div>

							{#if Object.keys(medicationGroups).length === 0}
								<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500">
									Nenhum medicamento adicionado.
								</div>
							{:else}
								<div class="space-y-3">
									{#each Object.entries(medicationGroups) as [group, items]}
										<section class="rounded-2xl border border-slate-200 bg-white p-3">
											<div class="mb-2 flex items-center justify-between">
												<h4 class="text-sm font-semibold text-slate-900">{group}</h4>
												<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{items.length} item(ns)</span>
											</div>
											<div class="grid gap-2 xl:grid-cols-2">
												{#each items as item}
													<div
														role="button"
														tabindex="0"
														on:click={() => pesquisarMedicamento(item.principio_ativo)}
														on:keydown={(event) => {
															if (event.key === 'Enter') pesquisarMedicamento(item.principio_ativo);
														}}
														class="group relative cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-400 hover:bg-white"
													>
														<div class="flex items-start justify-between gap-3">
															<div class="min-w-0 space-y-1">
																<p class="text-base font-semibold text-slate-900">{item.principio_ativo}</p>
																<p class="text-sm text-slate-700">{[item.concentracao, item.forma_farmaceutica].filter(Boolean).join(' • ') || 'Concentração e forma não informadas'}</p>
																<p class="text-xs text-slate-700">{describeFrequency(item)}</p>
																{#if item.observacoes}
																	<p class="pt-1 text-xs text-slate-600">{item.observacoes}</p>
																{/if}
															</div>
															<div class="flex items-center gap-2">
																<button type="button" on:click|stopPropagation={() => openMedicationModal(item)} class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white">Editar</button>
																<button type="button" on:click|stopPropagation={() => deleteMedication(item.id)} class="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Excluir</button>
															</div>
														</div>
														<div class="pointer-events-none absolute right-3 top-3 z-20 hidden max-w-xs rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-xs text-slate-600 opacity-90 shadow-xl backdrop-blur group-hover:block">
															<p><span class="font-semibold">Classe:</span> {item.classe || 'Não informada'}</p>
															<p class="mt-1"><span class="font-semibold">Fornecimento SUS:</span> {item.fornecimento_sus || 'Não informado'}</p>
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

					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900">História Familiar</summary>
						<div class="grid gap-3 px-4 pb-4 lg:grid-cols-2">
							{#each familyHistoryOptions as option}
								<div class="rounded-2xl border border-slate-200 bg-white p-3">
									<div class="flex items-center justify-between gap-2">
										<label class="flex items-center gap-2 text-sm font-medium text-slate-800">
											<input type="checkbox" bind:checked={familyHistory[option.id].checked} />
											{option.label}
										</label>
										{#if familyHistory[option.id].checked}
											<button
												type="button"
												on:click={() => addFamilyRelative(option.id)}
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
												<div class="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-[1fr_0.8fr_auto]">
													<label class="space-y-1 text-xs text-slate-700">
														<span>Grau de parentesco</span>
														<input bind:value={relative.parentesco} placeholder="Pai, avó, irmão..." class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
													</label>
													<label class="space-y-1 text-xs text-slate-700">
														<span>Idade do familiar</span>
														<input bind:value={relative.idade} placeholder="50 anos" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
													</label>
													<button
														type="button"
														on:click={() => removeFamilyRelative(option.id, relative.id)}
														disabled={familyHistory[option.id].parentes.length <= 1}
														class="self-end rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
													>
														Remover
													</button>
												</div>
											{/each}
											{#if option.id === 'outros'}
												<label class="block space-y-1 text-xs text-slate-700">
													<span>Detalhes</span>
													<input bind:value={familyHistory[option.id].detalhes} class="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
												</label>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</details>

					<div class="grid gap-4 lg:grid-cols-3">
						<section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
							<div class="mb-2 flex items-start justify-between gap-3">
								<div>
									<h3 class="text-sm font-semibold text-slate-900">História Ocupacional</h3>
									<p class="text-xs text-slate-500">Exposição e carga laboral.</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600">i</span>
									<button type="button" on:click={() => openGuideEditor('ocupacional')} class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white">Editar</button>
								</div>
							</div>
							<div class="relative">
								<textarea use:autogrow bind:value={subjective.ocupacional} on:focus={() => (activeGuideKey = 'ocupacional')} on:blur={() => (activeGuideKey = '')} rows="4" class="relative z-10 w-full rounded-xl border border-slate-300 bg-white/85 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
								{#if activeGuideKey === 'ocupacional'}
									<p class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xs rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm">{guides.ocupacional}</p>
								{/if}
							</div>
						</section>

						<section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
							<div class="mb-2 flex items-start justify-between gap-3">
								<div>
									<h3 class="text-sm font-semibold text-slate-900">História Psicossocial</h3>
									<p class="text-xs text-slate-500">Rede de apoio e vulnerabilidades.</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600">i</span>
									<button type="button" on:click={() => openGuideEditor('psicossocial')} class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white">Editar</button>
								</div>
							</div>
							<div class="relative">
								<textarea use:autogrow bind:value={subjective.psicossocial} on:focus={() => (activeGuideKey = 'psicossocial')} on:blur={() => (activeGuideKey = '')} rows="4" class="relative z-10 w-full rounded-xl border border-slate-300 bg-white/85 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
								{#if activeGuideKey === 'psicossocial'}
									<p class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xs rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm">{guides.psicossocial}</p>
								{/if}
							</div>
						</section>

						<section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
							<div class="mb-2 flex items-start justify-between gap-3">
								<div>
									<h3 class="text-sm font-semibold text-slate-900">Hábitos de Vida</h3>
									<p class="text-xs text-slate-500">Sono, atividade física, substâncias e rotina.</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600">i</span>
									<button type="button" on:click={() => openGuideEditor('habitos')} class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white">Editar</button>
								</div>
							</div>
							<div class="relative">
								<textarea use:autogrow bind:value={subjective.habitos} on:focus={() => (activeGuideKey = 'habitos')} on:blur={() => (activeGuideKey = '')} rows="4" class="relative z-10 w-full rounded-xl border border-slate-300 bg-white/85 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
								{#if activeGuideKey === 'habitos'}
									<p class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xs rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm">{guides.habitos}</p>
								{/if}
							</div>
							<div class="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
								<div class="mb-3 flex items-start justify-between gap-3">
									<div>
										<h4 class="text-sm font-semibold text-slate-900">Recordatório Alimentar</h4>
										<p class="text-xs text-slate-500">Registro das refeições do dia.</p>
									</div>
									<div class="flex items-center gap-2">
										<span class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600">i</span>
										<button type="button" on:click={() => openGuideEditor('recordatorio_alimentar')} class="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">Editar</button>
									</div>
								</div>
								<div class="relative">
									<div class="grid gap-2">
										<label class="space-y-1 text-xs text-slate-700"><span>Café da manhã</span><input bind:value={subjective.recordatorioAlimentar.cafeManha} on:focus={() => (activeGuideKey = 'recordatorio_alimentar')} on:blur={() => (activeGuideKey = '')} class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>Lanche da manhã</span><input bind:value={subjective.recordatorioAlimentar.lancheManha} on:focus={() => (activeGuideKey = 'recordatorio_alimentar')} on:blur={() => (activeGuideKey = '')} class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>Almoço</span><input bind:value={subjective.recordatorioAlimentar.almoco} on:focus={() => (activeGuideKey = 'recordatorio_alimentar')} on:blur={() => (activeGuideKey = '')} class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>Lanche da tarde</span><input bind:value={subjective.recordatorioAlimentar.lancheTarde} on:focus={() => (activeGuideKey = 'recordatorio_alimentar')} on:blur={() => (activeGuideKey = '')} class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>Café da tarde</span><input bind:value={subjective.recordatorioAlimentar.cafeTarde} on:focus={() => (activeGuideKey = 'recordatorio_alimentar')} on:blur={() => (activeGuideKey = '')} class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>Lanche antes do jantar</span><input bind:value={subjective.recordatorioAlimentar.lancheAntesJantar} on:focus={() => (activeGuideKey = 'recordatorio_alimentar')} on:blur={() => (activeGuideKey = '')} class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>Jantar</span><input bind:value={subjective.recordatorioAlimentar.jantar} on:focus={() => (activeGuideKey = 'recordatorio_alimentar')} on:blur={() => (activeGuideKey = '')} class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>Lanche depois do jantar</span><input bind:value={subjective.recordatorioAlimentar.lancheDepoisJantar} on:focus={() => (activeGuideKey = 'recordatorio_alimentar')} on:blur={() => (activeGuideKey = '')} class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
									</div>
									{#if activeGuideKey === 'recordatorio_alimentar'}
										<p class="pointer-events-none absolute bottom-3 right-3 z-20 max-w-xs rounded-lg bg-white/75 px-3 py-2 text-xs leading-relaxed text-slate-500 opacity-50 shadow-sm">{guides.recordatorio_alimentar}</p>
									{/if}
								</div>
							</div>
						</section>
					</div>
					{#if subjective.identificacao.sexo === 'Feminino'}
						<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
							<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900">História Ginecológica</summary>
							<div class="grid gap-3 px-4 pb-4 lg:grid-cols-[1fr_1fr_1fr]">
								<section class="rounded-2xl border border-slate-200 bg-white p-3 lg:col-span-3">
									<p class="mb-2 text-xs font-semibold text-slate-700">GPNCAE</p>
									<div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
										<label class="space-y-1 text-xs text-slate-700"><span>G</span><input type="number" min="0" bind:value={subjective.ginecologica.g} class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>P</span><input type="number" min="0" bind:value={subjective.ginecologica.p} class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>N</span><input type="number" min="0" bind:value={subjective.ginecologica.n} class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>C</span><input type="number" min="0" bind:value={subjective.ginecologica.c} class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>A</span><input type="number" min="0" bind:value={subjective.ginecologica.a} class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
										<label class="space-y-1 text-xs text-slate-700"><span>E</span><input type="number" min="0" bind:value={subjective.ginecologica.e} class="w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" /></label>
									</div>
								</section>
								<label class="space-y-1 text-xs text-slate-700">
									<span>DUM</span>
									<input type="date" bind:value={subjective.ginecologica.dum} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
								</label>
								<label class="space-y-1 text-xs text-slate-700 lg:col-span-2">
									<span>MAC</span>
									<input bind:value={subjective.ginecologica.mac} placeholder="Métodos anticoncepcionais" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
								</label>
							</div>
						</details>
					{/if}
				</div>
			</details>

			<details open class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<summary class="flex cursor-pointer list-none items-center justify-between bg-slate-800 px-5 py-4 text-white">
					<div>
						<p class="text-xs uppercase tracking-[0.28em] text-slate-300">SOAP</p>
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
						<span class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">Exame físico e métricas</span>
					</div>
				</summary>

				<div class="space-y-4 p-4">
					<!-- Sinais Vitais -->
					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900">
							<span>Sinais Vitais</span>
							<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
						</summary>
						<div class="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
							<label class="space-y-1 text-xs text-slate-700">
								<span>PAS (mmHg)</span>
								<input type="number" bind:value={objective.sinaisVitais.pas} placeholder="120" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>PAD (mmHg)</span>
								<input type="number" bind:value={objective.sinaisVitais.pad} placeholder="80" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Temperatura (°C)</span>
								<input type="number" step="0.1" bind:value={objective.sinaisVitais.temperatura} placeholder="36.5" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>FC (bpm)</span>
								<input type="number" bind:value={objective.sinaisVitais.frequenciaCardiaca} placeholder="72" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>FR (irpm)</span>
								<input type="number" bind:value={objective.sinaisVitais.frequenciaRespiratoria} placeholder="16" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>SpO2 (%)</span>
								<input type="number" bind:value={objective.sinaisVitais.spo2} placeholder="98" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
						</div>
					</details>

					<!-- Dados Antropométricos -->
					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900">
							<span>Dados Antropométricos</span>
							<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
						</summary>
						<div class="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
							<label class="space-y-1 text-xs text-slate-700">
								<span>Altura (cm)</span>
								<input type="number" bind:value={objective.antropometria.altura} placeholder="170" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Peso (kg)</span>
								<input type="number" step="0.1" bind:value={objective.antropometria.peso} placeholder="70.5" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Circunferência Abdominal (cm)</span>
								<input type="number" step="0.1" bind:value={objective.antropometria.circunferenciaAbdominal} placeholder="85.0" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>IMC (calculado)</span>
								<input type="text" readonly bind:value={objective.antropometria.imc} placeholder="--" class="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 font-semibold text-slate-700 outline-none" />
							</label>
						</div>
					</details>

					<!-- Exame Físico -->
					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900">Exame Físico</summary>
						<div class="space-y-3 px-4 pb-4">
							<!-- Geral -->
							<div class="rounded-2xl border border-slate-200 bg-white p-3">
								<div class="mb-2 flex items-center gap-2">
									<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
									<span class="text-xs font-semibold text-slate-700">Geral (Ectoscopia, estado geral, consciência)</span>
								</div>
								<textarea use:autogrow bind:value={objective.exameFisico.geral} rows="3" placeholder="Descreva o estado geral, consciência, marcha, ectoscopia..." class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</div>

							<!-- Aparelho Digestório -->
							<div class="rounded-2xl border border-slate-200 bg-white p-3">
								<div class="mb-2 flex items-center gap-2">
									<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
									<span class="text-xs font-semibold text-slate-700">Aparelho Digestório</span>
								</div>
								<textarea use:autogrow bind:value={objective.exameFisico.aparelhoDigestorio} rows="3" placeholder="Inspeção, palpação, percussão, ausculta abdominal..." class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</div>

							<!-- Aparelho Cardiovascular -->
							<div class="rounded-2xl border border-slate-200 bg-white p-3">
								<div class="mb-2 flex items-center gap-2">
									<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
									<span class="text-xs font-semibold text-slate-700">Aparelho Cardiovascular</span>
								</div>
								<textarea use:autogrow bind:value={objective.exameFisico.aparelhoCardiovascular} rows="3" placeholder="Inspeção, palpação, ausculta cardíaca e periférica..." class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</div>

							<!-- Sistema Linfático -->
							<div class="rounded-2xl border border-slate-200 bg-white p-3">
								<div class="mb-2 flex items-center gap-2">
									<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
									<span class="text-xs font-semibold text-slate-700">Sistema Linfático</span>
								</div>
								<textarea use:autogrow bind:value={objective.exameFisico.sistemaLinfatico} rows="2" placeholder="Linfonodos palpáveis, características..." class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</div>

							<!-- Neurológico -->
							<div class="rounded-2xl border border-slate-200 bg-white p-3">
								<div class="mb-2 flex items-center gap-2">
									<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
									<span class="text-xs font-semibold text-slate-700">Neurológico</span>
								</div>
								<textarea use:autogrow bind:value={objective.exameFisico.neurologico} rows="3" placeholder="Nível de consciência, pupilas, força muscular, sensibilidade, reflexos..." class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</div>

							<!-- Respiratório Inferior -->
							<div class="rounded-2xl border border-slate-200 bg-white p-3">
								<div class="mb-2 flex items-center gap-2">
									<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
									<span class="text-xs font-semibold text-slate-700">Respiratório Inferior</span>
								</div>
								<textarea use:autogrow bind:value={objective.exameFisico.respiratorioInferior} rows="3" placeholder="Inspeção torácica, expansibilidade, percussão, ausculta pulmonar..." class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</div>

							<!-- Respiratório Superior -->
							<div class="rounded-2xl border border-slate-200 bg-white p-3">
								<div class="mb-2 flex items-center gap-2">
									<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
									<span class="text-xs font-semibold text-slate-700">Respiratório Superior (ORL)</span>
								</div>
								<textarea use:autogrow bind:value={objective.exameFisico.respiratorioSuperior} rows="3" placeholder="Orofaringe, cavidade nasal, ouvido externo e médio..." class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
							</div>

							<!-- Exame Ginecológico (condicional) -->
							{#if subjective.identificacao.sexo === 'Feminino'}
								<div class="rounded-2xl border border-slate-200 bg-white p-3">
									<div class="mb-2 flex items-center gap-2">
										<span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-600">i</span>
										<span class="text-xs font-semibold text-slate-700">Exame Ginecológico</span>
									</div>
									<textarea use:autogrow bind:value={objective.exameFisico.ginecologico} rows="3" placeholder="Inspeção, palpação mamária, exame especular, toque vaginal..." class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
								</div>
							{/if}
						</div>
					</details>

					<!-- Exames Laboratoriais -->
					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900">
							<span>Exames Laboratoriais</span>
							<button
								type="button"
								on:click|stopPropagation={() => openLaboratoryModal()}
								class="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
							>
								+ Adicionar
							</button>
						</summary>
						<div class="px-4 pb-4">
							{#if laboratorioSelecionados.length === 0}
								<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500">
									Nenhum exame laboratorial adicionado.
								</div>
							{:else}
								<div class="space-y-4">
									<!-- Botão excluir selecionados -->
									<div class="flex items-center justify-between">
										<label class="flex items-center gap-2 text-xs text-slate-700">
											<input type="checkbox" checked={laboratorioSelecionadosTodos} on:change={toggleTodosLaboratorio} />
											Selecionar todos
										</label>
										{#if laboratorioSelecionados.some(item => item.selecionado)}
											<button
												type="button"
												on:click={excluirLaboratorioSelecionados}
												class="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
											>
												Excluir Selecionados
											</button>
										{/if}
									</div>

									{#each Object.entries(laboratorioAgrupado) as [pacote, itens]}
										<div class="rounded-2xl border border-slate-200 bg-white p-3">
											<h4 class="mb-2 text-xs font-semibold text-slate-900">{pacote || 'Exames Avulsos'}</h4>
											<div class="overflow-x-auto">
												<table class="w-full text-xs">
													<thead class="bg-slate-100 text-slate-700">
														<tr>
															<th class="px-2 py-1 text-left"><input type="checkbox" checked={itens.every(i => i.selecionado)} on:change={() => toggleGrupoLaboratorio(itens)} /></th>
															<th class="px-2 py-1 text-left">Exame</th>
															<th class="px-2 py-1 text-left">Referência</th>
															<th class="px-2 py-1 text-left">Unidade</th>
															<th class="px-2 py-1 text-left">Resultado</th>
															<th class="px-2 py-1 text-center">Ação</th>
														</tr>
													</thead>
													<tbody>
														{#each itens as item}
															<tr class="border-t border-slate-100">
																<td class="px-2 py-1"><input type="checkbox" bind:checked={item.selecionado} /></td>
																<td class="px-2 py-1">{item.nome}</td>
																<td class="px-2 py-1 text-slate-500">{item.valoresReferencia || '-'}</td>
																<td class="px-2 py-1 text-slate-500">{item.unidade || '-'}</td>
																<td class="px-2 py-1"><input bind:value={item.resultado} placeholder="Resultado..." class="w-full rounded border border-slate-300 px-2 py-1 text-xs" /></td>
																<td class="px-2 py-1 text-center">
																	<button type="button" on:click={() => excluirLaboratorio(item.id)} class="text-slate-400 hover:text-red-600" aria-label="Excluir exame">
																		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
																	</button>
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</details>

					<!-- Exames de Imagem e Funcionais -->
					<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
						<summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900">
							<span>Exames de Imagem e Funcionais</span>
							<button
								type="button"
								on:click|stopPropagation={() => openImagemModal()}
								class="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
							>
								+ Adicionar
							</button>
						</summary>
						<div class="px-4 pb-4">
							{#if imagemSelecionados.length === 0}
								<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500">
									Nenhum exame de imagem ou funcional adicionado.
								</div>
							{:else}
								<div class="grid gap-3 lg:grid-cols-2">
									{#each imagemSelecionados as item}
										<div class="rounded-2xl border border-slate-200 bg-white p-3">
											<div class="mb-2 flex items-center justify-between">
												<h4 class="text-sm font-semibold text-slate-900">{item.nome}</h4>
												<button type="button" on:click={() => excluirImagem(item.id)} class="text-slate-400 hover:text-red-600" aria-label="Excluir exame de imagem">
													<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
												</button>
											</div>
											<div class="space-y-2">
												<label class="block text-xs text-slate-700">
													<span class="mb-1 block">Motivo do exame</span>
													<input bind:value={item.motivo} placeholder="Indicação clínica..." class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs" />
												</label>
												<label class="block text-xs text-slate-700">
													<span class="mb-1 block">Resultado / Impressões Diagnósticas</span>
													<textarea use:autogrow bind:value={item.resultado} rows="2" placeholder="Descreva os achados..." class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"></textarea>
												</label>
												<label class="block text-xs text-slate-700">
													<span class="mb-1 block">Médico executor</span>
													<input bind:value={item.medicoExecutor} placeholder="Nome do médico..." class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs" />
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

			<details open class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<summary class="flex cursor-pointer list-none items-center justify-between bg-slate-700 px-5 py-4 text-white">
					<div>
						<p class="text-xs uppercase tracking-[0.28em] text-slate-300">SOAP</p>
						<h2 class="text-lg font-semibold">A | Avaliação</h2>
					</div>
					<span class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">Síntese diagnóstica</span>
				</summary>
				<div class="grid gap-4 p-4 lg:grid-cols-3">
					<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<h3 class="text-sm font-semibold text-slate-900">Hipóteses diagnósticas</h3>
						<textarea use:autogrow bind:value={assessment.hipoteses} rows="6" placeholder="Hipóteses principais, diferenciais e justificativas." class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
					</section>
					<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<h3 class="text-sm font-semibold text-slate-900">Estratificação de risco</h3>
						<textarea use:autogrow bind:value={assessment.riscos} rows="6" placeholder="Gravidade, sinais de alarme, risco cardiovascular, social ou funcional." class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
					</section>
					<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<h3 class="text-sm font-semibold text-slate-900">Síntese clínica</h3>
						<textarea use:autogrow bind:value={assessment.observacoes} rows="6" placeholder="Resumo final da leitura clínica e prioridades da consulta." class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
					</section>
				</div>
			</details>

			<details open class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<summary class="flex cursor-pointer list-none items-center justify-between bg-slate-600 px-5 py-4 text-white">
					<div>
						<p class="text-xs uppercase tracking-[0.28em] text-slate-200">SOAP</p>
						<h2 class="text-lg font-semibold">P | Plano</h2>
					</div>
					<span class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100">Conduta e seguimento</span>
				</summary>
				<div class="grid gap-4 p-4 lg:grid-cols-[1.25fr_1fr_1fr]">
					<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<h3 class="text-sm font-semibold text-slate-900">Condutas imediatas</h3>
						<textarea use:autogrow bind:value={plan.condutas} rows="7" placeholder="Solicitações, orientações, encaminhamentos e monitorização." class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
					</section>
					<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<h3 class="text-sm font-semibold text-slate-900">Prescrição</h3>
						<div class="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">
							Área pronta para futura integração com os medicamentos selecionados.
						</div>
						<textarea use:autogrow bind:value={plan.prescricao} rows="5" placeholder="Posologia, ajustes e restrições." class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
					</section>
					<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<h3 class="text-sm font-semibold text-slate-900">Seguimento</h3>
						<textarea use:autogrow bind:value={plan.seguimento} rows="7" placeholder="Retorno, metas terapêuticas, red flags e exames pendentes." class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
					</section>
				</div>
			</details>
		</div>
	</div>
</main>

<dialog bind:this={guideDialogRef} class="w-full max-w-2xl rounded-3xl p-0 backdrop:bg-slate-950/30">
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div class="flex items-start justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Editar texto-guia</h2>
				<p class="text-xs text-slate-500">{editingGuideLabel}</p>
			</div>
			<button type="button" on:click={closeGuideEditor} class="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100">Fechar</button>
		</div>
		<textarea bind:value={editingGuideText} rows="8" class="mt-4 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
		<div class="mt-4 flex justify-end gap-2">
			<button type="button" on:click={closeGuideEditor} class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100">Cancelar</button>
			<button type="button" disabled={savingGuide} on:click={saveGuide} class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60">
				{savingGuide ? 'Salvando...' : 'Salvar guia'}
			</button>
		</div>
	</div>
</dialog>

<dialog bind:this={diseaseDialogRef} class="w-full max-w-4xl rounded-3xl p-0 backdrop:bg-slate-950/30">
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div class="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">{editingDiseaseId ? 'Editar doença' : 'Adicionar doença'}</h2>
				<p class="text-xs text-slate-500">Pesquise na base CID-10 ou faça entrada manual com capítulo obrigatório.</p>
			</div>
			<div class="flex gap-2">
				<button type="button" on:click={() => (diseaseMode = 'cid')} class={`rounded-full px-4 py-2 text-xs ${diseaseMode === 'cid' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-100'}`}>Busca CID</button>
				<button type="button" on:click={() => (diseaseMode = 'manual')} class={`rounded-full px-4 py-2 text-xs ${diseaseMode === 'manual' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-100'}`}>Manual</button>
			</div>
		</div>

		<div class="mt-4 grid gap-4 lg:grid-cols-[1.05fr_1fr]">
			<section class="space-y-3">
				{#if diseaseMode === 'cid'}
					<label class="space-y-1 text-xs text-slate-700">
						<span>Pesquisar CID-10</span>
						<input bind:value={diseaseSearch} on:input={scheduleDiseaseSearch} placeholder="Ex: doenças hipertensivas, diabetes mellitus..." class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
					</label>

					{#if diseaseLoading || diseaseSearchResults.length > 0}
						<div class="rounded-2xl border border-slate-200 bg-slate-50 p-2">
							{#if diseaseLoading}
							<p class="px-3 py-10 text-center text-xs text-slate-500">Pesquisando CID-10...</p>
							{:else}
								<div class="max-h-60 space-y-2 overflow-y-auto">
									{#each diseaseSearchResults as item}
										<button type="button" on:click={() => selectDiseaseSuggestion(item)} class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-100">
											<p class="text-sm font-semibold text-slate-900">{item.cat_desc}</p>
											<p class="mt-1 text-xs text-slate-500">{item.subcat_desc} • {item.subcat}</p>
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
							<input bind:value={diseaseForm.subcat} placeholder="Opcional" class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
						</label>
						<label class="space-y-1 text-xs text-slate-700">
							<span>Capítulo</span>
							<select bind:value={diseaseForm.cap} class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
								<option value="">Selecione</option>
								{#each chapterOptions as item}
									<option value={item.cap}>{item.cap} • {item.cap_desc}</option>
								{/each}
							</select>
						</label>
					</div>
				{/if}

				<label class="space-y-1 text-xs text-slate-700">
					<span>Descrição da doença</span>
					<input bind:value={diseaseForm.subcat_desc} class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
				</label>
				<div class="grid gap-3 md:grid-cols-2">
					<label class="space-y-1 text-xs text-slate-700">
						<span>Categoria</span>
						<input bind:value={diseaseForm.cat_desc} placeholder="Opcional" class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
					</label>
					<label class="space-y-1 text-xs text-slate-700">
						<span>Mês/Ano do diagnóstico</span>
						<input bind:value={diseaseForm.mesAnoDiagnostico} placeholder="MM/AAAA" class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
					</label>
				</div>
			</section>

			<section class="space-y-3">
				<label class="space-y-1 text-xs text-slate-700">
					<span>Histórico da doença</span>
					<textarea use:autogrow bind:value={diseaseForm.historico} rows="8" class="min-h-48 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
				</label>
				<label class="space-y-1 text-xs text-slate-700">
					<span>Queixas atuais</span>
					<textarea use:autogrow bind:value={diseaseForm.queixasAtuais} rows="8" class="min-h-48 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
				</label>
				<div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500">
					Capítulo atual: {diseaseForm.cap ? `${diseaseForm.cap} • ${diseaseForm.cap_desc || chapterOptions.find((item) => item.cap === diseaseForm.cap)?.cap_desc || ''}` : 'não informado'}
				</div>
			</section>
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<button type="button" on:click={closeDiseaseModal} class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100">Cancelar</button>
			<button type="button" on:click={saveDisease} class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800">Salvar doença</button>
		</div>
	</div>
</dialog>

<dialog bind:this={medicationDialogRef} class="w-full max-w-4xl rounded-3xl p-0 backdrop:bg-slate-950/30">
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div class="border-b border-slate-200 pb-4">
			<h2 class="text-lg font-semibold text-slate-900">{editingMedicationId ? 'Editar medicamento' : 'Adicionar medicamento'}</h2>
			<p class="text-xs text-slate-500">Busque na base de medicamentos e complemente a posologia da consulta.</p>
		</div>

		<div class="mt-4 grid gap-4 lg:grid-cols-[1.05fr_1fr]">
			<section class="space-y-3">
				<label class="space-y-1 text-xs text-slate-700">
					<span>Pesquisar medicamento</span>
					<input bind:value={medicationSearch} on:input={scheduleMedicationSearch} placeholder="Ex: losartana, sertralina..." class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
				</label>
				<button type="button" on:click={startManualMedication} class="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
					Não encontrei - Adicionar Manualmente
				</button>

				{#if medicationLoading || medicationSearchResults.length > 0}
					<div class="rounded-2xl border border-slate-200 bg-slate-50 p-2">
						{#if medicationLoading}
							<p class="px-3 py-10 text-center text-xs text-slate-500">Pesquisando medicamentos...</p>
						{:else}
							<div class="max-h-60 space-y-2 overflow-y-auto">
								{#each medicationSearchResults as item}
									<button type="button" on:click={() => selectMedicationSuggestion(item)} class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-100">
										<p class="text-sm text-slate-900">
											<span class="font-semibold">{item.principio_ativo}</span>
											{#if item.concentracao}
												<span class="font-semibold"> • {item.concentracao}</span>
											{/if}
										</p>
										<p class="mt-1 text-xs text-slate-500">{item.forma_farmaceutica || 'Forma farmacêutica não informada'}</p>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</section>

			<section class="space-y-3">
				<div class="grid gap-3 md:grid-cols-2">
					<label class="space-y-1 text-xs text-slate-700 md:col-span-2">
						<span>Princípio ativo</span>
						<input readonly={!medicationManualMode && Boolean(medicationForm.sourceId)} bind:value={medicationForm.principio_ativo} class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 read-only:border-slate-200 read-only:bg-slate-100 read-only:text-slate-600" />
					</label>
					<label class="space-y-1 text-xs text-slate-700">
						<span>Concentração</span>
						<input readonly={!medicationManualMode} bind:value={medicationForm.concentracao} class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 read-only:border-slate-200 read-only:bg-slate-100 read-only:text-slate-600" />
					</label>
					<label class="space-y-1 text-xs text-slate-700">
						<span>Forma farmacêutica</span>
						<input readonly={!medicationManualMode} bind:value={medicationForm.forma_farmaceutica} class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 read-only:border-slate-200 read-only:bg-slate-100 read-only:text-slate-600" />
					</label>
					<label class="space-y-1 text-xs text-slate-700 md:col-span-2">
						<span>Classe farmacêutica</span>
						<input bind:value={medicationForm.classe} class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
					</label>
				</div>

				<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
					<h3 class="text-sm font-semibold text-slate-900">Dose e Frequência</h3>
					<div class="mt-3 flex flex-wrap gap-2 text-xs">
						<label class="rounded-full border border-slate-300 bg-white px-3 py-1.5"><input class="mr-1" type="radio" bind:group={medicationForm.frequenciaTipo} value="diario" />Diário</label>
						<label class="rounded-full border border-slate-300 bg-white px-3 py-1.5"><input class="mr-1" type="radio" bind:group={medicationForm.frequenciaTipo} value="semanal" />Semanal</label>
						<label class="rounded-full border border-slate-300 bg-white px-3 py-1.5"><input class="mr-1" type="radio" bind:group={medicationForm.frequenciaTipo} value="intervalo" />Intervalo</label>
						<label class="rounded-full border border-slate-300 bg-white px-3 py-1.5"><input class="mr-1" type="radio" bind:group={medicationForm.frequenciaTipo} value="especial" />Especial</label>
					</div>

					{#if medicationForm.frequenciaTipo === 'diario'}
						<div class="mt-3 grid gap-2 sm:grid-cols-3">
							<label class="space-y-1 text-xs text-slate-700">
								<span>Manhã</span>
								<input type="text" bind:value={medicationForm.diario.manha} placeholder="1 cp" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Tarde</span>
								<input type="text" bind:value={medicationForm.diario.tarde} placeholder="1/2 cp" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
							<label class="space-y-1 text-xs text-slate-700">
								<span>Noite</span>
								<input type="text" bind:value={medicationForm.diario.noite} placeholder="5 mL" class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
							</label>
						</div>
					{:else if medicationForm.frequenciaTipo === 'semanal'}
						<select bind:value={medicationForm.semanal} class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
							<option>1x por semana</option>
							<option>2x por semana</option>
							<option>3x por semana</option>
							<option>Segunda a sexta</option>
							<option>Fim de semana</option>
						</select>
						<label class="mt-3 block space-y-1 text-xs text-slate-700">
							<span>Qual a dose?</span>
							<input bind:value={medicationForm.doseQual} placeholder="Ex: 1 comprimido, 20 UI, 5 mL" class="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
						</label>
					{:else if medicationForm.frequenciaTipo === 'intervalo'}
						<select bind:value={medicationForm.intervalo} class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
							<option>12h</option>
							<option>8h</option>
							<option>6h</option>
							<option>4h</option>
						</select>
						<label class="mt-3 block space-y-1 text-xs text-slate-700">
							<span>Qual a dose?</span>
							<input bind:value={medicationForm.doseQual} placeholder="Ex: 1 comprimido, 20 UI, 5 mL" class="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
						</label>
					{:else}
						<input bind:value={medicationForm.especial} placeholder="Ex: usar se dor, antes de dormir, em jejum..." class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
					{/if}
				</section>

				<label class="space-y-1 text-xs text-slate-700">
					<span>Observações</span>
					<textarea use:autogrow bind:value={medicationForm.observacoes} rows="3" class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
				</label>
			</section>
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<button type="button" on:click={closeMedicationModal} class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100">Cancelar</button>
			<button type="button" on:click={saveMedication} class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800">Salvar medicamento</button>
		</div>
	</div>
</dialog>

<!-- Modal Exames Laboratoriais -->
<dialog bind:this={labDialogRef} class="w-full max-w-4xl rounded-3xl p-0 backdrop:bg-slate-950/30">
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div class="border-b border-slate-200 pb-4">
			<h2 class="text-lg font-semibold text-slate-900">Adicionar Exame Laboratorial</h2>
			<p class="text-xs text-slate-500">Busque por pacote ou adicione um exame manualmente.</p>
		</div>

		<div class="mt-4 space-y-3">
			<div class="flex gap-2">
				<button type="button" on:click={() => (labModo = 'pacote')} class={`rounded-full px-4 py-2 text-xs ${labModo === 'pacote' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-100'}`}>Por Pacote</button>
				<button type="button" on:click={() => (labModo = 'manual')} class={`rounded-full px-4 py-2 text-xs ${labModo === 'manual' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-100'}`}>Manual</button>
			</div>

			{#if labModo === 'pacote'}
				<div class="grid gap-3 lg:grid-cols-2">
					<label class="space-y-1 text-xs text-slate-700">
						<span>Buscar exame</span>
						<input bind:value={labSearch} on:input={scheduleLabSearch} placeholder="Ex: hemograma, glicose..." class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
					</label>
					<label class="space-y-1 text-xs text-slate-700">
						<span>Ou selecione um pacote</span>
						<select bind:value={labPacoteSelecionado} on:change={buscarExamesLaboratoriais} class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
							<option value="">Todos os exames</option>
							<option value="Check-up">Check-up</option>
							<option value="Cardiológico">Cardiológico</option>
							<option value="Renal">Renal</option>
							<option value="Hepático">Hepático</option>
							<option value="Ginecológico">Ginecológico</option>
							<option value="Pré-operatório">Pré-operatório</option>
						</select>
					</label>
				</div>

				{#if labLoading || labSearchResults.length > 0}
					<div class="rounded-2xl border border-slate-200 bg-slate-50 p-2">
						{#if labLoading}
							<p class="px-3 py-10 text-center text-xs text-slate-500">Buscando exames...</p>
						{:else}
							<div class="max-h-60 space-y-2 overflow-y-auto">
								{#each labSearchResults as exame}
									<button type="button" on:click={() => adicionarExameLaboratorial(exame)} class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-100">
										<p class="text-sm font-semibold text-slate-900">{exame.nome}</p>
										<p class="mt-1 text-xs text-slate-500">{exame.pacote || 'Exame Avulso'} {exame.valores_referencia ? `• Ref: ${exame.valores_referencia}` : ''}</p>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{:else}
				<div class="grid gap-3">
					<label class="space-y-1 text-xs text-slate-700">
						<span>Nome do exame</span>
						<input bind:value={labExameManual.nome} placeholder="Ex: Glicose em jejum" class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
					</label>
					<div class="grid gap-3 sm:grid-cols-2">
						<label class="space-y-1 text-xs text-slate-700">
							<span>Valores de Referência</span>
							<input bind:value={labExameManual.valoresReferencia} placeholder="Ex: 70-100 mg/dL" class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
						</label>
						<label class="space-y-1 text-xs text-slate-700">
							<span>Unidade</span>
							<input bind:value={labExameManual.unidade} placeholder="Ex: mg/dL" class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
						</label>
					</div>
					<button type="button" on:click={adicionarExameLaboratorialManual} class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800">Adicionar Exame</button>
				</div>
			{/if}
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<button type="button" on:click={closeLaboratoryModal} class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100">Fechar</button>
		</div>
	</div>
</dialog>

<!-- Modal Exames de Imagem -->
<dialog bind:this={imagemDialogRef} class="w-full max-w-4xl rounded-3xl p-0 backdrop:bg-slate-950/30">
	<div class="rounded-3xl border border-slate-200 bg-white p-5">
		<div class="border-b border-slate-200 pb-4">
			<h2 class="text-lg font-semibold text-slate-900">Adicionar Exame de Imagem/Funcional</h2>
			<p class="text-xs text-slate-500">Busque na base de procedimentos ou adicione manualmente.</p>
		</div>

		<div class="mt-4 space-y-3">
			<label class="space-y-1 text-xs text-slate-700">
				<span>Buscar procedimento</span>
				<input bind:value={imagemSearch} on:input={scheduleImagemSearch} placeholder="Ex: radiografia, tomografia..." class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
			</label>

			{#if imagemLoading || imagemSearchResults.length > 0}
				<div class="rounded-2xl border border-slate-200 bg-slate-50 p-2">
					{#if imagemLoading}
						<p class="px-3 py-10 text-center text-xs text-slate-500">Buscando procedimentos...</p>
					{:else}
						<div class="max-h-60 space-y-2 overflow-y-auto">
							{#each imagemSearchResults as proc}
								<button type="button" on:click={() => adicionarExameImagem(proc)} class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-100">
									<p class="text-sm font-semibold text-slate-900">{proc.descricao}</p>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<div class="border-t border-slate-200 pt-3">
				<p class="mb-2 text-xs font-semibold text-slate-700">Ou adicione manualmente:</p>
				<div class="flex gap-2">
					<input bind:value={imagemExameManual} placeholder="Nome do exame" class="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
					<button type="button" on:click={adicionarExameImagemManual} class="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800">Adicionar</button>
				</div>
			</div>
		</div>

		<div class="mt-5 flex justify-end gap-2">
			<button type="button" on:click={closeImagemModal} class="rounded-full border border-slate-300 px-4 py-2 text-xs text-slate-600 hover:bg-slate-100">Fechar</button>
		</div>
	</div>
</dialog>
