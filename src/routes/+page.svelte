<script>
	import { clearConsultaDraft } from '$lib/consultaStore';

	let prontuarioAntigo = '';
	let carregando = false;
	let erro = '';
	let aviso = '';
	let analiseConcluida = false;
	/** @type {HTMLDialogElement | null} */
	let resetDialogRef;

	let soap = {
		subjetivo: '',
		objetivo: '',
		avaliacao: '',
		plano: ''
	};

	/**
	 * @param {string} text
	 */
	function escapeHtml(text) {
		return text
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#039;');
	}

	/**
	 * @param {string} line
	 */
	function formatInlineMarkdown(line) {
		return escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
	}

	/**
	 * @param {string} content
	 */
	function renderSoapBlock(content) {
		if (!content?.trim()) {
			return '<p class="text-slate-400">Sem conteúdo.</p>';
		}

		const lines = content
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

		const htmlParts = [];
		let listItems = [];

		for (const line of lines) {
			if (line.startsWith('- ') || line.startsWith('* ')) {
				listItems.push(`<li>${formatInlineMarkdown(line.slice(2).trim())}</li>`);
			} else {
				if (listItems.length) {
					htmlParts.push(`<ul>${listItems.join('')}</ul>`);
					listItems = [];
				}
				htmlParts.push(`<p>${formatInlineMarkdown(line)}</p>`);
			}
		}

		if (listItems.length) {
			htmlParts.push(`<ul>${listItems.join('')}</ul>`);
		}

		return htmlParts.join('');
	}

	async function processarComGemini() {
		erro = '';
		aviso = '';

		if (!prontuarioAntigo.trim()) {
			erro = 'Cole o prontuário antigo antes de processar.';
			return;
		}

		carregando = true;

		try {
			const response = await fetch('/api/gemini', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ texto: prontuarioAntigo })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.error || 'Erro ao processar com Gemini.');
			}

			soap = {
				subjetivo: data.subjetivo ?? '',
				objetivo: data.objetivo ?? '',
				avaliacao: data.avaliacao ?? '',
				plano: data.plano ?? ''
			};

			aviso = data.warning ?? '';
			analiseConcluida = true;
		} catch (e) {
			erro = e instanceof Error ? e.message : 'Falha inesperada ao processar prontuário.';
		} finally {
			carregando = false;
		}
	}

	function novaAnalise() {
		analiseConcluida = false;
		erro = '';
		aviso = '';
		prontuarioAntigo = '';
		soap = {
			subjetivo: '',
			objetivo: '',
			avaliacao: '',
			plano: ''
		};
	}

	function abrirConfirmacaoReset() {
		resetDialogRef?.showModal();
	}

	function fecharConfirmacaoReset() {
		resetDialogRef?.close();
	}

	function limparMemoriaConsulta() {
		clearConsultaDraft();
		fecharConfirmacaoReset();
		aviso = 'Memória local da consulta limpa.';
	}
</script>

<svelte:head>
	<title>Anamnese Clínica</title>
</svelte:head>

<main class="min-h-screen bg-slate-50 py-4">
	<div class="mx-auto max-w-6xl px-3 sm:px-4">
		<header class="mb-3 flex items-start justify-between gap-3">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-slate-900">Sistematização SOAP</h1>
				<p class="mt-1 text-xs text-slate-600">
				Cole o prontuário antigo e converta em um resumo clínico estruturado para a consulta atual.
			</p>
			</div>
			<div class="flex flex-wrap justify-end gap-2">
				<button
					on:click={abrirConfirmacaoReset}
					class="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
				>
					Limpar Memória / Nova Consulta
				</button>
				{#if analiseConcluida}
					<button
						on:click={novaAnalise}
						class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
					>
						Nova Análise
					</button>
				{/if}
			</div>
		</header>

		{#if !analiseConcluida}
			<section class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
				<label for="prontuario" class="mb-1 block text-xs font-medium text-slate-700">
					Prontuário antigo
				</label>
				<textarea
					id="prontuario"
					bind:value={prontuarioAntigo}
					rows="10"
					placeholder="Cole aqui o texto bruto do prontuário anterior..."
					class="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
				></textarea>

				<div class="mt-2 flex items-center gap-2">
					<button
						on:click={processarComGemini}
						disabled={carregando}
						class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{#if carregando}
							Sistematizando...
						{:else}
							Sistematizar com IA
						{/if}
					</button>
				</div>
			</section>
		{/if}

		{#if erro}
			<p class="mt-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
				{erro}
			</p>
		{/if}
		{#if aviso}
			<p class="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
				{aviso}
			</p>
		{/if}

		<nav
			class="sticky top-2 z-10 mt-2 flex items-center justify-center gap-1 rounded-lg border border-blue-100 bg-white/90 p-1 shadow-sm backdrop-blur"
			aria-label="Atalhos SOAP"
		>
			<a href="#subjetivo" class="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
				S
			</a>
			<a href="#objetivo" class="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
				O
			</a>
			<a href="#avaliacao" class="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
				A
			</a>
			<a href="#plano" class="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">P</a>
		</nav>

		<section class="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
			<h2 class="mb-1 text-base font-semibold text-slate-900">Retorno estruturado em SOAP</h2>
			<p class="mb-2 text-xs text-slate-600">
				Visualização formatada para leitura clínica rápida.
			</p>

			{#if !analiseConcluida}
				<div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
					Execute a sistematização para preencher automaticamente os campos SOAP.
				</div>
			{/if}

			<div class="space-y-2">
				<details id="subjetivo" class="rounded-lg border border-slate-200 p-2" open>
					<summary class="cursor-pointer list-none text-sm font-semibold text-slate-800">
						[S] Subjetivo
					</summary>
					<p class="mt-0.5 text-[11px] text-slate-500">
						Identificação, QP, HMA, revisão de sistemas, HPP por sistemas, medicações, história familiar, ocupacional, psicossocial e hábitos.
					</p>
					<div class="soap-content mt-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900">
						{@html renderSoapBlock(soap.subjetivo)}
					</div>
				</details>

				<details id="objetivo" class="rounded-lg border border-slate-200 p-2" open>
					<summary class="cursor-pointer list-none text-sm font-semibold text-slate-800">
						[O] Objetivo
					</summary>
					<p class="mt-0.5 text-[11px] text-slate-500">
						Dados antropométricos, exame físico e exames complementares.
					</p>
					<div class="soap-content mt-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900">
						{@html renderSoapBlock(soap.objetivo)}
					</div>
				</details>

				<details id="avaliacao" class="rounded-lg border border-slate-200 p-2" open>
					<summary class="cursor-pointer list-none text-sm font-semibold text-slate-800">
						[A] Avaliação
					</summary>
					<p class="mt-0.5 text-[11px] text-slate-500">Hipóteses diagnósticas e raciocínio clínico.</p>
					<div class="soap-content mt-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900">
						{@html renderSoapBlock(soap.avaliacao)}
					</div>
				</details>

				<details id="plano" class="rounded-lg border border-slate-200 p-2" open>
					<summary class="cursor-pointer list-none text-sm font-semibold text-slate-800">
						[P] Plano
					</summary>
					<p class="mt-0.5 text-[11px] text-slate-500">Condutas, pedidos, orientações e prescrições.</p>
					<div class="soap-content mt-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900">
						{@html renderSoapBlock(soap.plano)}
					</div>
				</details>
			</div>
		</section>
	</div>
</main>

<dialog bind:this={resetDialogRef} class="w-full max-w-md rounded-lg p-0 backdrop:bg-black/20">
	<div class="rounded-lg border border-slate-200 bg-white p-4">
		<h2 class="text-sm font-semibold text-slate-900">Limpar memória da consulta?</h2>
		<p class="mt-1 text-xs leading-relaxed text-slate-600">
			Os dados ainda não enviados ao banco serão removidos do navegador.
		</p>
		<div class="mt-4 flex justify-end gap-2">
			<button
				type="button"
				on:click={fecharConfirmacaoReset}
				class="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
			>
				Cancelar
			</button>
			<button
				type="button"
				on:click={limparMemoriaConsulta}
				class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
			>
				Limpar
			</button>
		</div>
	</div>
</dialog>

<style>
	.soap-content :global(p) {
		margin: 0.125rem 0;
	}

	.soap-content :global(ul) {
		margin: 0.125rem 0;
		padding-left: 1rem;
	}

	.soap-content :global(li) {
		margin: 0.125rem 0;
	}
</style>
