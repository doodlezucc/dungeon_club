<script lang="ts" context="module">
	export type Alignment =
		| 'center'
		| 'top'
		| 'bottom'
		| 'left'
		| 'right'
		| 'top-left'
		| 'top-right'
		| 'bottom-left'
		| 'bottom-right';

	export type AlignMargin = 'small' | 'normal';
</script>

<script lang="ts">
	export let alignment: Alignment;
	export let margin: AlignMargin | undefined = undefined;
</script>

<div
	class:top={alignment.includes('top')}
	class:bottom={alignment.includes('bottom')}
	class:left={alignment.includes('left')}
	class:right={alignment.includes('right')}
	data-margin={margin}
>
	<slot />
</div>

<style>
	div {
		position: absolute;
		align-self: center;
	}

	[data-margin='small'] {
		margin: 0.8em;
	}
	[data-margin='normal'] {
		margin: 1em;
	}

	.top {
		top: 0;
	}

	.bottom {
		bottom: 0;
	}

	.left {
		left: 0;
	}

	.right {
		right: 0;
	}
</style>
