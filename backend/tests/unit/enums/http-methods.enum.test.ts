import { HttpMethod } from '../../../src/enums/http-methods.enum';

describe('HttpMethod Enum', () => {
	describe('enum values', () => {
		test('should have GET method', () => {
			expect(HttpMethod.GET).toBe('GET');
		});

		test('should have POST method', () => {
			expect(HttpMethod.POST).toBe('POST');
		});

		test('should only contain GET and POST methods', () => {
			const methods = Object.values(HttpMethod);
			expect(methods).toHaveLength(2);
			expect(methods).toContain('GET');
			expect(methods).toContain('POST');
		});

		test('should have correct enum keys', () => {
			const keys = Object.keys(HttpMethod);
			expect(keys).toContain('GET');
			expect(keys).toContain('POST');
		});
	});

	describe('enum type safety', () => {
		test('should be assignable to string', () => {
			const method: string = HttpMethod.GET;
			expect(method).toBe('GET');
		});

		test('should work in conditional statements', () => {
			const testMethod = HttpMethod.POST;

			if (testMethod === HttpMethod.POST) {
				expect(testMethod).toBe('POST');
			} else {
				fail('Should match POST method');
			}
		});

		test('should work with GET in switch statements', () => {
			const testMethod = HttpMethod.GET;
			let result = '';

			if (testMethod === HttpMethod.GET) {
				result = 'GET operation';
			} else {
				result = 'Unknown operation';
			}

			expect(result).toBe('GET operation');
		});

		test('should work with POST in switch statements', () => {
			const testMethod = HttpMethod.POST;
			let result = '';

			if (testMethod === HttpMethod.POST) {
				result = 'POST operation';
			} else {
				result = 'Unknown operation';
			}

			expect(result).toBe('POST operation');
		});
	});
});
