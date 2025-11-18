// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import swagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';
import appConfig from '../config/config';

export default fp(async function (fastify, opts) {
	await fastify.register(swagger, appConfig.swagger);

	await fastify.register(fastifySwaggerUi, {
		routePrefix: '/documentation',
		uiConfig: {
			docExpansion: 'none'
		}
	});
});
