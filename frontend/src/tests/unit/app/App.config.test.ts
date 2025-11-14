import { RUNTIME_APP_CONFIG } from '@app/App.config';

describe('RuntimeAppConfig', () => {
	beforeEach(() => {
		// Reset config before each test
		RUNTIME_APP_CONFIG['config'] = {};
	});

	describe('extend method', () => {
		it('should extend configuration with new values', async () => {
			const newConfig = {
				api: {
					baseUrl: 'https://api.example.com',
					timeout: 5000
				},
				features: {
					enableChat: true
				}
			};

			await RUNTIME_APP_CONFIG.extend(newConfig);

			expect(RUNTIME_APP_CONFIG.get('api.baseUrl')).toBe('https://api.example.com');
			expect(RUNTIME_APP_CONFIG.get('api.timeout')).toBe(5000);
			expect(RUNTIME_APP_CONFIG.get('features.enableChat')).toBe(true);
		});

		it('should replace nested objects when extending (shallow merge behavior)', async () => {
			await RUNTIME_APP_CONFIG.extend({
				api: {
					baseUrl: 'https://api.example.com',
					timeout: 5000
				}
			});

			await RUNTIME_APP_CONFIG.extend({
				api: {
					retries: 3
				},
				features: {
					enableNotifications: true
				}
			});

			// Due to shallow merge, the api object is completely replaced
			expect(RUNTIME_APP_CONFIG.get('api.baseUrl')).toBeUndefined();
			expect(RUNTIME_APP_CONFIG.get('api.timeout')).toBeUndefined();
			expect(RUNTIME_APP_CONFIG.get('api.retries')).toBe(3);
			expect(RUNTIME_APP_CONFIG.get('features.enableNotifications')).toBe(true);
		});
		it('should overwrite existing values when extending', async () => {
			await RUNTIME_APP_CONFIG.extend({
				api: {
					baseUrl: 'https://api.example.com'
				}
			});

			await RUNTIME_APP_CONFIG.extend({
				api: {
					baseUrl: 'https://api.newdomain.com'
				}
			});

			expect(RUNTIME_APP_CONFIG.get('api.baseUrl')).toBe('https://api.newdomain.com');
		});

		it('should return a resolved promise', async () => {
			const result = await RUNTIME_APP_CONFIG.extend({ test: 'value' });
			expect(result).toBeUndefined();
		});
	});

	describe('get method', () => {
		beforeEach(async () => {
			await RUNTIME_APP_CONFIG.extend({
				api: {
					baseUrl: 'https://api.example.com',
					config: {
						timeout: 5000,
						retries: 3
					}
				},
				features: {
					enableChat: true,
					enableNotifications: false
				},
				simpleValue: 'test'
			});
		});

		it('should get simple values', () => {
			expect(RUNTIME_APP_CONFIG.get('simpleValue')).toBe('test');
		});

		it('should get nested values using dot notation', () => {
			expect(RUNTIME_APP_CONFIG.get('api.baseUrl')).toBe('https://api.example.com');
			expect(RUNTIME_APP_CONFIG.get('api.config.timeout')).toBe(5000);
			expect(RUNTIME_APP_CONFIG.get('api.config.retries')).toBe(3);
			expect(RUNTIME_APP_CONFIG.get('features.enableChat')).toBe(true);
		});

		it('should return undefined for non-existent keys', () => {
			expect(RUNTIME_APP_CONFIG.get('nonexistent')).toBeUndefined();
			expect(RUNTIME_APP_CONFIG.get('api.nonexistent')).toBeUndefined();
			expect(RUNTIME_APP_CONFIG.get('api.config.nonexistent')).toBeUndefined();
		});

		it('should return undefined for empty string key', () => {
			expect(RUNTIME_APP_CONFIG.get('')).toBeUndefined();
		});
		it('should handle deeply nested paths', () => {
			RUNTIME_APP_CONFIG.set('very.deeply.nested.value', 'found');
			expect(RUNTIME_APP_CONFIG.get('very.deeply.nested.value')).toBe('found');
		});
	});

	describe('getAll method', () => {
		it('should return empty object when no config is set', () => {
			expect(RUNTIME_APP_CONFIG.getAll()).toEqual({});
		});

		it('should return complete configuration object', async () => {
			const config = {
				api: { baseUrl: 'https://api.example.com' },
				features: { enableChat: true }
			};

			await RUNTIME_APP_CONFIG.extend(config);

			expect(RUNTIME_APP_CONFIG.getAll()).toEqual(config);
		});

		it('should return a copy of the configuration', async () => {
			await RUNTIME_APP_CONFIG.extend({ test: 'value' });

			const config = RUNTIME_APP_CONFIG.getAll();
			config.test = 'modified';

			expect(RUNTIME_APP_CONFIG.get('test')).toBe('value');
		});
	});

	describe('set method', () => {
		it('should set simple values', () => {
			RUNTIME_APP_CONFIG.set('simpleKey', 'simpleValue');
			expect(RUNTIME_APP_CONFIG.get('simpleKey')).toBe('simpleValue');
		});

		it('should set nested values using dot notation', () => {
			RUNTIME_APP_CONFIG.set('api.baseUrl', 'https://api.example.com');
			RUNTIME_APP_CONFIG.set('api.config.timeout', 5000);

			expect(RUNTIME_APP_CONFIG.get('api.baseUrl')).toBe('https://api.example.com');
			expect(RUNTIME_APP_CONFIG.get('api.config.timeout')).toBe(5000);
		});

		it('should create nested objects when they do not exist', () => {
			RUNTIME_APP_CONFIG.set('deep.nested.value', 'test');

			expect(RUNTIME_APP_CONFIG.get('deep.nested.value')).toBe('test');
			expect(typeof RUNTIME_APP_CONFIG.get('deep')).toBe('object');
			expect(typeof RUNTIME_APP_CONFIG.get('deep.nested')).toBe('object');
		});

		it('should overwrite existing values', () => {
			RUNTIME_APP_CONFIG.set('key', 'originalValue');
			expect(RUNTIME_APP_CONFIG.get('key')).toBe('originalValue');

			RUNTIME_APP_CONFIG.set('key', 'newValue');
			expect(RUNTIME_APP_CONFIG.get('key')).toBe('newValue');
		});

		it('should handle different data types', () => {
			RUNTIME_APP_CONFIG.set('string', 'text');
			RUNTIME_APP_CONFIG.set('number', 42);
			RUNTIME_APP_CONFIG.set('boolean', true);
			RUNTIME_APP_CONFIG.set('array', [1, 2, 3]);
			RUNTIME_APP_CONFIG.set('object', { nested: 'value' });
			RUNTIME_APP_CONFIG.set('null', null);

			expect(RUNTIME_APP_CONFIG.get('string')).toBe('text');
			expect(RUNTIME_APP_CONFIG.get('number')).toBe(42);
			expect(RUNTIME_APP_CONFIG.get('boolean')).toBe(true);
			expect(RUNTIME_APP_CONFIG.get('array')).toEqual([1, 2, 3]);
			expect(RUNTIME_APP_CONFIG.get('object')).toEqual({ nested: 'value' });
			expect(RUNTIME_APP_CONFIG.get('null')).toBeNull();
		});
	});

	describe('integration tests', () => {
		it('should handle complex configuration scenarios', async () => {
			// Initial setup
			await RUNTIME_APP_CONFIG.extend({
				api: {
					baseUrl: 'https://api.example.com',
					endpoints: {
						users: '/users',
						posts: '/posts'
					}
				}
			});

			// Update specific values using set (which preserves nested structure)
			RUNTIME_APP_CONFIG.set('api.timeout', 10000);
			RUNTIME_APP_CONFIG.set('api.endpoints.comments', '/comments');

			// Add new top-level config
			await RUNTIME_APP_CONFIG.extend({
				ui: {
					theme: 'dark',
					language: 'en'
				}
			});

			// Verify all values
			expect(RUNTIME_APP_CONFIG.get('api.baseUrl')).toBe('https://api.example.com');
			expect(RUNTIME_APP_CONFIG.get('api.timeout')).toBe(10000);
			expect(RUNTIME_APP_CONFIG.get('api.endpoints.users')).toBe('/users');
			expect(RUNTIME_APP_CONFIG.get('api.endpoints.comments')).toBe('/comments');
			expect(RUNTIME_APP_CONFIG.get('ui.theme')).toBe('dark');
			expect(RUNTIME_APP_CONFIG.get('ui.language')).toBe('en');
		});

		it('should demonstrate extend vs set behavior', async () => {
			// Set up initial config
			await RUNTIME_APP_CONFIG.extend({
				api: {
					baseUrl: 'https://api.example.com',
					timeout: 5000
				}
			});

			// Using extend replaces the entire api object
			await RUNTIME_APP_CONFIG.extend({
				api: {
					retries: 3
				}
			});

			expect(RUNTIME_APP_CONFIG.get('api.baseUrl')).toBeUndefined(); // Lost due to shallow merge
			expect(RUNTIME_APP_CONFIG.get('api.timeout')).toBeUndefined(); // Lost due to shallow merge
			expect(RUNTIME_APP_CONFIG.get('api.retries')).toBe(3);

			// Reset and use set method instead
			await RUNTIME_APP_CONFIG.extend({
				api: {
					baseUrl: 'https://api.example.com',
					timeout: 5000
				}
			});

			// Using set preserves existing nested values
			RUNTIME_APP_CONFIG.set('api.retries', 3);

			expect(RUNTIME_APP_CONFIG.get('api.baseUrl')).toBe('https://api.example.com'); // Preserved
			expect(RUNTIME_APP_CONFIG.get('api.timeout')).toBe(5000); // Preserved
			expect(RUNTIME_APP_CONFIG.get('api.retries')).toBe(3); // Added
		});
	});
});
