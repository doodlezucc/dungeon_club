import { defineTemplate } from './conversion';
import layoutActivateAccount from './templates/activate-account.mjml?raw';
import layoutResetPassword from './templates/reset-password.mjml?raw';

export const TEMPLATE_ACTIVATE_ACCOUNT = defineTemplate<{
	activationCode: string;
	activationUrl: string;
}>(layoutActivateAccount, 'Confirm your email address');

export const TEMPLATE_RESET_PASSWORD = defineTemplate<{
	activationCode: string;
	activationUrl: string;
}>(layoutResetPassword, 'Reset your password');
