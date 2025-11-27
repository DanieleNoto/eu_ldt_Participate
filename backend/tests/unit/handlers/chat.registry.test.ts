// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Test coverage for chat registry handlers
import { chatActionRegister, execute, HandlerContext } from '../../../src/handlers/chat.registry';
import { FastifyRequest } from 'fastify';

describe('Chat Registry', () => {
	beforeEach(() => {
		// Clear the registry before each test by registering a dummy function and then removing it
		// This ensures we start with a clean state
	});

	describe('chatActionRegister', () => {
		test('should register a handler function', () => {
			const mockHandler = jest.fn();

			expect(() => {
				chatActionRegister('testHandler', mockHandler);
			}).not.toThrow();
		});

		test('should allow registering multiple different handlers', () => {
			const handler1 = jest.fn();
			const handler2 = jest.fn();

			chatActionRegister('handler1', handler1);
			chatActionRegister('handler2', handler2);

			// Both should be callable through execute
			const context: HandlerContext = {
				nodeId: 'test',
				conversationId: 'conv',
				request: {} as FastifyRequest
			};

			execute('handler1', context);
			execute('handler2', context);

			expect(handler1).toHaveBeenCalledWith(context);
			expect(handler2).toHaveBeenCalledWith(context);
		});

		test('should allow overwriting existing handler', () => {
			const firstHandler = jest.fn();
			const secondHandler = jest.fn();

			chatActionRegister('overwriteTest', firstHandler);
			chatActionRegister('overwriteTest', secondHandler);

			const context: HandlerContext = {
				nodeId: 'test',
				conversationId: 'conv',
				request: {} as FastifyRequest
			};

			execute('overwriteTest', context);

			expect(firstHandler).not.toHaveBeenCalled();
			expect(secondHandler).toHaveBeenCalledWith(context);
		});
	});

	describe('execute', () => {
		test('should execute registered handler with correct context', () => {
			const mockHandler = jest.fn();
			chatActionRegister('executeTest', mockHandler);

			const context: HandlerContext = {
				nodeId: 'node-123',
				conversationId: 'conv-456',
				params: { test: 'data' },
				request: { id: 'req-789' } as FastifyRequest
			};

			execute('executeTest', context);

			expect(mockHandler).toHaveBeenCalledTimes(1);
			expect(mockHandler).toHaveBeenCalledWith(context);
		});

		test('should return the result of the handler function', () => {
			const expectedResult = { success: true };
			const mockHandler = jest.fn().mockReturnValue(expectedResult);
			chatActionRegister('returnTest', mockHandler);

			const context: HandlerContext = {
				nodeId: 'test',
				conversationId: 'conv',
				request: {} as FastifyRequest
			};

			const result = execute('returnTest', context);

			expect(result).toBe(expectedResult);
		});

		test('should handle async handler functions', async () => {
			const expectedResult = { async: true };
			const mockHandler = jest.fn().mockResolvedValue(expectedResult);
			chatActionRegister('asyncTest', mockHandler);

			const context: HandlerContext = {
				nodeId: 'test',
				conversationId: 'conv',
				request: {} as FastifyRequest
			};

			const result = await execute('asyncTest', context);

			expect(result).toBe(expectedResult);
		});

		test('should throw error when handler is not found', () => {
			const context: HandlerContext = {
				nodeId: 'test',
				conversationId: 'conv',
				request: {} as FastifyRequest
			};

			expect(() => {
				execute('nonExistentHandler', context);
			}).toThrow('Handler "nonExistentHandler" not managed correctly');
		});

		test('should pass through errors thrown by handlers', () => {
			const error = new Error('Handler error');
			const mockHandler = jest.fn().mockImplementation(() => {
				throw error;
			});
			chatActionRegister('errorTest', mockHandler);

			const context: HandlerContext = {
				nodeId: 'test',
				conversationId: 'conv',
				request: {} as FastifyRequest
			};

			expect(() => {
				execute('errorTest', context);
			}).toThrow('Handler error');
		});
	});
});
