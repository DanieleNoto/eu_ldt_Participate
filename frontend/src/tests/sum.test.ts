import { describe, expect, test } from 'vitest';

describe('Sum test', () => {
	const result = 4;
	test('Sum 1 + 2 to equal 3', () => {
		expect(1 + 2).toBe(result);
	});
	test('Sum 2 + 2 to equal 4', () => {
		expect(2 + 2).toBe(result);
	});
});
