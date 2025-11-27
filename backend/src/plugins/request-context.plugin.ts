// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import fp from 'fastify-plugin';
import fastifyRequestContext from '@fastify/request-context';
import { i18n } from 'i18next';

declare module '@fastify/request-context' {
	interface RequestContextData {
		user: { author: string };
		author: string;
		sid: string;
		i18n: i18n;
	}
}

export default fp(async fastify => {
	fastify.register(fastifyRequestContext);

	fastify.addHook('onRequest', async request => {
		const author = (request.user as { author: string })?.author || 'system';

		request.requestContext.set('sid', request.id);
		request.requestContext.set('i18n', request.i18n);
		request.requestContext.set('user', request.user as { author: string });
		request.requestContext.set('author', author);
	});
});
