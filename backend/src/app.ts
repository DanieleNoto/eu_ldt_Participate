import { fastify, FastifyInstance, FastifyServerOptions } from 'fastify';
import errorHandler from './middlewares/error-handler.middleware';
import { registerPlugin } from './plugins/register-plugin';

export const build: (opts?: FastifyServerOptions) => Promise<FastifyInstance> = async (opts?: FastifyServerOptions) => {
	const app: FastifyInstance = fastify(opts);
	await registerPlugin(app);

	app.setErrorHandler(errorHandler);

	return app;
};
