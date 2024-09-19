<script lang="ts" context="module">
	export type Padding = 'big';
	export type ContainerMargin = 'big';

	export type ContainerVariant = 'elevated' | 'outlined';
</script>

<script lang="ts">
	export let margin: ContainerMargin | undefined = undefined;
	export let padding: Padding | undefined = undefined;

	export let variant: ContainerVariant = 'elevated';
</script>

<div class="container" data-margin={margin} data-padding={padding} data-variant={variant}>
	<slot />
</div>
