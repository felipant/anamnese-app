import { browser } from '$app/environment';
import { writable } from 'svelte/store';

/**
 * Cria uma store Svelte com persistência no localStorage.
 * Garante reatividade por propagação (spreading) para arrays e objetos.
 * 
 * @param {string} key - Chave do localStorage
 * @param {any} defaultValue - Valor padrão
 * @returns {import('svelte/store').Writable<any> & { reset: () => void }}
 */
export function useLocalStorage(key, defaultValue) {
	const STORAGE_KEY = `anamnese-${key}`;

	function readStored() {
		if (!browser) return defaultValue;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return defaultValue;
			// Parse e retorna - o spread operator na atribuição garante reatividade
			return JSON.parse(raw);
		} catch {
			return defaultValue;
		}
	}

	const store = writable(readStored());

	if (browser) {
		store.subscribe((value) => {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			} catch {
				// Ignora erros de storage (ex: modo privado, quota excedida)
			}
		});
	}

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		/** Reseta para o valor padrão */
		reset() {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			store.set(defaultValue);
		}
	};
}

/**
 * Hook para garantir reatividade por propagação em arrays.
 * Sempre use esta função ao modificar arrays de doenças ou medicamentos.
 * 
 * Exemplo:
 *   doencas = ensureReactivity(doencas, (arr) => [...arr, novaDoenca]);
 *   medicamentos = ensureReactivity(medicamentos, (arr) => arr.filter(m => m.id !== id));
 * 
 * @param {any[]} array
 * @param {(arr: any[]) => any[]} mutator
 * @returns {any[]}
 */
export function ensureReactivity(array, mutator) {
	const result = mutator(array);
	// Força nova referência (spread) para garantir reatividade do Svelte
	return Array.isArray(result) ? [...result] : result;
}

/**
 * Salva dados explicitamente no localStorage (uso fora de stores).
 * @param {string} key
 * @param {any} value
 */
export function saveToLocalStorage(key, value) {
	if (!browser) return;
	try {
		localStorage.setItem(`anamnese-${key}`, JSON.stringify(value));
	} catch {
		// Ignora erros
	}
}

/**
 * Carrega dados do localStorage (uso fora de stores).
 * @param {string} key
 * @param {any} defaultValue
 * @returns {any}
 */
export function loadFromLocalStorage(key, defaultValue) {
	if (!browser) return defaultValue;
	try {
		const raw = localStorage.getItem(`anamnese-${key}`);
		return raw ? JSON.parse(raw) : defaultValue;
	} catch {
		return defaultValue;
	}
}
