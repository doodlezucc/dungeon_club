import type { Crypt } from '@prisma/client';
import * as crypto from 'crypto';
import normalizeEmail from 'normalize-email';

const iterations = 100000;
const keyLength = 64;
const digest = 'sha512';

/**
 * Returns a consistent hash for the specified email address.
 */
export function hashEmail(rawEmail: string) {
	const normalizedEmail = normalizeEmail(rawEmail);

	return crypto.createHash('sha256').update(normalizedEmail).digest('hex');
}

export function encryptString(rawString: string): Promise<Crypt> {
	return new Promise((resolve, reject) => {
		const salt = crypto.randomBytes(16).toString('hex');

		crypto.pbkdf2(rawString, salt, iterations, keyLength, digest, (err, derivedKey) => {
			if (err) reject(err);

			resolve(<Crypt>{
				hash: derivedKey.toString('hex'),
				salt,
				iterations,
				keyLength,
				digest
			});
		});
	});
}

export function matchAgainstCrypt(rawString: string, crypt: Crypt): Promise<boolean> {
	const { digest, hash, iterations, keyLength, salt } = crypt;

	return new Promise((resolve, reject) => {
		crypto.pbkdf2(rawString, salt, iterations, keyLength, digest, (err, derivedKey) => {
			if (err) reject(err);

			resolve(hash === derivedKey.toString('hex'));
		});
	});
}
