import { i18n } from 'i18next';

declare module 'fastify' {
	interface FastifyRequest {
		i18n: i18n;
	}
}
