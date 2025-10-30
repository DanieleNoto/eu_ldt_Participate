import { fastify, FastifyInstance, FastifyServerOptions } from 'fastify';
import errorHandler from './middlewares/error-handler.middleware';
import { registerPlugin } from './plugins/register-plugin';

export const build: (opts?: FastifyServerOptions) => Promise<FastifyInstance> = async (opts?: FastifyServerOptions) => {
	const app: FastifyInstance = fastify(opts);

	try {
		app.log.info('Registering plugin...');
		await registerPlugin(app);
		app.log.info('Plugin registered successfully');
	} catch (e) {
		app.log.error({ msg: 'Error during plugin setup', e });
	}

	app.setErrorHandler(errorHandler);

	return app;
};
