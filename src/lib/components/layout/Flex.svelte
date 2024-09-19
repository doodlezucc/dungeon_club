<script lang="ts" context="module">
	export type FlexDirection = 'column' | 'row';
	export type Gap = 'small' | 'normal' | 'big';

	export type FlexAlign = 'start' | 'center' | 'end';
	export type FlexJustify =
		| 'start'
		| 'center'
		| 'end'
		| 'space-between'
		| 'space-around'
		| 'space-evenly';
</script>

<script lang="ts">
	export let direction: FlexDirection | undefined = undefined;
	export let gap: Gap | undefined = undefined;

	export let align: FlexAlign | undefined = undefined;
	export let justify: FlexJustify | undefined = undefined;

	export let expand = false;
	export let wrap = false;
</script>

<div
	class={direction}
	class:expand
	data-align={align}
	data-justify={justify}
	data-gap={gap}
	data-wrap={wrap ? 1 : undefined}
>
	<slot />
</div>

<style>
	[data-gap='small'] {
		gap: 1px;
	}
	[data-gap='normal'] {
		gap: 0.4em;
	}
	[data-gap='big'] {
		gap: 0.8em;
	}

	[data-wrap] {
		flex-wrap: wrap;
	}

	[data-align='start'] {
		align-items: flex-start;
	}
	[data-align='center'] {
		align-items: center;
	}
	[data-align='end'] {
		align-items: flex-end;
	}

	[data-justify='start'] {
		justify-content: flex-start;
	}
	[data-justify='center'] {
		justify-content: center;
	}
	[data-justify='end'] {
		justify-content: flex-end;
	}
	[data-justify='space-between'] {
		justify-content: space-between;
	}
	[data-justify='space-around'] {
		justify-content: space-around;
	}
	[data-justify='space-evenly'] {
		justify-content: space-evenly;
	}
</style>
