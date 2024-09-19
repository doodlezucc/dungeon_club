<script lang="ts" context="module">
	export const tooltipContainerID = 'tooltips';

	export type ModalContext = {
		displayToast: (options: ToastOptions) => void;

		display: <T, PROPS extends Record<string, any>>(
			component: typeof SvelteComponent<PROPS>,
			props: PROPS
		) => Promise<T>;

		pop: <T>(result?: T) => void;
	};

	interface Modal<T, PROPS extends Record<string, any>> {
		id: number;
		component: typeof SvelteComponent<PROPS>;
		props: PROPS;
		callback: (result: T) => void;
	}

	interface VisibleToast {
		id: number;
		options: ToastOptions;
	}
</script>

<script lang="ts">
	import { browser } from '$app/environment';

	import { setContext, SvelteComponent } from 'svelte';
	import { flip } from 'svelte/animate';
	import { writable } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';
	import Toast, { MAX_TOAST_COUNT, TOAST_DURATION_MS, type ToastOptions } from './Toast.svelte';

	const stack = writable<Modal<any, any>[]>([]);
	const toasts = writable<VisibleToast[]>([]);

	const nextModalID = writable(0);
	const nextToastID = writable(0);

	function display<T, PROPS extends Record<string, any>>(
		component: typeof SvelteComponent<PROPS>,
		props: PROPS
	): Promise<T> {
		return new Promise((resolve) => {
			$stack = [
				...$stack,
				{
					id: $nextModalID++,
					component,
					props,
					callback: resolve
				}
			];
		});
	}

	function displayToast(options: ToastOptions) {
		const id = $nextToastID++;

		$toasts = [{ id, options }, ...$toasts];

		if ($toasts.length > MAX_TOAST_COUNT) {
			$toasts = $toasts.slice(0, MAX_TOAST_COUNT);
		}

		setTimeout(() => {
			// Remove this toast after timeout
			$toasts = $toasts.filter((toast) => toast.id !== id);
		}, TOAST_DURATION_MS);
	}

	if (browser) {
		setContext<ModalContext>('modal', {
			displayToast,
			display,
			pop: (result) => {
				const topModal = $stack.at(-1);
				topModal?.callback(result);

				$stack = $stack.slice(0, $stack.length - 1);
			}
		});
	}
</script>

<slot />

<div class="modal-provider">
	{#each $stack as modal (modal.id)}
		<div class="modal" aria-modal="true" transition:fade={{ duration: 200 }}>
			<svelte:component this={modal.component} {...modal.props} />
		</div>
	{/each}

	<div class="toast-array">
		{#each $toasts as toast, index (toast.id)}
			<div
				animate:flip={{ duration: 100 }}
				in:fly={{ y: 20, duration: 100 }}
				out:fade={{ duration: 100 }}
			>
				<Toast options={toast.options} isLatest={index == 0} />
			</div>
		{/each}
	</div>

	<div id={tooltipContainerID} class="group"></div>
</div>

<style>
	.modal-provider {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		pointer-events: none;

		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal {
		position: absolute;
		pointer-events: all;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		background-color: var(--color-modal-background);
	}

	.toast-array {
		position: absolute;
		display: flex;
		gap: 0.5em;
		flex-direction: column-reverse;
		align-items: center;
		bottom: 5em;
	}

	.group {
		display: contents;
	}
</style>
