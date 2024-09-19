<script lang="ts">
	import { historyOf } from '$lib/packages/undo-redo/history';
	import { socket } from 'client/communication';
	import { Board, boardState, Campaign, campaignState } from 'client/state';
	import Collection from 'components/Collection.svelte';
	import { runWithErrorDialogBoundary } from 'components/extensions/modal';
	import Icon from 'components/Icon.svelte';
	import Column from 'components/layout/Column.svelte';
	import type { ModalContext } from 'components/modal';
	import FileUploader from 'components/upload/FileUploader.svelte';
	import type { TokenTemplateSnippet } from 'shared';
	import { getContext } from 'svelte';
	import Panel from '../Panel.svelte';
	import { exitTokenPlacement } from '../tokens/UnplacedToken.svelte';
	import {
		detachTemplateFromVisibleTokens,
		restPostTokenTemplate
	} from './token-palette-management';
	import TokenTemplateItem from './TokenTemplateItem.svelte';

	const tokenTemplates = Campaign.instance.tokenTemplates.withFallback([]);

	const modal = getContext<ModalContext>('modal');

	async function createNewTemplatesFromFiles(ev: CustomEvent<File[]>) {
		const files = ev.detail;

		await runWithErrorDialogBoundary(modal, async () => {
			for (const file of files) {
				const isImage = file.type.startsWith('image/');

				if (isImage) {
					const response = await restPostTokenTemplate({ avatarImageFile: file });
				}
			}
		});
	}

	async function deleteTokenTemplate(deletedTemplate: TokenTemplateSnippet) {
		exitTokenPlacement();

		// Although it's not really part of the board, deletion of a token
		// template gets registered on the visible board's undo stack.
		historyOf($boardState?.id ?? $campaignState!.id).registerUndoable(
			'Delete token template',
			() => {
				$socket.send('tokenTemplateDelete', { tokenTemplateId: deletedTemplate.id });

				const boardBeforeDelete = $boardState;
				if ($boardState) {
					detachTemplateFromVisibleTokens(deletedTemplate);
				}

				const tokenTemplatesBeforeDelete = $tokenTemplates;
				$tokenTemplates = $tokenTemplates.filter((template) => template.id !== deletedTemplate.id);

				return {
					undo: () => {
						$socket.send('tokenTemplateRestore', { tokenTemplateId: deletedTemplate.id });

						const isAffectedBoardVisible =
							$boardState && boardBeforeDelete && $boardState.id === boardBeforeDelete.id;

						if (isAffectedBoardVisible) {
							// Reset tokens to how they were before their template was detached
							Board.instance.put((board) => ({
								...board,
								tokens: boardBeforeDelete.tokens
							}));
						}

						$tokenTemplates = tokenTemplatesBeforeDelete;
					}
				};
			}
		);
	}
</script>

<Panel title="Token Palette">
	<Column gap="normal">
		<div class="token-palette-list">
			<Collection
				itemClass="token-palette-item"
				items={$tokenTemplates}
				keyFunction={(template) => template.id}
				let:item
			>
				<TokenTemplateItem template={item} on:delete={() => deleteTokenTemplate(item)} />
			</Collection>
		</div>

		<FileUploader
			accept="image/*"
			acceptMultiple
			buttonClass="token-palette-item"
			on:change={createNewTemplatesFromFiles}
		>
			<Icon icon="add" />
		</FileUploader>
	</Column>
</Panel>

<style>
	.token-palette-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 200px;
		max-height: 25vh;
		overflow-x: hidden;
		overflow-y: auto;
	}
</style>
