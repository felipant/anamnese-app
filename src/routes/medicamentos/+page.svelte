<script>
	import { onDestroy, onMount } from 'svelte';

	/** @typedef {{ id: number | null; principio_ativo: string; concentracao: string; forma_farmaceutica: string; unidade_fornecimento: string; fornecimento_sus: string; classe: string; }} Medicamento */

	/** @type {Medicamento[]} */
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

	/** @type {Medicamento} */
	const emptyForm = {
		id: null,
		principio_ativo: '',
		concentracao: '',
		forma_farmaceutica: '',
		unidade_fornecimento: '',
		fornecimento_sus: '',
		classe: ''
	};

	/** @type {Medicamento} */
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
			const response = await fetch(`/api/medicamentos?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Falha ao carregar medicamentos.');
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

	/**
	 * @param {string} principioAtivo
	 */
	function pesquisarClinicamente(principioAtivo) {
		const query = `medicamento de referência, classe, mecanismo de ação, indicações, contra-indicações, efeitos adversos e metabolismo do medicamento ${principioAtivo}`;
		window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
	}

	function abrirNovo() {
		modo = 'novo';
		form = { ...emptyForm };
		dialogRef?.showModal();
	}

	/**
	 * @param {Medicamento} item
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
			const response = await fetch('/api/medicamentos', {
				method: modo === 'novo' ? 'POST' : 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Falha ao salvar medicamento.');
			fechar();
			await carregar();
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado.';
		}
	}

	/**
	 * @param {number | null} id
	 */
	async function excluir(id) {
		if (!id) return;
		if (!window.confirm('Excluir este medicamento? Esta ação não pode ser desfeita.')) {
			return;
		}

		erro = '';
		try {
			const response = await fetch(`/api/medicamentos?id=${id}`, { method: 'DELETE' });
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Falha ao excluir medicamento.');
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
			const response = await fetch('/api/upload-meds', { method: 'POST', body: formData });
			const data = await response.json();
			if (!response.ok) throw new Error(data?.error || 'Falha ao importar CSV.');
			uploadMsg = `Importação concluída: ${data.inseridos} itens inseridos (${data.totalLinhas} linhas).`;
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
	<title>Gestão de Medicamentos</title>
</svelte:head>

<main class="min-h-screen bg-slate-50 py-4">
	<div class="mx-auto max-w-6xl px-3 sm:px-4">
		<header class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-xl font-semibold text-slate-900">Medicamentos</h1>
				<p class="text-xs text-slate-600">Cadastro manual, edição e importação em lote do meds_tabelado_com_classe.csv.</p>
			</div>
			<div class="flex items-center gap-2">
				<button
					on:click={abrirNovo}
					class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
				>
					Adicionar Manual
				</button>
				<label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-100">
					<input type="file" accept=".csv,text/csv" class="hidden" on:change={uploadCsv} />
					{uploading ? 'Importando...' : 'Upload meds_tabelado_com_classe.csv'}
				</label>
			</div>
		</header>

		<div class="mb-2 flex items-center gap-2">
			<input
				bind:value={termoPesquisa}
				on:input={filtrarAoDigitar}
				placeholder="Filtrar por princípio ativo ou classe enquanto digita"
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
							<th class="px-3 py-2">Princípio Ativo</th>
							<th class="px-3 py-2">Classe</th>
							<th class="px-3 py-2">Concentração</th>
							<th class="px-3 py-2">Forma farmacêutica</th>
							<th class="px-3 py-2">Unidade de Fornecimento</th>
							<th class="px-3 py-2">Fornecimento SUS</th>
							<th class="px-3 py-2">Pesquisa</th>
							<th class="px-3 py-2 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{#if loading}
							<tr><td colspan="8" class="px-3 py-6 text-center text-slate-500">Carregando...</td></tr>
						{:else if itens.length === 0}
							<tr><td colspan="8" class="px-3 py-6 text-center text-slate-500">Sem medicamentos cadastrados.</td></tr>
						{:else}
							{#each itens as item}
								<tr class="cursor-pointer border-t border-slate-100 hover:bg-blue-50/40" on:click={() => abrirEdicao(item)}>
									<td class="px-3 py-2">{item.principio_ativo}</td>
									<td class="px-3 py-2">{item.classe || '-'}</td>
									<td class="px-3 py-2">{item.concentracao}</td>
									<td class="px-3 py-2">{item.forma_farmaceutica}</td>
									<td class="px-3 py-2">{item.unidade_fornecimento}</td>
									<td class="px-3 py-2">{item.fornecimento_sus}</td>
									<td class="px-3 py-2">
										<button
											on:click|stopPropagation={() => pesquisarClinicamente(item.principio_ativo)}
											class="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
											title="Pesquisar informações clínicas"
											aria-label="Pesquisar informações clínicas do medicamento"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.8"
												stroke="currentColor"
												class="h-4 w-4"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
												/>
											</svg>
										</button>
									</td>
									<td class="px-3 py-2 text-right">
										<button
											on:click|stopPropagation={() => excluir(item.id)}
											class="rounded-md p-1 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
											title="Excluir medicamento"
											aria-label="Excluir medicamento"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
												class="h-4 w-4"
											>
												<path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M8 6V4.75A1.75 1.75 0 0 1 9.75 3h4.5A1.75 1.75 0 0 1 16 4.75V6" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6 7.5 19.25A1.75 1.75 0 0 0 9.25 21h5.5a1.75 1.75 0 0 0 1.75-1.75L17.25 6" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M10 10.5v6" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M14 10.5v6" />
											</svg>
										</button>
									</td>
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
			{modo === 'novo' ? 'Adicionar medicamento manualmente' : 'Editar medicamento'}
		</h2>
		<div class="mt-3 space-y-2 text-xs">
			<label class="block">
				<span class="mb-1 block text-slate-700">Princípio Ativo</span>
				<input bind:value={form.principio_ativo} class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
			</label>
			<label class="block">
				<span class="mb-1 block text-slate-700">Concentração</span>
				<input bind:value={form.concentracao} class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
			</label>
			<label class="block">
				<span class="mb-1 block text-slate-700">Forma farmacêutica</span>
				<input bind:value={form.forma_farmaceutica} class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
			</label>
			<label class="block">
				<span class="mb-1 block text-slate-700">Unidade de Fornecimento</span>
				<input bind:value={form.unidade_fornecimento} class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
			</label>
			<label class="block">
				<span class="mb-1 block text-slate-700">Fornecimento SUS</span>
				<input bind:value={form.fornecimento_sus} class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
			</label>
			<label class="block">
				<span class="mb-1 block text-slate-700">Classe</span>
				<input bind:value={form.classe} class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
			</label>
		</div>
		<div class="mt-4 flex justify-end gap-2">
			<button on:click={fechar} class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100">Cancelar</button>
			<button on:click={salvar} class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Salvar</button>
		</div>
	</div>
</dialog>
