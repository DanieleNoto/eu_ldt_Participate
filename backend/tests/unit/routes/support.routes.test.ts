// Test coverage for support routes

// Mock the controller before any imports
const mockSupportController = {
	send: jest.fn()
};

jest.mock('../../../src/controllers/support.controller', () => mockSupportController);

// Mock the schemas
jest.mock('../../../src/schemas/chat.schema', () => ({
	SupportRequestSchema: { type: 'object' },
	SupportResponseSchema: { type: 'object' }
}));

import { FastifyInstance } from 'fastify';

describe('Support Routes', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	let supportRoutes: any;

	beforeAll(() => {
		// Import after mocks are set up
		supportRoutes = require('../../../src/routes/support.routes').default;
	});

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			route: jest.fn()
		} as any;
	});

	test('should register support routes', () => {
		// Verify that the support routes function executes without errors
		expect(() => supportRoutes(mockFastify)).not.toThrow();

		// Verify that the route method was called
		expect(mockFastify.route).toHaveBeenCalledTimes(1);
		expect(mockFastify.route).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'POST',
				url: '/support/send',
				handler: expect.any(Function)
			})
		);
	});

	test('should configure route with proper schema', () => {
		supportRoutes(mockFastify);

		const routeCall = mockFastify.route.mock.calls[0][0];
		expect(routeCall.method).toBe('POST');
		expect(routeCall.url).toBe('/support/send');
		expect(routeCall.schema).toEqual({
			body: { type: 'object' },
			response: { 200: { type: 'object' } }
		});
	});
});
