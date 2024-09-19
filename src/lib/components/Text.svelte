<script lang="ts" context="module">
	export type TextStyle = 'display' | 'heading' | 'subtitle' | 'body' | 'code';
	export type TextColor = 'error';

	export type TextStyleDefinition = {
		tag: string;
		className?: string;
	};

	export const textStyles: Record<TextStyle, TextStyleDefinition> = {
		display: {
			tag: 'h1'
		},
		heading: {
			tag: 'h2'
		},
		subtitle: {
			tag: 'span',
			className: 'subtitle'
		},
		body: {
			tag: 'p'
		},

		code: {
			tag: 'pre',

			className: 'code'
		}
	};
</script>

<script lang="ts">
	export let style: TextStyle = 'body';
	export let color: TextColor | undefined = undefined;

	export let id: string | undefined = undefined;

	$: styleDefinition = textStyles[style];
</script>

<svelte:element
	this={styleDefinition.tag}
	class={styleDefinition.className}
	class:error={color === 'error'}
	{id}
>
	<slot />
</svelte:element>
