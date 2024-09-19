import type {
	OverridableTokenProperty,
	TokenProperties,
	TokenPropertiesOrNull,
	TokenSnippet,
	TokenTemplateSnippet
} from './snippets';

// When adding overridable token properties to prisma.schema, TypeScript requires the property to be explicitly added here.
// This makes it possible to have the unique set of overridable properties as CONSTANTS, as opposed to just TYPES.
const UNIQUE_OVERRIDABLE_TOKEN_PROPERTIES: Record<OverridableTokenProperty, true> = {
	avatarId: true,
	initiativeModifier: true,
	name: true,
	size: true
};

export const ALL_OVERRIDABLE_TOKEN_PROPERTIES = Object.keys(
	UNIQUE_OVERRIDABLE_TOKEN_PROPERTIES
) as OverridableTokenProperty[];

export const EMPTY_TOKEN_PROPERTIES: TokenProperties = {
	avatarId: null,
	initiativeModifier: 0,
	name: 'Token',
	size: 1
};

export function getTemplateForToken(
	token: TokenSnippet,
	allTokenTemplates: TokenTemplateSnippet[]
) {
	if (!token.templateId) return undefined;

	return allTokenTemplates.find((template) => template.id === token.templateId);
}

/**
 * Returns a copy of `token` with all `null` properties inserted by the underlying template.
 */
export function materializeToken(
	token: TokenPropertiesOrNull,
	template?: TokenProperties
): TokenProperties {
	if (template) {
		return {
			...template,
			...extractOverriddenPropertiesFromToken(token)
		};
	} else {
		return {
			...EMPTY_TOKEN_PROPERTIES,
			...extractOverriddenPropertiesFromToken(token)
		};
	}
}

export function getInheritedPropertiesOfToken(token: TokenPropertiesOrNull) {
	const result: OverridableTokenProperty[] = [];

	for (const propertyName of ALL_OVERRIDABLE_TOKEN_PROPERTIES) {
		if (token[propertyName] === null) {
			result.push(propertyName);
		}
	}

	return result;
}

interface ExtractPropertiesOptions {
	onlyKeepNonNulls: boolean;
}

function extractPropertiesByName(
	source: TokenPropertiesOrNull,
	propertyNameFilter: OverridableTokenProperty[],
	options: ExtractPropertiesOptions
): Partial<TokenProperties> {
	const { onlyKeepNonNulls } = options;
	const extractedProperties: Partial<TokenProperties> = {};

	for (const propertyName of propertyNameFilter) {
		if (onlyKeepNonNulls && source[propertyName] === null) {
			// Skip property
			continue;
		}

		// @ts-expect-error - template[propertyName] is guaranteed to match the type, but is impossible to statically infer.
		extractedProperties[propertyName] = source[propertyName];
	}

	return extractedProperties;
}

export function extractPropertiesFromTemplate(
	template: TokenProperties,
	propertyNames: OverridableTokenProperty[]
) {
	return extractPropertiesByName(template, propertyNames, {
		onlyKeepNonNulls: false
	});
}

export function extractOverridableProperties(properties: TokenPropertiesOrNull) {
	return extractPropertiesByName(properties, ALL_OVERRIDABLE_TOKEN_PROPERTIES, {
		onlyKeepNonNulls: false
	}) as TokenPropertiesOrNull;
}

function extractOverriddenPropertiesFromToken(token: TokenPropertiesOrNull) {
	return extractPropertiesByName(token, ALL_OVERRIDABLE_TOKEN_PROPERTIES, {
		onlyKeepNonNulls: true
	});
}

export function applyTemplateInheritanceOnProperties(propertyNames: OverridableTokenProperty[]) {
	const extractedProperties: Partial<TokenPropertiesOrNull> = {};

	for (const propertyName of propertyNames) {
		extractedProperties[propertyName] = null;
	}

	return extractedProperties;
}
