// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import { FastifyInstance } from 'fastify';
import { startupRoute } from '../../../src/utils/startup-routes';

describe('Startup Routes Utils', () => {
	let mockApp: jest.Mocked<FastifyInstance>;

	beforeEach(() => {
		mockApp = {
			withTypeProvider: jest.fn().mockReturnThis()
		} as any;
	});

	describe('startupRoute', () => {
		test('should call withTypeProvider on the app instance', () => {
			startupRoute(mockApp);

			expect(mockApp.withTypeProvider).toHaveBeenCalledTimes(1);
		});

		test('should apply ZodTypeProvider configuration', () => {
			startupRoute(mockApp);

			expect(mockApp.withTypeProvider).toHaveBeenCalledWith();
		});

		test('should handle multiple calls gracefully', () => {
			startupRoute(mockApp);
			startupRoute(mockApp);

			expect(mockApp.withTypeProvider).toHaveBeenCalledTimes(2);
		});
	});
});
