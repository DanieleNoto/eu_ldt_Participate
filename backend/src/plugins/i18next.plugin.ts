/* eslint-disable prefer-arrow/prefer-arrow-functions */
import * as fs from 'fs';
import path from 'path';
import fp from 'fastify-plugin';
import i18next from 'i18next';

const loadTranslations = () => {
	const translations: Record<string, Record<string, Record<string, string>>> = {};
	const languages = ['en', 'es', 'fr', 'de'];

	for (const lang of languages) {
		try {
			const filePath = path.join(__dirname, '..', 'i18n', lang, 'translation.json');
			const content = fs.readFileSync(filePath, 'utf8');
			translations[lang] = { translation: JSON.parse(content) };
		} catch (error) {
			try {
				const devPath = path.join(__dirname, '..', '..', 'src', 'i18n', lang, 'translation.json');
				const content = fs.readFileSync(devPath, 'utf8');
				translations[lang] = { translation: JSON.parse(content) };
			} catch (devError) {
				// Ignore missing translation files
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

	fastify.addHook('onRequest', async request => {
		(request as any).i18n = i18next;
	});
});
