import path from 'path';
import { Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelize } from '../config/database';
import logger from './logger';

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

export const runMigrations = async () => {
	const migrations = new Umzug({
		migrations: {
			glob: ['*.{js,ts}', { cwd: path.join(__dirname, '../../db/migrations') }],
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
			modelName: process.env.SEQUELIZE_MIGRATION_STORAGE_TABLE_NAME || 'SequelizeData'
		}),
		logger
	});

	const pending = await migrations.pending();
	if (pending.length === 0) {
		logger.info('No pending migrations to run.');
		return;
	}

	logger.info(`Running ${pending.length} pending migrations...`);
	await migrations.up();
	logger.info('All migrations executed.');
};
