import mjml2html from 'mjml';

export interface MailTemplate<P> {
	subject: string;
	mjmlLayout: string;
	defaultParams: Partial<P>;
}

export function defineTemplate<P>(mjmlLayout: string, subject: string): MailTemplate<P> {
	return {
		subject,
		mjmlLayout,
		defaultParams: {}
	};
}

function interpolateTemplate<P>(template: MailTemplate<P>, params: P) {
	const rawLayout = template.mjmlLayout;
	let interpolated = rawLayout;

	for (const key in params) {
		const variable = '${' + key + '}';
		const value = params[key];

		interpolated = interpolated.replaceAll(variable, `${value}`);
	}

	if (interpolated.includes('${')) {
		throw `Not all variables have been interpolated.\n${interpolated}`;
	}

	return interpolated;
}

export async function convertTemplateToHtml<P>(template: MailTemplate<P>, params: P) {
	const preprocessed = interpolateTemplate(template, params);

	try {
		const results = await mjml2html(preprocessed);
		return results.html;
	} catch (err) {
		console.error('Failed to process MJML. Interpolated template:');
		console.error(preprocessed);
		throw err;
	}
}
