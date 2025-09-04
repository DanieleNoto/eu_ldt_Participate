// Test coverage for chat routes

// Mock the controller before any imports
const mockChatController = {
	chat: jest.fn()
};

jest.mock('../../../src/controllers/chat.controller', () => mockChatController);

// Mock the schemas
jest.mock('../../../src/schemas/chat.schema', () => ({
	ChatRequestSchema: { type: 'object' },
	ChatResponseSchema: { type: 'object' }
}));

import { FastifyInstance } from 'fastify';

describe('Chat Routes', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	let chatRoutes: any;

	beforeAll(() => {
		// Import after mocks are set up
		chatRoutes = require('../../../src/routes/chat.routes').default;
	});

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			route: jest.fn()
		} as any;
	});

	test('should register chat routes', () => {
		// Verify that the chat routes function executes without errors
		expect(() => chatRoutes(mockFastify)).not.toThrow();

		// Verify that the route method was called
		expect(mockFastify.route).toHaveBeenCalledTimes(1);
		expect(mockFastify.route).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'POST',
				url: '/chat/',
				handler: expect.any(Function)
			})
		);
	});

	test('should configure route with proper schema', () => {
		chatRoutes(mockFastify);

		const routeCall = mockFastify.route.mock.calls[0][0];
		expect(routeCall.method).toBe('POST');
		expect(routeCall.url).toBe('/chat/');
		expect(routeCall.schema).toEqual({
			body: { type: 'object' },
			response: { 200: { type: 'object' } }
		});
	});
});
