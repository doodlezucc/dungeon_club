<script lang="ts">
	import { accountState } from 'client/state';
	import { Content } from 'components';
	import { Row } from 'components/layout';
	import { onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import AccountContent from './home/AccountContent.svelte';
	import LoginForm from './home/forms/LoginForm.svelte';

	$: isLoggedIn = !!$accountState;

	$: isMounted = false;

	onMount(() => {
		isMounted = true;
	});
</script>

<main>
	<Content>
		{#if !isLoggedIn && isMounted}
			<div in:fly={{ y: 50, duration: 800 }} out:slide>
				<Row justify="center">
					<LoginForm />
				</Row>
			</div>
		{:else if isMounted}
			<AccountContent />
		{/if}
	</Content>
</main>
