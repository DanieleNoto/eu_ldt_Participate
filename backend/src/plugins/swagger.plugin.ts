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
