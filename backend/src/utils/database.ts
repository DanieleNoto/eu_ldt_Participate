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
	logger.info({ msg: 'Trying to connect to the database...' });
	try {
		logger.info('Authenticating database connection...');
		await sequelize.authenticate();
		logger.info('Database connection established successfully');

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

export const isSQLite = process.env.DB_DIALECT === 'sqlite';
export const ofString = isSQLite ? DataType.JSON : DataType.ARRAY(DataType.STRING);
