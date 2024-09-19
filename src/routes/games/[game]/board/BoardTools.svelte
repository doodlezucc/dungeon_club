<script lang="ts">
	import { Button } from 'components';
	import { Column } from 'components/layout';
	import type { ModalContext } from 'components/modal';
	import { getContext } from 'svelte';
	import SelectBoardDialog from '../board-selection/SelectBoardDialog.svelte';

	const modal = getContext<ModalContext>('modal');

	async function switchBoard() {
		await modal.display(SelectBoardDialog, {});
	}
</script>

<Column gap="normal">
	<Button raised on:click={switchBoard}>Switch Board</Button>
	<Button raised>Edit Board</Button>
	<Button raised>Roll Dice</Button>
</Column>
