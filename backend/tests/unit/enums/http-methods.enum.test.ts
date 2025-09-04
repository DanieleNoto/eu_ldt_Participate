// Test coverage for HTTP Methods enum
import { HttpMethod } from '../../../src/enums/http-methods.enum';

describe('HttpMethod Enum', () => {
	test('should have correct GET value', () => {
		expect(HttpMethod.GET).toBe('GET');
	});

	test('should have correct POST value', () => {
		expect(HttpMethod.POST).toBe('POST');
	});

	test('should have correct PUT value', () => {
		expect(HttpMethod.PUT).toBe('PUT');
	});

	test('should have correct PATCH value', () => {
		expect(HttpMethod.PATCH).toBe('PATCH');
	});

	test('should have correct DELETE value', () => {
		expect(HttpMethod.DELETE).toBe('DELETE');
	});

	test('should have all expected methods', () => {
		const expectedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
		const actualMethods = Object.values(HttpMethod);

		expect(actualMethods).toEqual(expectedMethods);
		expect(actualMethods).toHaveLength(5);
	});

	test('should allow enum values to be used as object keys', () => {
		const methodMap = {
			[HttpMethod.GET]: 'Read operation',
			[HttpMethod.POST]: 'Create operation',
			[HttpMethod.PUT]: 'Update operation',
			[HttpMethod.PATCH]: 'Partial update operation',
			[HttpMethod.DELETE]: 'Delete operation'
		};

		expect(methodMap[HttpMethod.GET]).toBe('Read operation');
		expect(methodMap[HttpMethod.POST]).toBe('Create operation');
		expect(methodMap[HttpMethod.PUT]).toBe('Update operation');
		expect(methodMap[HttpMethod.PATCH]).toBe('Partial update operation');
		expect(methodMap[HttpMethod.DELETE]).toBe('Delete operation');
	});
});
