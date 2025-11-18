// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
//   # Pierluigi Spedicato
// Test coverage for model utilities
import { getModelScope, findForScope } from '../../../src/utils/model.utils';
import logger from '../../../src/utils/logger';

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
	debug: jest.fn()
}));

describe('Model Utils', () => {
	let mockModel: any;
	const mockLogger = logger as jest.Mocked<typeof logger>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockModel = {
			scope: jest.fn().mockReturnThis(),
			options: {
				scopes: {
					testScope: true,
					anotherScope: true
				}
			}
		};
	});

	describe('getModelScope', () => {
		test('should return scoped model when scope is provided', () => {
			const scope = 'testScope';
			const result = getModelScope(mockModel, scope);

			expect(mockModel.scope).toHaveBeenCalledWith(scope);
			expect(result).toBe(mockModel);
		});

		test('should return original model when scope is undefined', () => {
			const result = getModelScope(mockModel, undefined);

			expect(mockModel.scope).not.toHaveBeenCalled();
			expect(result).toBe(mockModel);
		});

		test('should return original model when scope is empty string', () => {
			const result = getModelScope(mockModel, '');

			expect(mockModel.scope).not.toHaveBeenCalled();
			expect(result).toBe(mockModel);
		});

		test('should handle array scope options', () => {
			const scope = ['scope1', 'scope2'];
			const result = getModelScope(mockModel, scope);

			expect(mockModel.scope).toHaveBeenCalledWith(scope);
			expect(result).toBe(mockModel);
		});

		test('should handle scope errors and return original model', () => {
			const scope = 'invalidScope';
			mockModel.scope.mockImplementation(() => {
				throw new Error('Scope error');
			});

			const result = getModelScope(mockModel, scope);

			expect(mockModel.scope).toHaveBeenCalledWith(scope);
			expect(mockLogger.debug).toHaveBeenCalledWith(expect.any(Error));
			expect(result).toBe(mockModel);
		});
	});

	describe('findForScope', () => {
		test('should find and return scope method when field exists in model scopes', () => {
			const search = [
				{ field: 'testScope', query: ['value1'] },
				{ field: 'otherField', query: ['value2'] }
			];

			const result = findForScope(mockModel, search);

			expect(result).toEqual({ method: ['testScope', 'value1'] });
			expect(search).toHaveLength(1); // Item should be removed
			expect(search[0].field).toBe('otherField');
		});

		test('should return undefined when no matching scope is found', () => {
			const search = [
				{ field: 'nonExistentScope', query: ['value1'] },
				{ field: 'anotherNonExistent', query: ['value2'] }
			];

			const result = findForScope(mockModel, search);

			expect(result).toBeUndefined();
			expect(search).toHaveLength(2); // No items should be removed
		});

		test('should return undefined when search array is empty', () => {
			const search: any[] = [];

			const result = findForScope(mockModel, search);

			expect(result).toBeUndefined();
			expect(search).toHaveLength(0);
		});

		test('should handle default empty search parameter', () => {
			const result = findForScope(mockModel);

			expect(result).toBeUndefined();
		});

		test('should remove correct item from search array', () => {
			const search = [
				{ field: 'nonExistent', query: ['value1'] },
				{ field: 'testScope', query: ['value2'] },
				{ field: 'afterScope', query: ['value3'] }
			];

			const result = findForScope(mockModel, search);

			expect(result).toEqual({ method: ['testScope', 'value2'] });
			expect(search).toHaveLength(2);
			expect(search.find(s => s.field === 'testScope')).toBeUndefined();
			expect(search.find(s => s.field === 'nonExistent')).toBeDefined();
			expect(search.find(s => s.field === 'afterScope')).toBeDefined();
		});
	});
});
