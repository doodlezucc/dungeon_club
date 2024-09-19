import { expect, test } from 'vitest';
import { hashEmail } from './encryption';

test('produces consistent hash code for similar emails', () => {
	const hashCode1 = hashEmail('myemail@gmail.com');
	const hashCode2 = hashEmail('myemail@gmail.com');
	const hashCode3 = hashEmail('MY.email+12364@gmail.com');

	expect(hashCode1).toEqual(hashCode2);
	expect(hashCode2).toEqual(hashCode3);
});

test('produces different hash code for different emails', () => {
	const hashCode1 = hashEmail('email.1@gmail.com');
	const hashCode2 = hashEmail('email.2@gmail.com');

	expect(hashCode1).not.toEqual(hashCode2);
});
