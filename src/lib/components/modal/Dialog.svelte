<script lang="ts">
	import { getContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import IconButton from '../IconButton.svelte';
	import Row from '../layout/Row.svelte';
	import Separator from '../layout/Separator.svelte';
	import Text from '../Text.svelte';
	import type { ModalContext } from './ModalProvider.svelte';

	export let title: string;
	export let disableCloseButton: boolean = false;
	export let closeButtonResult: unknown = undefined;

	const modal = getContext<ModalContext>('modal');

	function trapFocus(node: HTMLElement) {
		const previous = document.activeElement as HTMLElement | null;

		function focusable() {
			return Array.from<HTMLElement>(
				node.querySelectorAll(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				)
			);
		}

		function handleKeydown(event: KeyboardEvent) {
			if (event.key !== 'Tab') return;

			const current = document.activeElement;

			const elements = focusable();
			const first = elements.at(0);
			const last = elements.at(-1);

			if (event.shiftKey && current === first) {
				last!.focus();
				event.preventDefault();
			}

			if (!event.shiftKey && current === last) {
				first!.focus();
				event.preventDefault();
			}
		}

		focusable()[disableCloseButton ? 0 : 1]?.focus();

		node.addEventListener('keydown', handleKeydown);

		return {
			destroy() {
				node.removeEventListener('keydown', handleKeydown);
				previous?.focus();
			}
		};
	}
</script>

<dialog
	class="column container"
	aria-labelledby="dialogTitle"
	use:trapFocus
	in:fly={{ y: 20 }}
	out:fly={{ y: -20 }}
>
	<header>
		<Row justify="space-between" align="center">
			<Text id="dialogTitle" style="heading">{title}</Text>

			{#if !disableCloseButton}
				<IconButton
					label="Close"
					icon="close"
					disableMargin
					on:click={() => modal.pop(closeButtonResult)}
				/>
			{/if}
		</Row>
	</header>

	<Separator fat />

	<div class="content">
		<slot />
	</div>

	{#if $$slots.actions}
		<div class="actions">
			<Row justify="end" gap="normal">
				<slot name="actions" />
			</Row>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		color: inherit;
		border: 2px solid var(--color-separator);
		padding: 0;
		max-width: 90vw;
	}

	header,
	.actions {
		padding: 1em;
	}

	.actions {
		padding-top: 0;
	}

	.content {
		padding: 2em;
	}

	:global(dialog > .content > :first-child) {
		margin-top: 0;
	}
</style>
