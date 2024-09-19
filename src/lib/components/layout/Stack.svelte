<script>
	export let expand = false;
</script>

<div class:expand>
	<slot />
</div>

<style>
	div {
		position: relative;
		display: flex;

		justify-content: center;
	}
</style>
