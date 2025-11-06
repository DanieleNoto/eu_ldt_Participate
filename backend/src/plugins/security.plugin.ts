/* eslint-disable prefer-arrow/prefer-arrow-functions */
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';
import appConfig from '../config/config';

export default fp(async function (fastify, opts) {
	// Conditionally disable helmet (DISABLE_HELMET=true) to avoid HTTPS upgrade / COOP issues in local Swagger
	if (process.env.DISABLE_HELMET === 'true') {
		fastify.log.warn('Helmet security headers disabled by DISABLE_HELMET env var');
	} else {
		fastify.register(helmet, {
			// Disable policies that can break local http asset loading
			contentSecurityPolicy: false,
			crossOriginOpenerPolicy: false,
			crossOriginEmbedderPolicy: false
		});
	}
	fastify.register(rateLimit, {
		...appConfig.rateLimit
	});
});
