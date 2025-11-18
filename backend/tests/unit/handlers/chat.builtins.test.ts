// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Test coverage for chat builtins handlers
import { startChatBuiltins } from '../../../src/handlers/chat.builtins';
import { chatActionRegister, HandlerContext } from '../../../src/handlers/chat.registry';
import logger from '../../../src/utils/logger';
import { FastifyRequest } from 'fastify';

// Mock dependencies
jest.mock('../../../src/handlers/chat.registry', () => ({
	chatActionRegister: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
	info: jest.fn()
}));

describe('Chat Builtins Handlers', () => {
	const mockChatActionRegister = chatActionRegister as jest.MockedFunction<typeof chatActionRegister>;
	const mockLogger = logger as jest.Mocked<typeof logger>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('startChatBuiltins', () => {
		test('should register logNode handler', async () => {
			await startChatBuiltins();

			expect(mockChatActionRegister).toHaveBeenCalledTimes(1);
			expect(mockChatActionRegister).toHaveBeenCalledWith('logNode', expect.any(Function));
		});

		test('should register handler that logs correctly', async () => {
			await startChatBuiltins();

			// Get the registered handler function
			const registeredHandler = mockChatActionRegister.mock.calls[0][1];

			// Test the handler
			const testContext: HandlerContext = {
				nodeId: 'test-node-123',
				conversationId: 'conv-456',
				request: {} as FastifyRequest
			};
			registeredHandler(testContext);

			expect(mockLogger.info).toHaveBeenCalledWith('[handler:logNode] conv=conv-456 node=test-node-123');
		});

		test('should handle handler execution with different parameters', async () => {
			await startChatBuiltins();

			const registeredHandler = mockChatActionRegister.mock.calls[0][1];

			const testContext: HandlerContext = {
				nodeId: 'another-node',
				conversationId: 'another-conv',
				request: {} as FastifyRequest
			};
			registeredHandler(testContext);

			expect(mockLogger.info).toHaveBeenCalledWith('[handler:logNode] conv=another-conv node=another-node');
		});
	});
});
