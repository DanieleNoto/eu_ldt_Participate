import toInteger from '@app/utils/lib/toInteger';

describe('toInteger', () => {
	test('should convert valid numbers to integer', () => {
		expect(toInteger(4.7)).toBe(4);
		expect(toInteger(4.3)).toBe(4);
		expect(toInteger(-4.7)).toBe(-4);
		expect(toInteger(-4.3)).toBe(-4);
	});

	test('should convert string numbers to integer', () => {
		expect(toInteger('5.9')).toBe(5);
		expect(toInteger('-5.9')).toBe(-5);
	});

	test('should return NaN for invalid values', () => {
		expect(toInteger(null)).toBeNaN();
		expect(toInteger(true)).toBeNaN();
		expect(toInteger(false)).toBeNaN();
		expect(toInteger('not a number')).toBeNaN();
	});
});
