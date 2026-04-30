<script>
	import { onDestroy, onMount } from 'svelte';

	/** @typedef {{ id: number; subcat: string; subcat_desc: string; grupo: string; cat: string; cat_desc: string; cap: string; cap_desc: string; }} CidItem */

	let loading = false;
	let erro = '';
	let termo = '';
	let page = 1;
	let limit = 10;
	let totalPages = 1;
	let total = 0;
	/** @type {CidItem[]} */
	let itens = [];
	let uploadMsg = '';
	let uploading = false;
	let aviso = '';
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let debounceTimer;

	async function carregarCid() {
		loading = true;
		erro = '';
		try {
			aviso = '';
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				q: termo
			});
			const response = await fetch(`/api/cid10?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Falha ao carregar CID-10.');
			}
			itens = data.items ?? [];
			totalPages = data.totalPages ?? 1;
			total = data.total ?? 0;
			aviso = data.warning ?? '';
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado.';
		} finally {
			loading = false;
		}
	}

	function filtrarAoDigitar() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			page = 1;
			carregarCid();
		}, 250);
	}

	/**
	 * @param {Event & { currentTarget: HTMLInputElement }} event
	 */
	async function uploadCsv(event) {
		uploadMsg = '';
		const file = event.currentTarget.files?.[0];
		if (!file) return;

		uploading = true;
		try {
			const formData = new FormData();
			formData.append('file', file);
			const response = await fetch('/api/upload-cid', {
				method: 'POST',
				body: formData
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Falha ao fazer upload do CSV.');
			}
			uploadMsg = `Importação concluída: ${data.totalLinhas} linhas processadas.`;
			page = 1;
			await carregarCid();
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado.';
		} finally {
			uploading = false;
			event.currentTarget.value = '';
		}
	}

	onMount(carregarCid);
	onDestroy(() => clearTimeout(debounceTimer));
</script>

<svelte:head>
	<title>Gestão CID-10</title>
</svelte:head>

<main class="min-h-screen bg-slate-50 py-4">
	<div class="mx-auto max-w-6xl px-3 sm:px-4">
		<header class="mb-3">
			<h1 class="text-xl font-semibold text-slate-900">CID-10</h1>
			<p class="text-xs text-slate-600">Consulta, busca e importação do catálogo de doenças.</p>
		</header>

		<div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex w-full max-w-xl gap-2">
				<input
					bind:value={termo}
					on:input={filtrarAoDigitar}
					placeholder="Buscar por categoria CID-10"
					class="w-full rounded-md border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				/>
			</div>

			<label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
				<input type="file" accept=".csv,text/csv" class="hidden" on:change={uploadCsv} />
				{uploading ? 'Importando...' : 'Upload do cid10.csv'}
			</label>
		</div>

		{#if erro}
			<p class="mb-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{erro}</p>
		{/if}
		{#if aviso}
			<p class="mb-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">{aviso}</p>
		{/if}
		{#if uploadMsg}
			<p class="mb-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">{uploadMsg}</p>
		{/if}

		<section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
			<div class="overflow-x-auto">
				<table class="min-w-full text-left text-xs">
					<thead class="bg-slate-100 text-slate-700">
						<tr>
							<th class="px-3 py-2">Código</th>
							<th class="px-3 py-2">Doença</th>
							<th class="px-3 py-2">Categoria</th>
							<th class="px-3 py-2">Grupo</th>
							<th class="px-3 py-2">Capítulo</th>
						</tr>
					</thead>
					<tbody>
						{#if loading}
							<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">Carregando...</td></tr>
						{:else if itens.length === 0}
							<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">Nenhuma doença encontrada.</td></tr>
						{:else}
							{#each itens as item}
								<tr class="border-t border-slate-100">
									<td class="px-3 py-2 font-medium text-slate-800">{item.subcat}</td>
									<td class="px-3 py-2">{item.subcat_desc}</td>
									<td class="px-3 py-2">{item.cat_desc}</td>
									<td class="px-3 py-2">{item.grupo || '-'}</td>
									<td class="px-3 py-2">{item.cap_desc}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</section>

		<div class="mt-2 flex items-center justify-between text-xs text-slate-600">
			<p>Total: {total}</p>
			<div class="flex items-center gap-2">
				<button
					disabled={page <= 1 || loading}
					on:click={() => {
						page -= 1;
						carregarCid();
					}}
					class="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50"
				>
					Anterior
				</button>
				<span>Página {page} de {totalPages}</span>
				<button
					disabled={page >= totalPages || loading}
					on:click={() => {
						page += 1;
						carregarCid();
					}}
					class="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50"
				>
					Próxima
				</button>
			</div>
		</div>
	</div>
</main>
