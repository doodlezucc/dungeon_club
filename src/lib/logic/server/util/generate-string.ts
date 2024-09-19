const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const digits = '0123456789';

const allLettersAndDigits = [uppercase, lowercase, digits].join('');
const similarCharacters = /[1lI0O]/gm;

const defaultAllowedCharacters = allLettersAndDigits.replaceAll(similarCharacters, '');

export interface GenerateIDOptions {
	/**
	 * Defaults to uppercase and lowercase letters (latin alphabet) and digits,
	 * EXCLUDING similar characters such as `1`, `I` and `l`.
	 */
	allowedCharacters?: string;

	length: number;
}

export interface GenerateUniqueStringOptions<T> extends GenerateIDOptions {
	map?: (id: string) => T;
	doesExist: (suggestion: T) => Promise<boolean>;
}

export async function generateUniqueString<T = string>(
	options: GenerateUniqueStringOptions<T>
): Promise<T> {
	const { map, doesExist } = options;

	for (let i = 0; i < 100; i++) {
		const id = generateID(options);
		const mapped = map ? map(id) : (id as T);

		const alreadyExists = await doesExist(mapped);

		if (!alreadyExists) {
			return mapped;
		}
	}

	throw 'No unique IDs found after 100 tries';
}

function generateID(options: GenerateIDOptions): string {
	const { length } = options;

	const pool = options.allowedCharacters ?? defaultAllowedCharacters;

	function randomCharacter() {
		return pool[Math.floor(Math.random() * pool.length)];
	}

	let result = '';

	for (let i = 0; i < length; i++) {
		result += randomCharacter();
	}

	return result;
}
