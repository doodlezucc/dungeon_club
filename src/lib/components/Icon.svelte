<script lang="ts" context="module">
	import { library, type IconName } from '@fortawesome/fontawesome-svg-core';
	import { fab } from '@fortawesome/free-brands-svg-icons';
	import { fas } from '@fortawesome/free-solid-svg-icons';

	export type IconID = IconName;

	library.add(fas, fab);
</script>

<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	export let icon: IconID;
</script>

{#key icon}
	<FontAwesomeIcon {icon} />
{/key}
