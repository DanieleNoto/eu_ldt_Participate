// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import { Dialect } from 'sequelize';
import { Model, Sequelize } from 'sequelize-typescript';
import logger from '../utils/logger';

const modelsPath = path.join(__dirname, '../models/entities/*.model.*');

const modelMatch = (filename: any, member: any) => {
	return member.prototype instanceof Model;
};

export const createDatabaseConnection = () => {
	const storage = process.env.DATABASE_STORAGE || undefined;

	if (storage) {
		return createInMemoryDB(storage, (process.env.DB_DIALECT || 'sqlite') as Dialect);
	}

	const options = {
		dialect: (process.env.DB_DIALECT || 'postgres') as Dialect,
		host: process.env.DATABASE_HOST || process.env.DB_HOST,
		username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME,
		password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD,
		port: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : 5432,
		database: process.env.DATABASE_NAME || process.env.DB_NAME,
		pool: {
			max: process.env.DB_MAX_POOL ? Number.parseInt(process.env.DB_MAX_POOL, 10) : 10,
			min: process.env.DB_MIN_POOL ? Number.parseInt(process.env.DB_MIN_POOL, 10) : 2,
			idle: process.env.DB_IDLE_POOL ? Number.parseInt(process.env.DB_IDLE_POOL, 10) : 10000,
			acquire: process.env.DB_ACQUIRE_POOL ? Number.parseInt(process.env.DB_ACQUIRE_POOL, 10) : 60000,
			evict: process.env.DB_EVICT_POOL ? Number.parseInt(process.env.DB_EVICT_POOL, 10) : 1000
		},
		define: {
			schema: process.env.DB_SCHEMA || 'public'
		},
		logging: process.env.NODE_ENV === 'development' ? logger.debug : false,
		// show time execution of queries
		benchmark: true,
		models: [modelsPath],
		modelMatch
	};

	return new Sequelize(options);
};

export const createInMemoryDB = (storage?: string, dialect?: Dialect) => {
	return new Sequelize({
		dialect,
		storage,
		pool: {
			max: process.env.DB_MAX_POOL ? Number.parseInt(process.env.DB_MAX_POOL, 10) : 10,
			min: process.env.DB_MIN_POOL ? Number.parseInt(process.env.DB_MIN_POOL, 10) : 2,
			idle: process.env.DB_IDLE_POOL ? Number.parseInt(process.env.DB_IDLE_POOL, 10) : 10000
		},
		logging: i => logger.info(i),
		models: [modelsPath],
		modelMatch
	});
};

export const sequelize = createDatabaseConnection();
