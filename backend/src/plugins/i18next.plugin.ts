/* eslint-disable prefer-arrow/prefer-arrow-functions */
import fp from 'fastify-plugin';
import i18next from 'i18next';
import backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
// eslint-disable-next-line import/order
import path from 'path';

export default fp(async function (fastify, opts) {
	await i18next
		.use(middleware.LanguageDetector)
		.use(backend)
		.init({
			fallbackLng: 'en',
			preload: ['en'],
			backend: {
				loadPath: path.join(__dirname, '..', 'i18n', '{{lng}}', 'translation.json')
			}
		});

	fastify.decorate('i18n', i18next);

	await fastify.register(middleware.plugin, {
		i18next
	});

	fastify.addHook('onRequest', (request, reply, done) => {
		if (!request.i18n) {
			request.i18n = i18next;
		}
		done();
	});

	// fastify.addHook('onRequest', (request, reply, done) => {
	// 	// Rileva la lingua dalla request
	// 	const lng = middleware.LanguageDetector.detect(request);
	//
	// 	// Crea un'istanza i18n per questa request
	// 	request.i18n = i18next.cloneInstance();
	// 	request.i18n.changeLanguage(lng);
	//
	// 	done();
	// });
});
