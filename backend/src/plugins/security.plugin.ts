/* eslint-disable prefer-arrow/prefer-arrow-functions */
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';
import appConfig from '../config/config';

export default fp(async function (fastify, opts) {
	fastify.register(helmet);
	fastify.register(rateLimit, {
		...appConfig.rateLimit
	});
});
