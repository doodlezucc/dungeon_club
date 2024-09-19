<script lang="ts">
	import type { Size } from '$lib/compounds';
	import { asset } from 'client/communication/asset';
	import { boardState, Campaign } from 'client/state';

	export const size: Size = {
		width: 600,
		height: 400
	};

	$: boardImageAsset = Campaign.instance.assetById($boardState!.mapImageId);
</script>

<img
	alt="Battle map of this board"
	src={asset($boardImageAsset.path)}
	width={size.width}
	height={size.height}
/>
