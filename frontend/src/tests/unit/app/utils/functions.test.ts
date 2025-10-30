import { id, nop, transformObjectToArray } from '@app/utils/functions';

describe('functions utilities', () => {
	describe('id function', () => {
		it('should generate a unique string id', () => {
			const generatedId = id();
			expect(typeof generatedId).toBe('string');
			expect(generatedId).toMatch(/^id-[a-z0-9]{9}$/);
		});

		it('should generate different ids on consecutive calls', () => {
			const id1 = id();
			const id2 = id();
			expect(id1).not.toBe(id2);
		});
	});

	describe('nop function', () => {
		it('should be a function that returns void', () => {
			const result = nop();
			expect(result).toBeUndefined();
			expect(typeof nop).toBe('function');
		});
	});

	describe('transformObjectToArray function', () => {
		it('should transform object with non-empty values to array format', () => {
			const input = {
				name: 'John',
				age: 30,
				address: '',
				city: 'New York'
			};

			const result = transformObjectToArray(input);

			expect(result).toEqual([
				{ field: 'name', query: ['John'] },
				{ field: 'age', query: [30] },
				{ field: 'city', query: ['New York'] }
			]);
		});

		it('should handle empty object', () => {
			const result = transformObjectToArray({});
			expect(result).toEqual([]);
		});

		it('should filter out empty string values', () => {
			const input = {
				field1: '',
				field2: 'value',
				field3: null,
				field4: undefined
			};

			const result = transformObjectToArray(input);

			expect(result).toEqual([{ field: 'field2', query: ['value'] }]);
		});

		it('should handle object with all empty values', () => {
			const input = {
				field1: '',
				field2: null,
				field3: undefined
			};

			const result = transformObjectToArray(input);
			expect(result).toEqual([]);
		});

		it('should handle various data types', () => {
			const input = {
				string: 'test',
				number: 42,
				boolean: true,
				array: [1, 2, 3],
				object: { nested: 'value' }
			};

			const result = transformObjectToArray(input);

			expect(result).toEqual([
				{ field: 'string', query: ['test'] },
				{ field: 'number', query: [42] },
				{ field: 'boolean', query: [true] },
				{ field: 'array', query: [[1, 2, 3]] },
				{ field: 'object', query: [{ nested: 'value' }] }
			]);
		});
	});
});
