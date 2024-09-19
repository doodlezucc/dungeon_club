<script lang="ts" context="module">
	function getCommonTokenTemplateId(tokens: TokenSnippet[]) {
		return findCommonValue(tokens.map((token) => token.templateId)) ?? null;
	}

	function findCommonValue<T>(values: T[]) {
		if (values.length == 0) return undefined;

		const commonValue = values[0];
		for (let i = 1; i < values.length; i++) {
			const value = values[i];

			if (value !== commonValue) {
				return undefined;
			}
		}

		return commonValue;
	}
</script>

<script lang="ts">
	import { Board, Campaign } from 'client/state';
	import Input from 'components/Input.svelte';
	import { Column, Container } from 'components/layout';
	import type { GetPayload, OverridableTokenProperty, TokenProperties, TokenSnippet } from 'shared';
	import { getTemplateForToken, materializeToken } from 'shared/token-materializing';
	import { onMount } from 'svelte';
	import Inheritable from './Inheritable.svelte';
	import TokenPropertyAvatar from './TokenPropertyAvatar.svelte';
	import {
		arePayloadsEqual,
		buildWebSocketPayload,
		submitTokenPropertiesToServer
	} from './submitting';

	export let selectedTokenIds: string[];

	const allTokens = Board.instance.tokens;
	const allTemplates = Campaign.instance.tokenTemplates;
	const allAssets = Campaign.instance.assets;

	const selectedTokens = selectedTokenIds.map((id) => $allTokens.find((token) => token.id === id)!);
	const singleTokenTemplateId = getCommonTokenTemplateId(selectedTokens);

	const canToggleInheritance = singleTokenTemplateId !== null;

	const materializedTokens = selectedTokens.map((token) =>
		materializeToken(token, getTemplateForToken(token, $allTemplates))
	);

	function doAllTokensInherit<T>(getProperty: (token: TokenSnippet) => T | null) {
		const doesAnyTokenOverride = selectedTokens.some((token) => getProperty(token) !== null);
		return !doesAnyTokenOverride;
	}

	const conflictOverrideProperties = materializedTokens[materializedTokens.length - 1];

	const commonAvatarId = findCommonValue(materializedTokens.map((token) => token.avatarId));
	const commonName = findCommonValue(materializedTokens.map((token) => token.name));
	const commonSize = findCommonValue(materializedTokens.map((token) => token.size));
	const commonInitiativeModifier = findCommonValue(
		materializedTokens.map((token) => token.initiativeModifier)
	);

	let displayedProperties: TokenProperties = {
		avatarId: commonAvatarId !== undefined ? commonAvatarId : conflictOverrideProperties.avatarId,
		name: commonName ?? conflictOverrideProperties.name,
		size: commonSize ?? conflictOverrideProperties.size,
		initiativeModifier: commonInitiativeModifier ?? conflictOverrideProperties.initiativeModifier
	};

	let displayedInheritance: Record<OverridableTokenProperty, boolean> = {
		avatarId: doAllTokensInherit((token) => token.avatarId),
		name: doAllTokensInherit((token) => token.name),
		size: doAllTokensInherit((token) => token.size),
		initiativeModifier: doAllTokensInherit((token) => token.initiativeModifier)
	};

	function updateTemplateProperty<T extends OverridableTokenProperty>(
		property: T,
		value: TokenProperties[T]
	) {
		$allTemplates = $allTemplates.map((template) => {
			if (template.id !== singleTokenTemplateId) return template;

			return { ...template, [property]: value };
		});
	}

	function updatePropertyOnSelectedTokens<T extends OverridableTokenProperty>(
		property: T,
		value: TokenProperties[T]
	) {
		$allTokens = $allTokens.map((token) => {
			const isSelected = selectedTokens.some((selectedToken) => selectedToken.id === token.id);
			if (!isSelected) return token;

			return { ...token, [property]: value };
		});
	}

	/**
	 * Updates the specified property on either the selected tokens or their shared inherited template.
	 */
	function handlePropertyEdit<K extends OverridableTokenProperty>(
		property: K,
		value: TokenProperties[K]
	) {
		const propertyIsInherited = displayedInheritance[property];

		if (propertyIsInherited) {
			updateTemplateProperty(property, value);
		} else {
			updatePropertyOnSelectedTokens(property, value);
		}
	}

	/**
	 * Applies either the independence or the template inheritance of a specified property.
	 */
	function handleInheritanceStateToggle(property: OverridableTokenProperty, inherit: boolean) {
		const propertyValue = displayedProperties[property];

		if (inherit) {
			// At this point, assume that `singleTokenTemplate` != null
			updateTemplateProperty(property, propertyValue);
			updatePropertyOnSelectedTokens(property, null);
		} else {
			updatePropertyOnSelectedTokens(property, propertyValue);
		}
	}

	function updatePropertyValue<T extends OverridableTokenProperty>(
		property: T,
		value: TokenProperties[T]
	) {
		if (value !== displayedProperties[property]) {
			displayedProperties = { ...displayedProperties, [property]: value };
			handlePropertyEdit(property, value);
		}
	}

	function updatePropertyInheritance<T extends OverridableTokenProperty>(
		property: T,
		inherit: boolean
	) {
		if (inherit !== displayedInheritance[property]) {
			displayedInheritance = { ...displayedInheritance, [property]: inherit };
			handleInheritanceStateToggle(property, inherit);
		}
	}

	let avatarId = displayedProperties.avatarId;
	let inheritAvatar = displayedInheritance.avatarId;
	let avatar = avatarId ? $allAssets.find((asset) => asset.id === avatarId)! : null;

	let name = displayedProperties.name;
	let inheritName = displayedInheritance.name;

	let size = displayedProperties.size;
	let inheritSize = displayedInheritance.size;

	let initiativeModifier = displayedProperties.initiativeModifier;
	let inheritInitiaveModifier = displayedInheritance.initiativeModifier;

	let isMounted = false;
	$: {
		updatePropertyValue('name', name);
		updatePropertyInheritance('name', inheritName);
		updatePropertyValue('size', size);
		updatePropertyInheritance('size', inheritSize);
		updatePropertyValue('initiativeModifier', initiativeModifier);
		updatePropertyInheritance('initiativeModifier', inheritInitiaveModifier);

		updatePropertyValue('avatarId', avatar?.id ?? null);
		updatePropertyInheritance('avatarId', inheritAvatar);

		if (isMounted) {
			submitChanges();
		}
	}

	function buildEditingPayload(): GetPayload<'tokensEdit'> {
		return buildWebSocketPayload(
			singleTokenTemplateId,
			$allTemplates,
			selectedTokenIds,
			$allTokens
		);
	}

	const initialPayload = buildEditingPayload();

	function submitChanges() {
		const editedPayload = buildEditingPayload();

		if (!arePayloadsEqual(initialPayload, editedPayload)) {
			submitTokenPropertiesToServer(editedPayload);
		}
	}

	onMount(() => {
		isMounted = true;
	});
</script>

<Container>
	<Column gap="normal">
		<Inheritable bind:isInheriting={inheritName} disableToggle={!canToggleInheritance}>
			<Input name="name" bind:value={name} placeholder="Name..." size="small" />
		</Inheritable>

		<Inheritable bind:isInheriting={inheritAvatar} disableToggle={!canToggleInheritance}>
			<TokenPropertyAvatar bind:avatar />
		</Inheritable>

		<Inheritable bind:isInheriting={inheritSize} disableToggle={!canToggleInheritance}>
			<Input name="size" bind:value={size} type="number" placeholder="Size..." size="small" />
		</Inheritable>

		<Inheritable bind:isInheriting={inheritInitiaveModifier} disableToggle={!canToggleInheritance}>
			<Input
				name="initiative-modifier"
				bind:value={initiativeModifier}
				type="number"
				placeholder="Initiative Modifier..."
				size="small"
			/>
		</Inheritable>
	</Column>
</Container>
