// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato

import * as fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { FastifyBaseLogger } from 'fastify';
import { build } from './app';
import appConfig from './config/config';
import { startChatBuiltins } from './handlers/chat.builtins';
import { createDBConnection } from './utils/database';
import { runMigrations, runSeeders } from './utils/database.migrations';
import logger from './utils/logger';

const start = async () => {
	let app;

	try {
		// M. Funaro:
		// IMPORTANT: Do not change the order of these executions! database connection must be established before app creation!
		// Otherwise, the app automation logic will not work properly.
		await createDBConnection();
		await runMigrations();
		await runSeeders();
		await startChatBuiltins();

		app = await build({
			requestIdLogLabel: 'transactionId',
			genReqId: req => randomUUID(),
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
				app.log.error({ msg: 'Swagger API doc generation failed', error });
			}
		}

		await app.listen({ port: appConfig.port, host: '0.0.0.0' });
		app.log.info(`Server running on port ${appConfig.port}`);
		return app;
	} catch (err) {
		app?.log.error(err);
		process.exit(1);
	}
};

start();
