/* eslint-disable prefer-arrow/prefer-arrow-functions */
import * as fs from 'node:fs';
import path from 'node:path';
import fp from 'fastify-plugin';
import i18next from 'i18next';

const loadTranslations = () => {
	const translations: Record<string, Record<string, Record<string, string>>> = {};
	const languages = ['en', 'es', 'fr', 'de'];

	for (const lang of languages) {
		const filePath = path.join(__dirname, '..', 'i18n', lang, 'translation.json');
		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, 'utf8');
			translations[lang] = { translation: JSON.parse(content) };
		} else {
			const devPath = path.join(__dirname, '..', '..', 'src', 'i18n', lang, 'translation.json');
			if (fs.existsSync(devPath)) {
				const content = fs.readFileSync(devPath, 'utf8');
				translations[lang] = { translation: JSON.parse(content) };
			}
		}
	}

	return translations;
};

export default fp(async function (fastify) {
	const resources = loadTranslations();

	await i18next.init({
		lng: 'en',
		fallbackLng: 'en',
		resources,
		ns: 'translation',
		defaultNS: 'translation',
		interpolation: {
			escapeValue: false
		},
		returnEmptyString: false,
		returnNull: false,
		returnObjects: false
	});

	// declare the property on the request via a declaration file so we don't need to cast to `any`
	fastify.addHook('onRequest', async request => {
		request.i18n = i18next;
	});
});
