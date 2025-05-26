import { id, nop } from '@app/utils/functions';

describe('functions.ts', () => {
	test('id should return a string starting with "id-" and be unique', () => {
		const uniqueId = id();
		expect(uniqueId).toMatch(/^id-/);
		// Check that subsequent calls return a different id
		const anotherId = id();
		expect(anotherId).not.toBe(uniqueId);
	});

	test('nop should do nothing and return undefined', () => {
		expect(nop()).toBeUndefined();
	});
});
