import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const CONSULTA_DRAFT_STORAGE_KEY = 'consulta-medica-draft-v1';

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

export function clearConsultaDraft() {
	if (browser) {
		skipNextPersist = true;
		localStorage.removeItem(CONSULTA_DRAFT_STORAGE_KEY);
	}
	consultaDraft.set(createEmptyConsultaDraft());
}
