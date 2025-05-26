const { includeIgnoreFile } = require('@eslint/compat');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tseslintParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const preferArrow = require('eslint-plugin-prefer-arrow');
const path = require('node:path');

const gitignorePath = path.resolve(__dirname, '.gitignore');

module.exports = [
	includeIgnoreFile(gitignorePath),

	{
		ignores: ['*.config.*', 'db/**', 'tests/**'],
		files: ['**/*.ts'],

		languageOptions: {
			parser: tseslintParser
		},
		plugins: {
			'@typescript-eslint': tseslint,
			import: importPlugin,
			'prefer-arrow': preferArrow
		},
		rules: {
			'@typescript-eslint/adjacent-overload-signatures': 'error',
			'@typescript-eslint/array-type': 'off',
			'@typescript-eslint/consistent-type-assertions': 'error',
			'@typescript-eslint/consistent-type-definitions': 'error',
			'@typescript-eslint/dot-notation': 'off',
			'@typescript-eslint/explicit-member-accessibility': [
				'off',
				{
					accessibility: 'explicit'
				}
			],
			'@typescript-eslint/interface-name-prefix': 'off',
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: ['memberLike', 'variableLike'],
					modifiers: ['private'],
					format: ['camelCase'],
					leadingUnderscore: 'require'
				}
			],
			'@typescript-eslint/member-ordering': 'error',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-empty-interface': 'error',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-inferrable-types': [
				'error',
				{
					ignoreParameters: true
				}
			],
			'@typescript-eslint/no-misused-new': 'error',
			'@typescript-eslint/no-namespace': 'error',
			'@typescript-eslint/no-non-null-assertion': 'error',
			'@typescript-eslint/no-parameter-properties': 'off',
			'@typescript-eslint/no-shadow': [
				'error',
				{
					hoist: 'all'
				}
			],
			'@typescript-eslint/no-unused-expressions': 'error',
			'@typescript-eslint/no-use-before-define': 'off',
			'@typescript-eslint/no-var-requires': 'off',
			'@typescript-eslint/prefer-for-of': 'error',
			'@typescript-eslint/prefer-function-type': 'error',
			'@typescript-eslint/prefer-namespace-keyword': 'error',
			'@typescript-eslint/triple-slash-reference': [
				'error',
				{
					path: 'always',
					types: 'prefer-import',
					lib: 'always'
				}
			],
			'@typescript-eslint/unified-signatures': 'error',
			'brace-style': ['error', '1tbs'],
			complexity: 'off',
			'constructor-super': 'error',
			eqeqeq: ['error', 'smart'],
			'guard-for-in': 'error',
			'id-blacklist': 'off',
			'id-match': 'off',
			'import/no-deprecated': 'warn',
			'import/order': [
				'error',
				{
					'newlines-between': 'never',
					groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type']
				}
			],
			'max-classes-per-file': 'off',
			'no-bitwise': 'error',
			'no-caller': 'error',
			'no-cond-assign': 'error',
			'no-console': 'warn',
			'no-debugger': 'error',
			'no-empty': 'off',
			'no-eval': 'error',
			'no-fallthrough': 'error',
			'no-invalid-this': 'off',
			'no-new-wrappers': 'error',
			'no-restricted-imports': [
				'error',
				{
					name: 'rxjs/Rx',
					message: "Please import directly from 'rxjs' instead"
				}
			],
			'no-throw-literal': 'error',
			'no-undef-init': 'error',
			'no-underscore-dangle': 'off',
			'no-unsafe-finally': 'error',
			'no-unused-labels': 'error',
			'no-var': 'error',
			'object-shorthand': 'error',
			'one-var': ['error', 'never'],
			'prefer-arrow/prefer-arrow-functions': 'warn',
			'prefer-const': 'error',
			radix: 'error',
			'use-isnan': 'error',
			'valid-typeof': 'off'
		}
	}
];
