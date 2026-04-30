<script>
	import { onDestroy, onMount } from 'svelte';
	import { consultaDraft } from '$lib/consultaStore';

	/** @typedef {{ id: number; subcat: string; subcat_desc: string; grupo: string; cat: string; cat_desc: string; cap: string; cap_desc: string; }} CidSearchItem */
	/** @typedef {{ sourceId: number | null; principio_ativo: string; concentracao: string; classe: string; dose: string; forma_farmaceutica: string; fornecimento_sus: string; observacoes: string; frequenciaTipo: string; diario: { manha: string; tarde: string; noite: string; }; semanal: string; intervalo: string; especial: string; }} MedicationForm */
	/** @typedef {{ subcat: string; subcat_desc: string; cat: string; cat_desc: string; cap: string; cap_desc: string; mesAnoDiagnostico: string; historico: string; queixasAtuais: string; }} DiseaseForm */
	/** @typedef {{ id: string; mode: string; subcat: string; subcat_desc: string; cat: string; cat_desc: string; cap: string; cap_desc: string; mesAnoDiagnostico: string; historico: string; queixasAtuais: string; }} DiseaseItem */
	/** @typedef {{ id: number; principio_ativo: string; concentracao: string; forma_farmaceutica: string; unidade_fornecimento: string; fornecimento_sus: string; classe: string; }} MedicationSearchItem */
	/** @typedef {{ id: string; sourceId: number | null; principio_ativo: string; concentracao: string; classe: string; dose: string; forma_farmaceutica: string; fornecimento_sus: string; observacoes: string; frequenciaTipo: string; diario: { manha: string; tarde: string; noite: string; }; semanal: string; intervalo: string; especial: string; }} ConsultationMedication */
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

	let objective = {
		sinaisVitais: '',
		exameFisico: '',
		examesComplementares: ''
	};

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

	$: diseaseGroups = groupBy(diseases, (item) => item.cap_desc || 'Sem capítulo definido');
	$: medicationGroups = groupBy(medications, (item) => item.classe || 'Classe não informada');
	$: if (draftHydrated) {
		consultaDraft.set(buildDraftSnapshot());
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
			dose: '',
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
			especial: ''
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
			diseases = diseases.map((item) => (item.id === editingDiseaseId ? finalDisease : item));
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
		diseases = diseases.filter((item) => item.id !== id);
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
					dose: item.dose ?? '',
					forma_farmaceutica: item.forma_farmaceutica ?? '',
					fornecimento_sus: item.fornecimento_sus ?? '',
					observacoes: item.observacoes ?? '',
					frequenciaTipo: item.frequenciaTipo ?? 'diario',
					diario: normalizeDailyFrequency(item.diario),
					semanal: item.semanal ?? 'Segunda a sexta',
					intervalo: item.intervalo ?? '12h',
					especial: item.especial ?? ''
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
			dose: medicationForm.dose.trim(),
			forma_farmaceutica: medicationForm.forma_farmaceutica.trim(),
			fornecimento_sus: medicationForm.fornecimento_sus.trim(),
			observacoes: medicationForm.observacoes.trim(),
			frequenciaTipo: medicationForm.frequenciaTipo,
			diario: normalizeDailyFrequency(medicationForm.diario),
			semanal: medicationForm.semanal,
			intervalo: medicationForm.intervalo,
			especial: medicationForm.especial.trim()
		};

		if (!finalMedication.principio_ativo || !finalMedication.dose) {
			erro = 'Preencha o princípio ativo e a dose.';
			return;
		}

		if (editingMedicationId) {
			medications = medications.map((item) => (item.id === editingMedicationId ? finalMedication : item));
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
		medications = medications.filter((item) => item.id !== id);
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
		if (item.frequenciaTipo === 'semanal') return `Semanal: ${item.semanal}`;
		if (item.frequenciaTipo === 'intervalo') return `Intervalo: a cada ${item.intervalo}`;
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
			objective,
			assessment,
			plan,
			familyHistory,
			diseases,
			medications
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
		if (draft.objective) objective = { ...objective, ...draft.objective };
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
				diario: normalizeDailyFrequency(item.diario)
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

	onMount(() => {
		let loaded = false;
		const unsubscribe = consultaDraft.subscribe((draft) => {
			if (!loaded) {
				applyDraftSnapshot(draft);
				loaded = true;
				draftHydrated = true;
			}
		});
		carregarGuias();
		return unsubscribe;
	});
	onDestroy(() => {
		clearTimeout(diseaseSearchTimer);
		clearTimeout(medicationSearchTimer);
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
					<span class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">História clínica</span>
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
																<p class="text-xs text-slate-700">{item.dose} - {describeFrequency(item)}</p>
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
					<span class="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">Exame físico e métricas</span>
				</summary>
				<div class="grid gap-4 p-4 lg:grid-cols-[1.25fr_1fr]">
					<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<h3 class="text-sm font-semibold text-slate-900">Sinais vitais e exame físico</h3>
						<p class="mt-1 text-xs text-slate-500">Template visual preparado para campos estruturados e narrativa do exame objetivo.</p>
						<div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">PA</div>
							<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">FC</div>
							<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">FR</div>
							<div class="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">Temperatura</div>
						</div>
						<textarea use:autogrow bind:value={objective.exameFisico} rows="5" placeholder="Campo livre para ectoscopia, exame segmentar e achados relevantes." class="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
					</section>
					<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<h3 class="text-sm font-semibold text-slate-900">Exames complementares</h3>
						<p class="mt-1 text-xs text-slate-500">Espaço pronto para futura tabela de exames laboratoriais e imagem.</p>
						<div class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">
							Futuro slot para vincular exames cadastrados em [Exames Laboratoriais].
						</div>
						<textarea use:autogrow bind:value={objective.examesComplementares} rows="5" placeholder="Resumo de laudos, tendência temporal e correlação com a clínica." class="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"></textarea>
					</section>
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
					<label class="space-y-1 text-xs text-slate-700">
						<span>Dose física</span>
						<input bind:value={medicationForm.dose} placeholder="1 comprimido, 20 UI, 5 mL" class="w-full rounded-2xl border border-slate-500 bg-white px-3 py-2 font-semibold text-slate-900 outline-none ring-2 ring-slate-200 focus:border-slate-700 focus:ring-slate-300" />
					</label>
					<label class="space-y-1 text-xs text-slate-700 md:col-span-2">
						<span>Classe farmacêutica</span>
						<input bind:value={medicationForm.classe} class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
					</label>
				</div>

				<section class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
					<h3 class="text-sm font-semibold text-slate-900">Frequência</h3>
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
					{:else if medicationForm.frequenciaTipo === 'intervalo'}
						<select bind:value={medicationForm.intervalo} class="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
							<option>12h</option>
							<option>8h</option>
							<option>6h</option>
							<option>4h</option>
						</select>
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
