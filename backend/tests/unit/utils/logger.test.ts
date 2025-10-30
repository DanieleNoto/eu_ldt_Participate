// Test coverage for logger utility
import { FastifyRequest, FastifyReply } from 'fastify';
import { formatLog } from '../../../src/utils/logger';

// Mock pino and config
jest.mock('pino', () =>
	jest.fn(() => ({
		info: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
		warn: jest.fn()
	}))
);

jest.mock('../../../src/config/config', () => ({
	logger: { level: 'info' }
}));

describe('Logger Utils', () => {
	test('should create formatLog function', () => {
		expect(typeof formatLog).toBe('function');
	});

	test('should format log with request and reply', () => {
		const mockRequest = {
			id: 'req-123',
			method: 'GET',
			url: '/test',
			routeOptions: { url: '/test' },
			headers: { 'user-agent': 'test-agent' }
		} as FastifyRequest;

		const mockReply = {
			statusCode: 200
		} as FastifyReply;

		const result = formatLog(mockRequest, mockReply, 'info', 'Test message');

		expect(result).toMatchObject({
			request_id: 'req-123',
			response_status: 200,
			message: 'Test message',
			event: {
				http_verb: 'GET',
				path: '/test'
			}
		});
	});

	test('should handle missing user agent in headers', () => {
		const mockRequest = {
			id: 'req-456',
			method: 'POST',
			url: '/api/test',
			routeOptions: { url: '/api/test' },
			headers: {}
		} as FastifyRequest;

		const mockReply = {
			statusCode: 201
		} as FastifyReply;

		const result = formatLog(mockRequest, mockReply, 'info', 'Test message');

		expect(result.event.details.user_agent).toBe('unknown');
	});
});
