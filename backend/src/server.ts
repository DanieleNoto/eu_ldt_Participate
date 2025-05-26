import * as fs from 'node:fs';
import { FastifyBaseLogger } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { build } from './app';
import appConfig from './config/config';
import { createDBConnection, runSeeders } from './utils/database';
import logger from './utils/logger';

const start = async () => {
	let app;

	try {
		// M. Funaro:
		// IMPORTANT: Do not change the order of these executions! database connection must be established before app creation!
		// Otherwise, the app automation logic will not work properly.
		await createDBConnection();
		await runSeeders();

		app = await build({
			requestIdLogLabel: 'transactionId',
			genReqId: req => uuidv4(),
			loggerInstance: logger as FastifyBaseLogger
		});

		await app.ready();
		app.log.debug('Registered routes: ');
		app.log.debug(app.printRoutes());
		const swagger = app.swagger({ yaml: true });

		if (process.env.SWAGGER_GEN_DOC_FILE === 'true') {
			try {
				fs.writeFileSync('./api_documentation.yml', swagger);
				app.log.info('Swagger API doc generated');
			} catch (error) {
				app.log.error('Swagger API doc generation failed:', error);
			}
		}

		await app.listen({ port: appConfig.port, host: '0.0.0.0' });
		app.log.info(`Server running on port ${appConfig.port}`);
	} catch (err) {
		app?.log.error(err);
		process.exit(1);
	}
};

start();
