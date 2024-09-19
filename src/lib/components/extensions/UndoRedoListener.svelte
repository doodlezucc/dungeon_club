<script lang="ts">
	import { focusedHistory } from 'client/state/focused-history';
	import type { ModalContext } from 'components/modal';
	import { getContext } from 'svelte';
	import { listenTo, ShortcutAction } from './ShortcutListener.svelte';

	const modal = getContext<ModalContext>('modal');

	const onUndo = listenTo(ShortcutAction.Undo);
	$onUndo.handle(async () => {
		const undoResult = await $focusedHistory?.undo();
		if (!undoResult) return;

		const { actionName } = undoResult;
		modal.displayToast({
			text: `Undo: ${actionName}`,
			icon: 'undo-alt'
		});
	});

	const onRedo = listenTo(ShortcutAction.Redo);
	$onRedo.handle(async () => {
		const redoResult = await $focusedHistory?.redo();
		if (!redoResult) return;

		const { actionName } = redoResult;
		modal.displayToast({
			text: `Redo: ${actionName}`,
			icon: 'redo-alt'
		});
	});
</script>

<slot />
