import type { AccountSnippet } from '../snippets';
import type { DefinePrivateRequest } from './messages';

export interface AccountMessageCategory {
	login: DefinePrivateRequest<
		{
			email: string;
			password: string;
		},
		AccountSnippet
	>;

	accountCreate: DefinePrivateRequest<
		{
			email: string;
			password: string;
		},
		void
	>;

	accountResetPassword: DefinePrivateRequest<
		{
			email: string;
			password: string;
		},
		void
	>;
}
