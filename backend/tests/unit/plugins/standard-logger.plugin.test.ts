// Test coverage for standard logger plugin
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import loggingPlugin from '../../../src/plugins/standard-logger.plugin';
import { formatLog } from '../../../src/utils/logger';

// Mock the logger utility
jest.mock('../../../src/utils/logger', () => ({
	formatLog: jest.fn()
}));

describe('Standard Logger Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	let mockRequest: jest.Mocked<FastifyRequest>;
	let mockReply: jest.Mocked<FastifyReply>;
	const mockFormatLog = formatLog as jest.MockedFunction<typeof formatLog>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			addHook: jest.fn()
		} as any;

		mockRequest = {
			method: 'GET',
			url: '/test-endpoint'
		} as any;

		mockReply = {
			statusCode: 200
		} as any;
	});

	test('should register onRequest, onResponse, and onError hooks', async () => {
		await loggingPlugin(mockFastify);

		expect(mockFastify.addHook).toHaveBeenCalledTimes(3);
		expect(mockFastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
		expect(mockFastify.addHook).toHaveBeenCalledWith('onResponse', expect.any(Function));
		expect(mockFastify.addHook).toHaveBeenCalledWith('onError', expect.any(Function));
	});

	describe('onRequest hook', () => {
		test('should log incoming request with correct message', async () => {
			await loggingPlugin(mockFastify);

			// Get the onRequest hook function
			const onRequestHook = (mockFastify.addHook as jest.Mock).mock.calls.find(
				call => call[0] === 'onRequest'
			)?.[1];

			expect(onRequestHook).toBeDefined();

			// Execute the hook
			await onRequestHook(mockRequest, mockReply);

			expect(mockFormatLog).toHaveBeenCalledWith(
				mockRequest,
				mockReply,
				'info',
				'Incoming request: GET /test-endpoint'
			);
		});

		test('should log POST requests correctly', async () => {
			const postRequest = {
				method: 'POST',
				url: '/api/users'
			} as any;

			await loggingPlugin(mockFastify);

			const onRequestHook = (mockFastify.addHook as jest.Mock).mock.calls.find(
				call => call[0] === 'onRequest'
			)?.[1];

			await onRequestHook(postRequest, mockReply);

			expect(mockFormatLog).toHaveBeenCalledWith(
				postRequest,
				mockReply,
				'info',
				'Incoming request: POST /api/users'
			);
		});
	});

	describe('onResponse hook', () => {
		test('should log successful response with info level', async () => {
			const successReply = {
				statusCode: 200
			} as any;

			await loggingPlugin(mockFastify);

			const onResponseHook = (mockFastify.addHook as jest.Mock).mock.calls.find(
				call => call[0] === 'onResponse'
			)?.[1];

			expect(onResponseHook).toBeDefined();

			await onResponseHook(mockRequest, successReply);

			expect(mockFormatLog).toHaveBeenCalledWith(
				mockRequest,
				successReply,
				'info',
				'Response sent with status 200'
			);
		});

		test('should log error response with error level when status >= 400', async () => {
			const errorReply = {
				statusCode: 404
			} as any;

			await loggingPlugin(mockFastify);

			const onResponseHook = (mockFastify.addHook as jest.Mock).mock.calls.find(
				call => call[0] === 'onResponse'
			)?.[1];

			await onResponseHook(mockRequest, errorReply);

			expect(mockFormatLog).toHaveBeenCalledWith(
				mockRequest,
				errorReply,
				'error',
				'Response sent with status 404'
			);
		});

		test('should log server error response with error level', async () => {
			const serverErrorReply = {
				statusCode: 500
			} as any;

			await loggingPlugin(mockFastify);

			const onResponseHook = (mockFastify.addHook as jest.Mock).mock.calls.find(
				call => call[0] === 'onResponse'
			)?.[1];

			await onResponseHook(mockRequest, serverErrorReply);

			expect(mockFormatLog).toHaveBeenCalledWith(
				mockRequest,
				serverErrorReply,
				'error',
				'Response sent with status 500'
			);
		});

		test('should log 399 response with info level (boundary test)', async () => {
			const boundaryReply = {
				statusCode: 399
			} as any;

			await loggingPlugin(mockFastify);

			const onResponseHook = (mockFastify.addHook as jest.Mock).mock.calls.find(
				call => call[0] === 'onResponse'
			)?.[1];

			await onResponseHook(mockRequest, boundaryReply);

			expect(mockFormatLog).toHaveBeenCalledWith(
				mockRequest,
				boundaryReply,
				'info',
				'Response sent with status 399'
			);
		});
	});

	describe('onError hook', () => {
		test('should log error with error message', async () => {
			const mockError = new Error('Test error occurred');

			await loggingPlugin(mockFastify);

			const onErrorHook = (mockFastify.addHook as jest.Mock).mock.calls.find(call => call[0] === 'onError')?.[1];

			expect(onErrorHook).toBeDefined();

			await onErrorHook(mockRequest, mockReply, mockError);

			expect(mockFormatLog).toHaveBeenCalledWith(
				mockRequest,
				mockReply,
				'error',
				'Error occurred: Test error occurred',
				mockError
			);
		});

		test('should log different error messages', async () => {
			const mockError = new Error('Database connection failed');

			await loggingPlugin(mockFastify);

			const onErrorHook = (mockFastify.addHook as jest.Mock).mock.calls.find(call => call[0] === 'onError')?.[1];

			await onErrorHook(mockRequest, mockReply, mockError);

			expect(mockFormatLog).toHaveBeenCalledWith(
				mockRequest,
				mockReply,
				'error',
				'Error occurred: Database connection failed',
				mockError
			);
		});

		test('should pass error object to formatLog', async () => {
			const mockError = new Error('Validation error');
			mockError.stack = 'Error: Validation error\n  at some location';

			await loggingPlugin(mockFastify);

			const onErrorHook = (mockFastify.addHook as jest.Mock).mock.calls.find(call => call[0] === 'onError')?.[1];

			await onErrorHook(mockRequest, mockReply, mockError);

			expect(mockFormatLog).toHaveBeenCalledWith(
				mockRequest,
				mockReply,
				'error',
				'Error occurred: Validation error',
				mockError
			);

			// Verify the error object passed is the same one
			const callArgs = mockFormatLog.mock.calls[0];
			expect(callArgs[4]).toBe(mockError);
		});
	});
});
