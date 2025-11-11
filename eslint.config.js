import { includeIgnoreFile } from '@eslint/compat';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
	includeIgnoreFile(gitignorePath),
	{
		ignores: [
			'public/decidim-packs/**',
			'decidim/decidim_application/public/**',
			'frontend/dist/**',
			'backend/dist/**',
			'node_modules/**'
		]
	}
];
