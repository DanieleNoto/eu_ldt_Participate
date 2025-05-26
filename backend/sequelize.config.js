require('dotenv').config();

module.exports = {
	development: {
		username: process.env.DB_USERNAME || 'postgres',
		password: process.env.DB_PASSWORD || 'postgres',
		database: process.env.DB_NAME || 'your_database_name',
		host: process.env.DB_HOST || '127.0.0.1',
		port: process.env.DB_PORT || 5432,
		dialect: 'postgres',
		seederStorage: process.env.SEQUELIZE_SEEDER_STORAGE || 'sequelize',
		seederStorageTableName: process.env.SEQUELIZE_SEEDER_STORAGE_TABLE_NAME || 'SequelizeData'
	},
	test: {
		username: process.env.DB_USERNAME || 'postgres',
		password: process.env.DB_PASSWORD || 'postgres',
		database: process.env.DB_NAME || 'your_test_database',
		host: process.env.DB_HOST || '127.0.0.1',
		port: process.env.DB_PORT || 5432,
		dialect: 'postgres',
		seederStorage: process.env.SEQUELIZE_SEEDER_STORAGE || 'sequelize',
		seederStorageTableName: process.env.SEQUELIZE_SEEDER_STORAGE_TABLE_NAME || 'SequelizeData'
	},
	production: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		dialect: 'postgres',
		seederStorage: process.env.SEQUELIZE_SEEDER_STORAGE || 'sequelize',
		seederStorageTableName: process.env.SEQUELIZE_SEEDER_STORAGE_TABLE_NAME || 'SequelizeData'
	}
};
