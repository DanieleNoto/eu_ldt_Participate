// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Mock logger before importing anything else
const mockLogger = {
	info: jest.fn(),
	error: jest.fn()
};

jest.mock('../../../../src/utils/logger', () => ({
	__esModule: true,
	default: mockLogger
}));

import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseController } from '../../../../src/controllers/base/base.controller';

describe('BaseController', () => {
	let mockRequest: Partial<FastifyRequest>;
	let mockReply: Partial<FastifyReply>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockRequest = {
			id: 'test-request-123',
			method: 'GET',
			url: '/test-endpoint'
		};
		mockReply = {
			send: jest.fn(),
			status: jest.fn().mockReturnThis(),
			statusCode: 200
		};
	});

	describe('execute', () => {
		it('should execute function successfully and send result', async () => {
			const mockResult = { data: 'test data', success: true };
			const mockFunction = jest.fn().mockResolvedValue(mockResult);

			await BaseController.execute({
				req: mockRequest as FastifyRequest,
				reply: mockReply as FastifyReply,
				fnc: mockFunction
			});

			expect(mockFunction).toHaveBeenCalled();
			expect(mockReply.send).toHaveBeenCalledWith(mockResult);
			expect(mockLogger.info).toHaveBeenCalledWith({
				message: 'Request processed successfully',
				request_id: 'test-request-123',
				method: 'GET',
				url: '/test-endpoint',
				status: 200
			});
		});

		it('should handle errors and send error response', async () => {
			const mockError = new Error('Test error message');
			const mockFunction = jest.fn().mockRejectedValue(mockError);

			await BaseController.execute({
				req: mockRequest as FastifyRequest,
				reply: mockReply as FastifyReply,
				fnc: mockFunction
			});

			expect(mockFunction).toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalledWith({
				message: 'Request failed',
				request_id: 'test-request-123',
				method: 'GET',
				url: '/test-endpoint',
				error: {
					name: 'Error',
					message: 'Test error message',
					stack: expect.any(String)
				}
			});
			expect(mockReply.status).toHaveBeenCalledWith(500);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: 'Internal Server Error',
				message: 'Test error message'
			});
		});

		it('should handle async function execution', async () => {
			const mockAsyncFunction = jest.fn(async () => {
				await new Promise(resolve => setTimeout(resolve, 10));
				return { async: true };
			});

			await BaseController.execute({
				req: mockRequest as FastifyRequest,
				reply: mockReply as FastifyReply,
				fnc: mockAsyncFunction
			});

			expect(mockAsyncFunction).toHaveBeenCalled();
			expect(mockReply.send).toHaveBeenCalledWith({ async: true });
		});

		it('should handle function with parameters', async () => {
			const mockFunctionWithParams = jest.fn(async (param1: string, param2: number) => {
				return { param1, param2 };
			});

			const wrappedFunction = async () => mockFunctionWithParams('test', 42);

			await BaseController.execute({
				req: mockRequest as FastifyRequest,
				reply: mockReply as FastifyReply,
				fnc: wrappedFunction
			});

			expect(mockReply.send).toHaveBeenCalledWith({ param1: 'test', param2: 42 });
		});

		it('should handle custom error types', async () => {
			class CustomError extends Error {
				constructor(message: string) {
					super(message);
					this.name = 'CustomError';
				}
			}

			const customError = new CustomError('Custom error occurred');
			const mockFunction = jest.fn().mockRejectedValue(customError);

			await BaseController.execute({
				req: mockRequest as FastifyRequest,
				reply: mockReply as FastifyReply,
				fnc: mockFunction
			});

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.objectContaining({
						name: 'CustomError',
						message: 'Custom error occurred'
					})
				})
			);
		});
	});
});
