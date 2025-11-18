// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
//   # Pierluigi Spedicato
import { exit } from 'process';
import { DataType } from 'sequelize-typescript';
import { sequelize } from '../config/database';
import logger from './logger';

const needSync = async () => {
	const [[exists]] = await sequelize.query(`
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = '${process.env.DB_SCHEMA}'
		  AND table_name = 'case'
		LIMIT 1
	  `);

	return !exists;
};
export const createDBConnection = async () => {
	// Construct database URL for logging
	const dbHost = process.env.DB_HOST ?? 'localhost';
	const dbPort = process.env.DB_PORT ?? '5432';
	const dbUsername = process.env.DB_USERNAME ?? 'postgres';
	const dbName = process.env.DB_NAME ?? 'postgres';
	const constructedDatabaseURL = `postgres://${dbUsername}:***@${dbHost}:${dbPort}/${dbName}`;

	logger.info({ msg: 'Trying to connect to the database...', config: constructedDatabaseURL });
	try {
		logger.info('Authenticating database connection...');
		await sequelize.authenticate();
		logger.info('Database connection established successfully');

		// Create schema if it doesn't exist (for non-public schemas)
		const dbSchema = process.env.DB_SCHEMA || 'public';
		if (dbSchema !== 'public') {
			logger.info(`Ensuring schema '${dbSchema}' exists...`);
			await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${dbSchema}"`);
			logger.info(`Schema '${dbSchema}' is ready`);
		}

		const executeSync = await needSync();
		if (executeSync) {
			logger.info('Syncing database schema...');
			logger.info('start database sync');
			await sequelize.sync({
				force: false,
				alter: true,
				hooks: false
			});
			logger.info('end database sync');
		}

		logger.info('Database connection established successfully.');
	} catch (error) {
		logger.error({ msg: 'Unable to connect to the database:', error });
		exit(1);
	}
};

export const isSQLite = false; // Always postgres
export const ofString = DataType.ARRAY(DataType.STRING); // Always use postgres array type
