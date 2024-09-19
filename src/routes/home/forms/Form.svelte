<script lang="ts">
	import { Button } from 'components';
	import { Column, Container } from 'components/layout';
	import { fly } from 'svelte/transition';

	export let title: string;
	export let submitButtonLabel: string;

	export let disableSubmitButton = false;
	export let disableFormSpacing = false;

	export let handleSubmit: () => Promise<void>;

	$: errorReason = '';
	$: isSubmitting = false;

	async function onSubmitForm() {
		isSubmitting = true;
		errorReason = '';

		try {
			await handleSubmit();
		} catch (err) {
			if (err instanceof Error) {
				errorReason = err.message;
			} else {
				errorReason = `${err}`;
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div role="dialog">
	<Container margin="big" padding="big">
		<Column align="center">
			<h2>{title}</h2>

			<slot name="note" />

			<form
				class:disable-spacing={disableFormSpacing}
				action="javascript:void(0);"
				method="dialog"
				on:submit={() => false}
			>
				<slot />

				{#if errorReason}
					<span class="error" aria-live="polite" in:fly={{ y: 20 }}>{errorReason}.</span>
				{/if}

				<Button
					type="submit"
					on:click={onSubmitForm}
					raised
					highlight
					disabled={isSubmitting || disableSubmitButton}
				>
					{submitButtonLabel}
				</Button>

				<slot name="links" />
			</form>
		</Column>
	</Container>
</div>

<style lang="scss">
	h2 {
		color: var(--color-primary);
	}

	form {
		margin-top: 2em;
		display: grid;
		gap: 1em;
		max-width: 500px;
		text-align: center;
	}

	:global(form .error) {
		text-align: start;

		/* Prevent validation text from expanding the form width. */
		width: 0;
		min-width: 100%;
	}

	.error {
		margin-top: 0.5em;
	}

	.disable-spacing {
		margin-top: 0;
		gap: 0.5em;

		.error {
			margin-top: 0;
		}
	}
</style>
