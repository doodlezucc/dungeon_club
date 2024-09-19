<script lang="ts">
	import { rest } from 'client/communication';
	import { asset } from 'client/communication/asset';
	import { campaignState } from 'client/state';
	import Icon from 'components/Icon.svelte';
	import { Row } from 'components/layout';
	import FileUploader from 'components/upload/FileUploader.svelte';
	import type { AssetSnippet } from 'shared';

	export let avatar: AssetSnippet | null;

	async function handleAvatarChange(ev: CustomEvent<File[]>) {
		const files = ev.detail;
		if (files.length == 0) return;

		const chosenAvatar = files[0];

		const uploadedAsset: AssetSnippet = await $rest.postFile(
			`/campaigns/${$campaignState!.id}/assets`,
			chosenAvatar
		);

		avatar = uploadedAsset;
	}
</script>

<FileUploader
	accept="image/*"
	buttonClass="token-properties-avatar-upload"
	on:change={handleAvatarChange}
>
	<Row align="center">
		{#if avatar}
			<img src={asset(avatar.path)} alt="Token avatar" />
		{:else}
			<Icon icon="user" />
		{/if}

		<span class="avatar-label">Avatar</span>
	</Row>
</FileUploader>

<style lang="scss">
	$avatar-size: 48px;

	:global(.token-properties-avatar-upload) {
		padding: 0;
		overflow: hidden;
		border-radius: 100vw;
		flex: 1;

		font: inherit;
		letter-spacing: inherit;
		text-transform: none;
		color: inherit;
	}

	:global(.token-properties-avatar-upload:hover) {
		border: 2px solid var(--color-input-hover-outline);
	}

	.avatar-label {
		margin: 0 16px 0 8px;
	}

	img {
		display: block;
		width: $avatar-size;
		height: $avatar-size;
		border-radius: 50%;
		object-fit: cover;
	}
</style>
