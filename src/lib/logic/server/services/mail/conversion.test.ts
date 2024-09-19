import { expect, test } from 'vitest';
import { convertTemplateToHtml, defineTemplate } from './conversion';

import testLayout from './conversion.test.mjml?raw';

test('Interpolate and convert mails from MJML to HTML', async () => {
	const layout = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>
                Hello World!
              </mj-text>
              <mj-text>
                \${customText}
              </mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;

	const template = defineTemplate<{
		customText: string;
	}>(layout, 'Test Email');

	const processed = await convertTemplateToHtml(template, {
		customText: 'This is my custom text :)'
	});

	expect(processed).toContain('This is my custom text :)');
	expect(processed).not.toContain('${customText}');
});

test('Interpolate content from relative file import', async () => {
	const template = defineTemplate<{
		customText: string;
	}>(testLayout, 'Test Email');

	await convertTemplateToHtml(template, {
		customText: 'This is my custom text :)'
	});
});
