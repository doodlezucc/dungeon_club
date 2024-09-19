<script lang="ts">
	import { rest, socket } from 'client/communication';
	import { Board, Campaign, campaignState } from 'client/state';
	import ArrangedCollection from 'components/ArrangedCollection.svelte';
	import { displayErrorDialog } from 'components/extensions/modal';
	import Row from 'components/layout/Row.svelte';
	import { Dialog, type ModalContext } from 'components/modal';
	import FileUploader from 'components/upload/FileUploader.svelte';
	import { getContext } from 'svelte';
	import { derived } from 'svelte/store';
	import BoardPreview from './BoardPreview.svelte';

	const boardSnippets = derived(campaignState, (campaign) => campaign?.boards);

	const modal = getContext<ModalContext>('modal');

	async function createNewBoardsFromFiles(ev: CustomEvent<File[]>) {
		const files = ev.detail;

		try {
			for (const file of files) {
				const isImage = file.type.startsWith('image/');

				if (isImage) {
					const { boardId } = await $rest.postFile(`/campaigns/${$campaignState!.id}/boards`, file);

					const createdBoard = await $socket.request('boardEdit', { id: boardId });

					Board.instance.load(createdBoard);
					Campaign.instance.put((campaign) => ({
						...campaign,
						boards: [...campaign.boards, createdBoard]
					}));
				}
			}

			modal.pop();
		} catch (error) {
			displayErrorDialog(modal, error);
		}
	}

	async function selectBoard(boardId: string) {
		await Board.instance.request({
			boardId,
			mode: 'edit'
		});
		modal.pop();
	}
</script>

<Dialog title="Select Board">
	{#if $boardSnippets}
		<Row gap="normal" wrap>
			<ArrangedCollection items={$boardSnippets} let:item={snippet}>
				<BoardPreview name={snippet.name} on:click={() => selectBoard(snippet.id)} />

				<svelte:fragment slot="plus">
					<FileUploader
						accept="image/*"
						acceptMultiple
						displayedIcon="file-image"
						on:change={createNewBoardsFromFiles}
					>
						New Board
					</FileUploader>
				</svelte:fragment>
			</ArrangedCollection>
		</Row>
	{/if}
</Dialog>
