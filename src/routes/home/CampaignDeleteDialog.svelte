<script lang="ts">
	import { Button } from 'components';
	import { Dialog, type ModalContext } from 'components/modal';
	import Text from 'components/Text.svelte';
	import { getContext } from 'svelte';

	export let campaignName: string;

	const modal = getContext<ModalContext>('modal');
</script>

<Dialog title="Delete Campaign" disableCloseButton>
	<Text>
		Are you sure you want to delete "{campaignName}"?
		<br />
		All of its boards, tokens and assets will be lost.
	</Text>

	<svelte:fragment slot="actions">
		<Button on:click={() => modal.pop(null)}>Cancel</Button>
		<Button raised on:click={() => modal.pop(true)} type="submit">
			<span class="error">Delete</span>
		</Button>
	</svelte:fragment>
</Dialog>
