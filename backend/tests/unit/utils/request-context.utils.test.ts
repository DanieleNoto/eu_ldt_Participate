// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Test coverage for request context utilities
import { getRequestContext } from '../../../src/utils/request-context.utils';
import { requestContext, RequestContextData } from '@fastify/request-context';

// Mock the request context
jest.mock('@fastify/request-context', () => ({
	requestContext: {
		getStore: jest.fn()
	}
}));

describe('Request Context Utils', () => {
	const mockRequestContext = requestContext as jest.Mocked<typeof requestContext>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getRequestContext', () => {
		test('should return request context data when store exists', () => {
			const mockStore: RequestContextData = {
				user: { author: 'testuser' },
				author: 'testuser',
				sid: 'req-456',
				i18n: {} as any
			};
			mockRequestContext.getStore.mockReturnValue(mockStore);

			const result = getRequestContext();

			expect(result).toBe(mockStore);
			expect(mockRequestContext.getStore).toHaveBeenCalledTimes(1);
		});

		test('should return undefined when no store exists', () => {
			mockRequestContext.getStore.mockReturnValue(undefined);

			const result = getRequestContext();

			expect(result).toBeUndefined();
			expect(mockRequestContext.getStore).toHaveBeenCalledTimes(1);
		});

		test('should cast return value as RequestContextData', () => {
			const mockStore = { someProperty: 'value' };
			mockRequestContext.getStore.mockReturnValue(mockStore as any);

			const result = getRequestContext();

			expect(result).toBe(mockStore);
			expect(mockRequestContext.getStore).toHaveBeenCalledTimes(1);
		});
	});
});
