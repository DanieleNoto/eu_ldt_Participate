import fs from 'fs';
import path from 'path';
import logger from '../../../utils/logger';

/**
 * Dynamically loads all scope files from a directory
 * and applies the scopes to the corresponding models
 *
 * @param models Object containing all Sequelize models
 */
export const loadScopes = async (): Promise<void> => {
	try {
		// const models = sequelize.models;

		// Reads all files in the scopes directory
		const scopesDir = path.join(__dirname, '.');
		logger.info(`Loading scopes from ${scopesDir}...`);
		const files = fs.readdirSync(scopesDir);

		// Filters only JavaScript/TypeScript files (excludes index.ts and .d.ts)
		const scopeFiles = files.filter(file => file.endsWith('.scopes.ts'));

		// Loads and applies each scope file
		for (const file of scopeFiles) {
			const filePath = path.join(scopesDir, file);
			try {
				// Dynamic import of the file
				const scopeModule = await import(filePath);
				const setupScopes = scopeModule.default;
				// const modelName = scopeDefinition.entity.name;

				if (!setupScopes /*|| !modelName*/) {
					logger.warn(`Scope file ${file} has invalid format. Skipping.`);
					continue;
				}

				// Finds the corresponding model
				/*const model: any = models[modelName];
				if (!model) {
					logger.warn(`Model ${modelName} not found for scope ${file}. Skipping.`);
					continue;
				}*/

				// Applies the scopes to the model
				setupScopes(/*scopeDefinition.entity*/);
				logger.info(`Scopes defination applied from ${file}`);
			} catch (error) {
				logger.error({ msg: `Error loading scope file ${file}:`, error });
			}
		}

		logger.info('All scopes loaded successfully');
	} catch (error) {
		logger.error({ msg: 'Error loading scopes:', error });
		throw error;
	}
};
