import jwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import appConfig from '../config/config';
import logger from '../utils/logger';

export default fp(async (fastify, opts) => {
	fastify.register(jwt, appConfig.jwtConfig);

	fastify.addHook('onRequest', async (request, reply) => {
		try {
			if (
				request.raw.url?.startsWith('/documentation') ||
				request.raw.url?.startsWith(`${process.env.CONTEXT_URL}/health`)
			) {
				return;
			}

			if (!appConfig.jwtConfig.enable && !request.headers.authorization) {
				return;
			}

			const jwtVerify = await request.jwtVerify();
			logger.debug({ msg: 'jwtVerify: ', jwtVerify });
		} catch (err) {
			reply.send(err);
		}
	});
});
