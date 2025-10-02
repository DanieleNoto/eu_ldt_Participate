import 'fastify';
import i18next from 'i18next';
declare module 'fastify' {
	interface FastifyRequest {
		i18n: typeof i18next;
	}
}
import { i18n } from 'i18next';

declare module 'fastify' {
	interface FastifyRequest {
		i18n: i18n;
	}
}
