<script>
	import { onDestroy, onMount } from 'svelte';

	/** @typedef {{ id: number | null; descricao: string; valor: number | null; }} Procedimento */

	/** @type {Procedimento[]} */
	let itens = [];
	let loading = false;
	let erro = '';
	let aviso = '';
	let uploadMsg = '';
	let termoPesquisa = '';
	let uploading = false;
	let page = 1;
	let limit = 50;
	let totalPages = 1;
	let total = 0;
	let modo = 'novo';
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let debounceTimer;
	/** @type {HTMLDialogElement | null} */
	let dialogRef;

	/** @type {Procedimento} */
	const emptyForm = {
		id: null,
		descricao: '',
		valor: null
	};

	/** @type {Procedimento} */
	let form = { ...emptyForm };

	async function carregar() {
		loading = true;
		erro = '';
		aviso = '';
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit)
			});
			if (termoPesquisa.trim()) params.set('q', termoPesquisa.trim());
			const response = await fetch(`/api/procedimentos?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Falha ao carregar procedimentos.');
			itens = data.items ?? [];
			total = data.total ?? 0;
			totalPages = data.totalPages ?? 1;
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
			carregar();
		}, 250);
	}

	function abrirNovo() {
		modo = 'novo';
		form = { ...emptyForm };
		dialogRef?.showModal();
	}

	/**
	 * @param {Procedimento} item
	 */
	function abrirEdicao(item) {
		modo = 'editar';
		form = { ...item };
		dialogRef?.showModal();
	}

	function fechar() {
		dialogRef?.close();
	}

	async function salvar() {
		erro = '';
		try {
			const response = await fetch('/api/procedimentos', {
				method: modo === 'novo' ? 'POST' : 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Falha ao salvar procedimento.');
			fechar();
			await carregar();
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado.';
		}
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
			const response = await fetch('/api/upload-procedimentos', { method: 'POST', body: formData });
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Falha ao importar CSV.');
			uploadMsg = `Importação concluída: ${data.inseridos} procedimentos inseridos (${data.totalLinhas} linhas).`;
			page = 1;
			await carregar();
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado.';
		} finally {
			uploading = false;
			event.currentTarget.value = '';
		}
	}

	onMount(carregar);
	onDestroy(() => clearTimeout(debounceTimer));
</script>

<svelte:head>
	<title>Gestão de Procedimentos</title>
</svelte:head>

<main class="min-h-screen bg-slate-50 py-4">
	<div class="mx-auto max-w-6xl px-3 sm:px-4">
		<header class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-xl font-semibold text-slate-900">Procedimentos e Exames</h1>
				<p class="text-xs text-slate-600">Cadastro manual, edição e importação por CSV de procedimentos.</p>
			</div>
			<div class="flex items-center gap-2">
				<button
					on:click={abrirNovo}
					class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
				>
					Novo Procedimento
				</button>
				<label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-100">
					<input type="file" accept=".csv,text/csv" class="hidden" on:change={uploadCsv} />
					{uploading ? 'Importando...' : 'Upload procedimentos.csv'}
				</label>
			</div>
		</header>

		<div class="mb-2 flex items-center gap-2">
			<input
				bind:value={termoPesquisa}
				on:input={filtrarAoDigitar}
				placeholder="Filtrar por descrição enquanto digita"
				class="w-full max-w-lg rounded-md border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
			/>
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
							<th class="px-3 py-2">Descrição</th>
							<th class="px-3 py-2">Valor</th>
						</tr>
					</thead>
					<tbody>
						{#if loading}
							<tr><td colspan="2" class="px-3 py-6 text-center text-slate-500">Carregando...</td></tr>
						{:else if itens.length === 0}
							<tr><td colspan="2" class="px-3 py-6 text-center text-slate-500">Sem procedimentos cadastrados.</td></tr>
						{:else}
							{#each itens as item}
								<tr class="cursor-pointer border-t border-slate-100 hover:bg-blue-50/40" on:click={() => abrirEdicao(item)}>
									<td class="px-3 py-2">{item.descricao}</td>
									<td class="px-3 py-2">{item.valor ?? '-'}</td>
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
						carregar();
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
						carregar();
					}}
					class="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50"
				>
					Próxima
				</button>
			</div>
		</div>
	</div>
</main>

<dialog bind:this={dialogRef} class="w-full max-w-lg rounded-lg p-0 backdrop:bg-black/20">
	<div class="rounded-lg border border-slate-200 bg-white p-4">
		<h2 class="text-sm font-semibold text-slate-900">
			{modo === 'novo' ? 'Novo procedimento' : 'Editar procedimento'}
		</h2>
		<div class="mt-3 space-y-2 text-xs">
			<label class="block">
				<span class="mb-1 block text-slate-700">Descrição</span>
				<input
					bind:value={form.descricao}
					class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				/>
			</label>
			<label class="block">
				<span class="mb-1 block text-slate-700">Valor</span>
				<input
					type="number"
					step="0.01"
					bind:value={form.valor}
					class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				/>
			</label>
		</div>
		<div class="mt-4 flex justify-end gap-2">
			<button on:click={fechar} class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100">Cancelar</button>
			<button on:click={salvar} class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Salvar</button>
		</div>
	</div>
</dialog>
