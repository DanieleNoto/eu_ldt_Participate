// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
require('dotenv').config();

module.exports = {
	development: {
		username: process.env.DATABASE_USERNAME || 'postgres',
		password: process.env.DATABASE_PASSWORD || 'postgres',
		database: process.env.DATABASE_NAME || 'decidim_application_development',
		host: process.env.DATABASE_HOST || '127.0.0.1',
		port: process.env.DB_PORT || 5432,
		dialect: 'postgres',
		seederStorage: process.env.SEQUELIZE_SEEDER_STORAGE || 'sequelize',
		seederStorageTableName: process.env.SEQUELIZE_SEEDER_STORAGE_TABLE_NAME || 'SequelizeData'
	},
	test: {
		username: process.env.DATABASE_USERNAME || 'postgres',
		password: process.env.DATABASE_PASSWORD || 'postgres',
		database: process.env.DATABASE_NAME || 'decidim_application_test',
		host: process.env.DATABASE_HOST || '127.0.0.1',
		port: process.env.DB_PORT || 5432,
		dialect: 'postgres',
		seederStorage: process.env.SEQUELIZE_SEEDER_STORAGE || 'sequelize',
		seederStorageTableName: process.env.SEQUELIZE_SEEDER_STORAGE_TABLE_NAME || 'SequelizeData'
	},
	production: {
		username: process.env.DATABASE_USERNAME,
		password: process.env.DATABASE_PASSWORD,
		database: process.env.DATABASE_NAME,
		host: process.env.DATABASE_HOST,
		port: process.env.DB_PORT,
		dialect: 'postgres',
		seederStorage: process.env.SEQUELIZE_SEEDER_STORAGE || 'sequelize',
		seederStorageTableName: process.env.SEQUELIZE_SEEDER_STORAGE_TABLE_NAME || 'SequelizeData'
	}
};
