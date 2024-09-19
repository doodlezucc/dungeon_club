<script lang="ts" context="module">
	const MIN_PASSWORD_LENGTH = 7;
</script>

<script lang="ts">
	import Input from 'components/Input.svelte';
	import { Column } from 'components/layout';
	import { enteredEmailAddress } from '../credential-stores';
	import Form from './Form.svelte';

	export let title: string;
	export let submitButtonLabel: string;
	export let passwordInputLabel = 'Password';

	export let handleSubmit: (emailAddress: string, password: string) => Promise<void>;

	$: password = '';
	$: passwordConfirmation = '';

	$: formValidationError = 'woah';
	$: isValid = false;

	function validate() {
		if (password.length === 0) {
			throw '';
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			throw `Password should be at least ${MIN_PASSWORD_LENGTH} characters long.`;
		}

		if (passwordConfirmation.length > 0 && password !== passwordConfirmation) {
			throw "Passwords don't match.";
		}

		if ($enteredEmailAddress.length === 0 || passwordConfirmation.length === 0) {
			throw '';
		}
	}

	$: {
		[$enteredEmailAddress, password, passwordConfirmation];

		isValid = false;

		try {
			validate();
			formValidationError = '';
			isValid = true;
		} catch (err) {
			formValidationError = `${err}`;
		}
	}
</script>

<Form
	{title}
	{submitButtonLabel}
	disableSubmitButton={!isValid}
	handleSubmit={() => handleSubmit($enteredEmailAddress, password)}
>
	<slot name="note" slot="note"></slot>

	<Input
		autofocus
		required
		label="Email Address"
		placeholder="Email of your account..."
		name="email"
		type="email"
		autocomplete="email"
		bind:value={$enteredEmailAddress}
	/>
	<Column gap="normal">
		<Input
			required
			label={passwordInputLabel}
			placeholder="Password..."
			name="new-password"
			type="password"
			autocomplete="new-password"
			bind:value={password}
		/>
		<Input
			required
			placeholder="Password (again)..."
			name="confirm-password"
			type="password"
			autocomplete="new-password"
			bind:value={passwordConfirmation}
		/>
		{#if formValidationError.length > 0}
			<span class="error">{formValidationError}</span>
		{/if}
	</Column>

	<slot name="links" slot="links"></slot>
</Form>
