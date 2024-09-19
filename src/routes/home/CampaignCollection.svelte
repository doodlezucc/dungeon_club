<script lang="ts">
	import { goto } from '$app/navigation';
	import { socket } from 'client/communication';
	import { Account, Campaign } from 'client/state';
	import { Button, Text } from 'components';
	import ArrangedCollection from 'components/ArrangedCollection.svelte';
	import DragHandle from 'components/DragHandle.svelte';
	import { runWithErrorDialogBoundary } from 'components/extensions/modal';
	import { Column, Container, Placeholder, Row } from 'components/layout';
	import type { ModalContext } from 'components/modal';
	import type { CampaignCardSnippet, CampaignSnippet } from 'shared';
	import { getContext } from 'svelte';
	import Time from 'svelte-time/Time.svelte';
	import CampaignEditDialog from './CampaignEditDialog.svelte';

	const campaigns = Account.campaigns;

	const modal = getContext<ModalContext>('modal');

	async function editCampaign(unedited: CampaignCardSnippet) {
		const editedCampaign: CampaignCardSnippet | undefined = await modal.display(
			CampaignEditDialog,
			{
				...unedited
			}
		);

		if (editedCampaign) {
			campaigns.update((campaigns) =>
				campaigns.map((existingCampaign) =>
					existingCampaign.id === editedCampaign.id ? editedCampaign : existingCampaign
				)
			);
		}
	}

	async function createCampaign() {
		const result: CampaignSnippet | undefined = await modal.display(CampaignEditDialog, {
			name: ''
		});

		if (result) {
			goto('/games/' + result.id);
			Campaign.instance.onEnter(result);
		}
	}

	function submitReorder() {
		runWithErrorDialogBoundary(modal, async () => {
			await $socket.request('campaignReorder', {
				campaignIds: $campaigns.map((campaign) => campaign.id)
			});
		});
	}
</script>

<Row gap="normal" wrap>
	<ArrangedCollection
		customDragHandling
		bind:items={$campaigns}
		on:reorder={submitReorder}
		let:item={campaign}
		let:dragController
	>
		<Container>
			<Row gap="big" align="center" justify="space-between">
				<h2>{campaign.name}</h2>
				<DragHandle controller={dragController} />
			</Row>
			<Column gap="big">
				<Text style="subtitle">Created <Time timestamp={campaign.createdAt} /></Text>

				<Placeholder>Preview Image</Placeholder>

				<Row gap="normal">
					<Button on:click={() => editCampaign(campaign)}>Settings</Button>
					<Button highlight raised href="games/{campaign.id}">Host Session</Button>
				</Row>
			</Column>
		</Container>

		<svelte:fragment slot="plus">
			<Button raised on:click={createCampaign}>Create new campaign</Button>
		</svelte:fragment>
	</ArrangedCollection>
</Row>

<style>
	h2 {
		margin: 0;
	}
</style>
