<script>
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import '../app.css';
	let menuOpen = $state(false);
	let { children } = $props();

	const links = [
		{ href: '/', label: 'Início (SOAP)', icon: 'S' },
		{ href: '/consulta', label: 'Consulta Médica', icon: 'Q' },
		{ href: '/exames', label: 'Exames Laboratoriais', icon: 'E' },
		{ href: '/cid10', label: 'Base CID-10', icon: 'C' },
		{ href: '/medicamentos', label: 'Medicamentos (RENAME)', icon: 'M' },
		{ href: '/procedimentos', label: 'Procedimentos', icon: 'P' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900">
	<div class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
		<div class="mx-auto flex max-w-screen-2xl items-center justify-between">
			<div class="flex items-center gap-2">
				<button
					onclick={() => (menuOpen = true)}
					class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-100"
					aria-label="Abrir navegação"
				>
					☰
				</button>
				<p class="text-sm font-semibold">Anamnese Clínica</p>
			</div>
			<p class="hidden text-xs text-slate-500 sm:block">
				{links.find((link) => link.href === page.url.pathname)?.label ?? 'Navegação Clínica'}
			</p>
		</div>
	</div>

	{#if menuOpen}
		<button
			class="fixed inset-0 z-40 bg-slate-950/35"
			aria-label="Fechar navegação"
			onclick={() => (menuOpen = false)}
		></button>
		<aside class="fixed left-0 top-0 z-50 h-screen w-72 max-w-[85vw] border-r border-slate-200 bg-white p-3 shadow-2xl">
			<div class="mb-3 flex items-center justify-between">
				<p class="text-sm font-semibold">Navegação Clínica</p>
				<button
					onclick={() => (menuOpen = false)}
					class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
					aria-label="Fechar navegação"
				>
					×
				</button>
			</div>
			<nav class="space-y-1">
				{#each links as link}
					<a
						href={link.href}
						onclick={() => (menuOpen = false)}
						class={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
							page.url.pathname === link.href ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
						}`}
					>
						<span class="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[11px] font-semibold">
							{link.icon}
						</span>
						{link.label}
					</a>
				{/each}
			</nav>
		</aside>
	{/if}

	<div class="mx-auto max-w-screen-2xl">
		<div class="min-w-0 flex-1">
			{@render children()}
		</div>
	</div>
</div>
