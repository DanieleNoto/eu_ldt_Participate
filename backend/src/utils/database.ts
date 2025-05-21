import path from 'path';
import { exit } from 'process';
import { Sequelize } from 'sequelize';
import { DataType } from 'sequelize-typescript';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelize } from '../config/database';
import { loadScopes } from '../models/entities/scopes';
import logger from './logger';

export const createDBConnection = async () => {
	logger.info({ msg: 'Trying to connect to the database...', config: process.env.DATABASE_URL });
	try {
		logger.info('Authenticating database connection...');
		await sequelize.authenticate();
		logger.info('Database connection established successfully');

		if (process.env.DATABASE_SYNC === 'true') {
			logger.info('Syncing database schema...');
			logger.info('start database sync');
			await sequelize.sync({
				force: false,
				alter: true,
				hooks: false
			});
			logger.info('end database sync');
		}

		logger.info('start load model scopes');
		await loadScopes();
		logger.info('end load model scopes');

		logger.info('Database connection established successfully.');
	} catch (error) {
		logger.error({ msg: 'Unable to connect to the database:', error });
		exit(1);
	}
};

export const isSQLite = process.env.DB_DIALECT === 'sqlite';
export const ofString = isSQLite ? DataType.JSON : DataType.ARRAY(DataType.STRING);

export const runSeeders = async () => {
	const seeder = new Umzug({
		migrations: {
			glob: ['*.{js,ts}', { cwd: path.join(__dirname, '../../db/seeders') }],
			// eslint-disable-next-line @typescript-eslint/no-shadow
			resolve: ({ name, path, context }) => {
				const migration = require(path || '');
				logger.debug(migration);
				return {
					name,
					up: async () => migration.up(context, Sequelize),
					down: async () => migration.down(context, Sequelize)
				};
			}
		},
		context: sequelize.getQueryInterface(),
		storage: new SequelizeStorage({
			sequelize,
			modelName: process.env.SEQUELIZE_SEEDER_STORAGE_TABLE_NAME || 'SequelizeData'
		}),
		logger
	});

	const pending = await seeder.pending();
	if (pending.length === 0) {
		logger.info('No pending seeders to run.');
		return;
	}

	logger.info(`Running ${pending.length} pending seeders...`);
	await seeder.up();
	logger.info('All seeders executed.');
};
