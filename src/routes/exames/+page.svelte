<script>
	import { onMount } from 'svelte';

	/** @typedef {{ id: number | null; material: string; nome: string; pacote: string; unidade_medida: string; valores_referencia: string; significado: string; }} Exame */

	/** @type {Exame[]} */
	let exames = [];
	let pacoteFiltro = '';
	let loading = false;
	let erro = '';
	let aviso = '';
	/** @type {HTMLDialogElement | null} */
	let dialogRef;
	/** @type {'novo' | 'editar'} */
	let modo = 'novo';

	/** @type {Exame} */
	const emptyForm = {
		id: null,
		material: '',
		nome: '',
		pacote: '',
		unidade_medida: '',
		valores_referencia: '',
		significado: ''
	};

	/** @type {Exame} */
	let form = { ...emptyForm };

	async function carregarExames() {
		loading = true;
		erro = '';
		aviso = '';
		try {
			const params = new URLSearchParams();
			if (pacoteFiltro.trim()) params.set('pacote', pacoteFiltro.trim());
			const query = params.toString();
			const response = await fetch(`/api/exames${query ? `?${query}` : ''}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Falha ao carregar exames.');
			}
			exames = data.exames ?? [];
			aviso = data.warning ?? '';
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado.';
		} finally {
			loading = false;
		}
	}

	function abrirNovo() {
		modo = 'novo';
		form = { ...emptyForm };
		dialogRef?.showModal();
	}

	/**
	 * @param {Exame} exame
	 */
	function abrirEdicao(exame) {
		modo = 'editar';
		form = { ...exame };
		dialogRef?.showModal();
	}

	function fecharModal() {
		dialogRef?.close();
	}

	async function salvarExame() {
		erro = '';
		const method = modo === 'novo' ? 'POST' : 'PUT';
		try {
			const response = await fetch('/api/exames', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Falha ao salvar exame.');
			}
			fecharModal();
			await carregarExames();
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado.';
		}
	}

	/**
	 * @param {number | null} id
	 */
	async function excluirExame(id) {
		if (!id) return;
		if (!window.confirm('Excluir este exame? Esta ação não pode ser desfeita.')) {
			return;
		}

		erro = '';
		try {
			const response = await fetch(`/api/exames?id=${id}`, { method: 'DELETE' });
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Falha ao excluir exame.');
			}
			await carregarExames();
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Erro inesperado.';
		}
	}

	/**
	 * Parses a CSV string into rows with key-value pairs
	 * @param {string} text
	 * @returns {Array<Record<string, string>>}
	 */
	function parseCSV(text) {
		const lines = text.split(/\r?\n/).filter(line => line.trim());
		if (lines.length < 2) return [];

		const headerLine = lines[0];
		const delimiter = headerLine.includes(";") ? ";" : ",";

		const splitRow = (rowText) => {
			const result = [];
			let current = "";
			let inQuotes = false;
			for (let i = 0; i < rowText.length; i++) {
				const char = rowText[i];
				if (char === '"') {
					inQuotes = !inQuotes;
				} else if (char === delimiter && !inQuotes) {
					result.push(current.trim().replace(/^"|"$/g, ""));
					current = "";
				} else {
					current += char;
				}
			}
			result.push(current.trim().replace(/^"|"$/g, ""));
			return result;
		};

		const headers = splitRow(headerLine).map(h => h.toLowerCase().trim());
		
		const rows = [];
		for (let i = 1; i < lines.length; i++) {
			const values = splitRow(lines[i]);
			const row = /** @type {Record<string, string>} */ ({});
			headers.forEach((header, idx) => {
				row[header] = values[idx] || "";
			});
			rows.push(row);
		}
		return rows;
	}

	/**
	 * @param {Event & { target: HTMLInputElement }} event
	 */
	async function handleCSVUpload(event) {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const text = e.target?.result;
				if (typeof text !== "string") return;

				const rows = parseCSV(text);
				if (rows.length === 0) {
					erro = "Arquivo CSV vazio ou inválido.";
					return;
				}

				let importedCount = 0;
				let errorCount = 0;

				for (const row of rows) {
					const nome = row.nome || row.exame || row.test || row.name || "";
					if (!nome.trim()) continue;

					const material = row.material || "Sangue";
					const pacote = row.pacote || row.grupo || row.package || "";
					const unidade = row.unidade || row.unit || row.unidade_medida || "";
					const referencia = row.referencia || row.valores || row.valores_referencia || row.valores_de_referencia || row.ref || row.reference || "";
					const significado = row.significado || row.interpretacao || row.meaning || "";

					try {
						const res = await fetch("/api/exames", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								material: material.trim(),
								nome: nome.trim(),
								pacote: pacote.trim(),
								unidade_medida: unidade.trim(),
								valores_referencia: referencia.trim(),
								significado: significado.trim()
							})
						});
						if (res.ok) {
							importedCount++;
						} else {
							errorCount++;
						}
					} catch (err) {
						errorCount++;
					}
				}

				if (importedCount === 0) {
					erro = "Nenhum exame pôde ser importado. Verifique a formatação do CSV.";
					return;
				}

				aviso = `${importedCount} exames importados com sucesso para a base de dados!${errorCount > 0 ? ` (${errorCount} falhas)` : ""}`;
				setTimeout(() => (aviso = ""), 5000);
				erro = "";
				event.target.value = "";
				await carregarExames();
			} catch (err) {
				erro = "Erro ao processar o arquivo CSV.";
			}
		};
		reader.readAsText(file);
	}

	onMount(carregarExames);
</script>

<svelte:head>
	<title>Gestão de Exames</title>
</svelte:head>

<main class="min-h-screen bg-slate-50 py-4">
	<div class="mx-auto max-w-6xl px-3 sm:px-4">
		<header class="mb-3 flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold text-slate-900">Exames Laboratoriais</h1>
				<p class="text-xs text-slate-600">
					Cadastro e manutenção de exames laboratoriais. Use o campo pacote para agrupar itens como
					"hemograma" (ex: hemoglobina, plaquetas).
				</p>
			</div>
			<div class="flex items-center gap-2">
				<label class="relative cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
					<span>Importar CSV</span>
					<input
						type="file"
						accept=".csv"
						on:change={handleCSVUpload}
						class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
					/>
				</label>
				<button
					on:click={abrirNovo}
					class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
				>
					Novo Exame
				</button>
			</div>
		</header>

		{#if erro}
			<p class="mb-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{erro}</p>
		{/if}
		{#if aviso}
			<p class="mb-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">{aviso}</p>
		{/if}

		<div class="mb-2 flex items-center gap-2">
			<input
				bind:value={pacoteFiltro}
				placeholder="Filtrar por pacote (ex: Hemograma)"
				class="w-full max-w-sm rounded-md border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
			/>
			<button
				on:click={carregarExames}
				class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100"
			>
				Filtrar
			</button>
		</div>

		<section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
			<div class="overflow-x-auto">
				<table class="min-w-full text-left text-xs">
					<thead class="bg-slate-100 text-slate-700">
						<tr>
							<th class="px-3 py-2">ID</th>
							<th class="px-3 py-2">Material</th>
							<th class="px-3 py-2">Nome</th>
							<th class="px-3 py-2">Pacote</th>
							<th class="px-3 py-2">Unidade</th>
							<th class="px-3 py-2">Valores de Referência</th>
							<th class="px-3 py-2">Significado</th>
							<th class="px-3 py-2 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{#if loading}
							<tr><td colspan="8" class="px-3 py-6 text-center text-slate-500">Carregando...</td></tr>
						{:else if exames.length === 0}
							<tr><td colspan="8" class="px-3 py-6 text-center text-slate-500">Sem exames cadastrados.</td></tr>
						{:else}
							{#each exames as exame}
								<tr
									class="cursor-pointer border-t border-slate-100 hover:bg-blue-50/40"
									on:click={() => abrirEdicao(exame)}
								>
									<td class="px-3 py-2">{exame.id}</td>
									<td class="px-3 py-2">{exame.material}</td>
									<td class="px-3 py-2">{exame.nome}</td>
									<td class="px-3 py-2">{exame.pacote || '-'}</td>
									<td class="px-3 py-2">{exame.unidade_medida}</td>
									<td class="px-3 py-2">{exame.valores_referencia}</td>
									<td class="px-3 py-2 max-w-xs truncate" title={exame.significado}>{exame.significado || '-'}</td>
									<td class="px-3 py-2 text-right">
										<button
											on:click|stopPropagation={() => excluirExame(exame.id)}
											class="rounded-md p-1 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
											title="Excluir exame"
											aria-label="Excluir exame"
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
	</div>
</main>

<dialog bind:this={dialogRef} class="w-full max-w-lg rounded-lg p-0 backdrop:bg-black/20">
	<div class="rounded-lg border border-slate-200 bg-white p-4">
		<h2 class="text-sm font-semibold text-slate-900">
			{modo === 'novo' ? 'Novo Exame' : 'Editar Exame'}
		</h2>

		<div class="mt-3 space-y-2 text-xs">
			<label class="block">
				<span class="mb-1 block text-slate-700">Material</span>
				<input
					bind:value={form.material}
					class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				/>
			</label>

			<label class="block">
				<span class="mb-1 block text-slate-700">Nome</span>
				<input
					bind:value={form.nome}
					class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				/>
			</label>

			<label class="block">
				<span class="mb-1 block text-slate-700">Pacote</span>
				<input
					bind:value={form.pacote}
					placeholder="Ex: Hemograma"
					class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				/>
			</label>

			<label class="block">
				<span class="mb-1 block text-slate-700">Unidade de medida</span>
				<input
					bind:value={form.unidade_medida}
					class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				/>
			</label>

			<label class="block">
				<span class="mb-1 block text-slate-700">Valores de referência</span>
				<textarea
					rows="3"
					bind:value={form.valores_referencia}
					class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				></textarea>
			</label>

			<label class="block">
				<span class="mb-1 block text-slate-700">Significado (opcional)</span>
				<textarea
					rows="3"
					bind:value={form.significado}
					placeholder="Descreva o significado clínico deste exame..."
					class="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				></textarea>
			</label>
		</div>

		<div class="mt-4 flex justify-end gap-2">
			<button
				on:click={fecharModal}
				class="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
			>
				Cancelar
			</button>
			<button
				on:click={salvarExame}
				class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
			>
				Salvar
			</button>
		</div>
	</div>
</dialog>
