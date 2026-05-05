import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const CONSULTA_DRAFT_STORAGE_KEY = 'consulta-medica-draft-v1';

// Chaves para persistência independente
export const DISEASES_STORAGE_KEY = 'consulta-doencas-v1';
export const MEDICATIONS_STORAGE_KEY = 'consulta-medicamentos-v1';
export const LABORATORIO_STORAGE_KEY = 'consulta-laboratorio-v1';
export const IMAGEM_STORAGE_KEY = 'consulta-imagem-v1';

export function createEmptyConsultaDraft() {
	return {
		version: 1,
		subjective: null,
		objective: null,
		assessment: null,
		plan: null,
		familyHistory: null,
		diseases: [],
		medications: []
	};
}

function readStoredDraft() {
	if (!browser) return createEmptyConsultaDraft();

	try {
		const raw = localStorage.getItem(CONSULTA_DRAFT_STORAGE_KEY);
		return raw ? { ...createEmptyConsultaDraft(), ...JSON.parse(raw) } : createEmptyConsultaDraft();
	} catch {
		return createEmptyConsultaDraft();
	}
}

export const consultaDraft = writable(readStoredDraft());

let skipNextPersist = false;

if (browser) {
	consultaDraft.subscribe((draft) => {
		if (skipNextPersist) {
			skipNextPersist = false;
			localStorage.removeItem(CONSULTA_DRAFT_STORAGE_KEY);
			return;
		}
		localStorage.setItem(CONSULTA_DRAFT_STORAGE_KEY, JSON.stringify(draft));
	});
}

/**
 * Limpa completamente todos os dados da consulta, incluindo localStorage
 */
export function clearConsultaDraft() {
	if (browser) {
		skipNextPersist = true;
		// Remove chave principal
		localStorage.removeItem(CONSULTA_DRAFT_STORAGE_KEY);
		// Remove chaves de persistência independente
		localStorage.removeItem(DISEASES_STORAGE_KEY);
		localStorage.removeItem(MEDICATIONS_STORAGE_KEY);
		localStorage.removeItem(LABORATORIO_STORAGE_KEY);
		localStorage.removeItem(IMAGEM_STORAGE_KEY);
	}
	consultaDraft.set(createEmptyConsultaDraft());
}
