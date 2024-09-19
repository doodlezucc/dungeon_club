<script lang="ts" context="module">
	export interface SelectOptions {
		additive: boolean;
	}

	export interface SelectionContext<T> {
		getSelected(): T[];
		select(element: T, options: SelectOptions): void;

		includes(element: T): boolean;
	}
</script>

<script lang="ts" generics="T">
	import { setContext } from 'svelte';

	export let elements: T[];
	export let getElementKey: (element: T) => string;

	export let selectedKeys = [] as string[];
	export let selectedElements: T[] = [];

	$: {
		const staleKeys = selectedKeys.filter(
			(key) => !elements.some((element) => getElementKey(element) === key)
		);

		if (staleKeys.length > 0) {
			// Remove stale keys of elements which are no longer part of the `elements` array.
			selectedKeys = selectedKeys.filter((key) => !staleKeys.includes(key));
		}

		// The order in which elements get selected stays consistent.
		// When selecting a new element, it will be placed at the end of the array.
		selectedElements = selectedKeys.map(
			(key) => elements.find((element) => getElementKey(element) === key)!
		);
	}

	export function clear() {
		selectedKeys = [];
	}

	export function select(element: T, { additive }: SelectOptions) {
		const key = getElementKey(element);

		if (additive) {
			if (!selectedKeys.includes(key)) {
				selectedKeys = [...selectedKeys, key];
			}
		} else {
			selectedKeys = [key];
		}
	}

	setContext<SelectionContext<T>>('selection', {
		getSelected: () => selectedElements,
		select,

		includes: (element) => selectedKeys.includes(getElementKey(element))
	});
</script>

{#each elements as element (getElementKey(element))}
	<slot {element} isSelected={selectedElements.includes(element)} />
{/each}
