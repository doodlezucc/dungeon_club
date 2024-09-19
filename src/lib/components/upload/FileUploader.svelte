<script lang="ts" context="module">
	export type AcceptedFileType = 'audio/*' | 'image/*';
</script>

<script lang="ts">
	import Icon, { type IconID } from 'components/Icon.svelte';
	import { createEventDispatcher } from 'svelte';

	export let accept: AcceptedFileType;
	export let acceptMultiple = false;

	export let buttonClass = 'raised';
	export let displayedIcon: IconID | undefined = undefined;

	$: dragOver = false;
	$: fileList = null as File[] | null;

	let input: HTMLInputElement;
	function openFilePicker() {
		input.click();
	}

	const dispatch = createEventDispatcher<{
		change: File[];
	}>();

	$: {
		if (fileList) {
			dispatch('change', fileList);

			// Clear input element state to allow picking the same file again
			input.value = '';
		}
	}

	function handleDrop(ev: DragEvent) {
		dragOver = false;
		ev.preventDefault();
		const files = ev.dataTransfer?.files;

		if (files) {
			if (acceptMultiple) {
				fileList = Array.from(files);
			} else {
				fileList = files.length >= 1 ? [files.item(0)!] : [];
			}
		}
	}

	function handlePick() {
		if (input.files) {
			fileList = Array.from(input.files);
		}
	}
</script>

<button
	id="upload-button"
	on:click={openFilePicker}
	on:dragenter={() => (dragOver = true)}
	on:dragover={(ev) => ev.preventDefault()}
	on:dragleave={() => (dragOver = false)}
	on:drop={handleDrop}
	type="button"
	aria-describedby="file-upload"
	class={buttonClass}
	class:drop-area={true}
	class:drag-over={dragOver}
>
	{#if displayedIcon}
		<div class="upload-icon">
			<Icon icon={displayedIcon} />
		</div>
	{/if}

	<slot />
</button>
<input
	{accept}
	multiple={acceptMultiple}
	bind:this={input}
	on:change={handlePick}
	type="file"
	id="file-upload"
	aria-labelledby="upload-button"
	hidden
/>

<style lang="scss">
	.upload-icon {
		font-size: 3em;
		opacity: 0.5;
		margin-bottom: 0.1em;
	}

	.drop-area {
		border-style: dashed;
	}

	:global(.drop-area > *) {
		pointer-events: none;
	}
</style>
