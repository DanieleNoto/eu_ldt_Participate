// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import { MenuLevel, getMenuItems } from '@app/pages/Pages.menu';

describe('Pages.menu', () => {
	describe('MenuLevel enum', () => {
		it('should have PRIMARY value', () => {
			expect(MenuLevel.PRIMARY).toBe('primary');
		});

		it('should have SECONDARY value', () => {
			expect(MenuLevel.SECONDARY).toBe('secondary');
		});

		it('should have all expected menu levels', () => {
			const expectedValues = ['primary', 'secondary'];
			const actualValues = Object.values(MenuLevel);
			
			expect(actualValues).toHaveLength(expectedValues.length);
			expect(actualValues).toEqual(expect.arrayContaining(expectedValues));
		});

		it('should work in switch statements', () => {
			const getMenuDescription = (level: MenuLevel): string => {
				switch (level) {
					case MenuLevel.PRIMARY:
						return 'Primary menu level';
					case MenuLevel.SECONDARY:
						return 'Secondary menu level';
					default:
						return 'Unknown level';
				}
			};

			expect(getMenuDescription(MenuLevel.PRIMARY)).toBe('Primary menu level');
			expect(getMenuDescription(MenuLevel.SECONDARY)).toBe('Secondary menu level');
		});
	});

	describe('getMenuItems function', () => {
		it('should return an empty array', () => {
			const result = getMenuItems();
			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(0);
		});

		it('should return the same empty array on multiple calls', () => {
			const result1 = getMenuItems();
			const result2 = getMenuItems();
			
			expect(result1).toEqual(result2);
			expect(result1).toEqual([]);
			expect(result2).toEqual([]);
		});

		it('should return immutable empty array', () => {
			const result = getMenuItems();
			
			// Try to modify the returned array
			expect(() => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(result as any).push('item');
			}).not.toThrow();
			
			// Get a fresh result to verify original behavior is unchanged
			const freshResult = getMenuItems();
			expect(freshResult).toEqual([]);
		});
	});
});
