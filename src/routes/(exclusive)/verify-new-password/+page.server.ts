import { error } from '@sveltejs/kit';
import { server } from 'server/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const activationCode = url.searchParams.get('code');

	if (!activationCode) {
		throw error(400, 'No "code" parameter supplied in URL');
	}

	const attachedInfo = server.accountManager.passwordResetCodes.tryResolveCode(activationCode);

	if (!attachedInfo) {
		throw error(401, 'Your activation code is invalid. It might have already expired.');
	}
};
