// Mock logger before importing anything else
const mockLogger = {
	info: jest.fn(),
	error: jest.fn(),
	warn: jest.fn()
};

jest.mock('../../../../src/utils/logger', () => ({
	__esModule: true,
	default: mockLogger
}));

import { BaseService } from '../../../../src/services/base/base.service';

// Create a test implementation of BaseService
class TestService extends BaseService {
	// Expose protected methods for testing
	public testLogError(options: { message: string; cause?: unknown; context?: Record<string, unknown> }) {
		return this.logError(options);
	}

	public testLogInfo(message: string, context?: Record<string, unknown>) {
		return this.logInfo(message, context);
	}

	public testLogWarn(message: string, context?: Record<string, unknown>) {
		return this.logWarn(message, context);
	}
}

describe('BaseService', () => {
	let service: TestService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new TestService();
	});

	describe('logError', () => {
		it('should log error with message only', () => {
			service.testLogError({ message: 'Test error occurred' });

			expect(mockLogger.error).toHaveBeenCalledWith({
				message: 'Test error occurred',
				service: 'TestService',
				context: {}
			});
		});

		it('should log error with Error cause', () => {
			const testError = new Error('Original error');
			testError.stack = 'Error stack trace';

			service.testLogError({
				message: 'Wrapped error',
				cause: testError
			});

			expect(mockLogger.error).toHaveBeenCalledWith({
				message: 'Wrapped error',
				service: 'TestService',
				context: {},
				error: {
					name: 'Error',
					message: 'Original error',
					stack: 'Error stack trace'
				}
			});
		});

		it('should log error with non-Error cause', () => {
			service.testLogError({
				message: 'Error with string cause',
				cause: 'Simple string error'
			});

			expect(mockLogger.error).toHaveBeenCalledWith({
				message: 'Error with string cause',
				service: 'TestService',
				context: {},
				error: 'Simple string error'
			});
		});

		it('should log error with context', () => {
			service.testLogError({
				message: 'Error with context',
				context: { userId: '123', operation: 'save' }
			});

			expect(mockLogger.error).toHaveBeenCalledWith({
				message: 'Error with context',
				service: 'TestService',
				context: { userId: '123', operation: 'save' }
			});
		});

		it('should log error with all parameters', () => {
			const testError = new Error('Database connection failed');

			service.testLogError({
				message: 'Failed to connect to database',
				cause: testError,
				context: { database: 'postgres', retry: 3 }
			});

			expect(mockLogger.error).toHaveBeenCalledWith({
				message: 'Failed to connect to database',
				service: 'TestService',
				context: { database: 'postgres', retry: 3 },
				error: {
					name: 'Error',
					message: 'Database connection failed',
					stack: expect.any(String)
				}
			});
		});
	});

	describe('logInfo', () => {
		it('should log info message without context', () => {
			service.testLogInfo('Operation completed successfully');

			expect(mockLogger.info).toHaveBeenCalledWith({
				message: 'Operation completed successfully',
				service: 'TestService'
			});
		});

		it('should log info message with context', () => {
			service.testLogInfo('User logged in', { userId: '456', ip: '127.0.0.1' });

			expect(mockLogger.info).toHaveBeenCalledWith({
				message: 'User logged in',
				service: 'TestService',
				context: { userId: '456', ip: '127.0.0.1' }
			});
		});

		it('should log info with empty context object', () => {
			service.testLogInfo('Test message', {});

			expect(mockLogger.info).toHaveBeenCalledWith({
				message: 'Test message',
				service: 'TestService',
				context: {}
			});
		});
	});

	describe('logWarn', () => {
		it('should log warning message without context', () => {
			service.testLogWarn('Deprecated feature used');

			expect(mockLogger.warn).toHaveBeenCalledWith({
				message: 'Deprecated feature used',
				service: 'TestService'
			});
		});

		it('should log warning message with context', () => {
			service.testLogWarn('High memory usage detected', { memoryUsage: '85%', threshold: '80%' });

			expect(mockLogger.warn).toHaveBeenCalledWith({
				message: 'High memory usage detected',
				service: 'TestService',
				context: { memoryUsage: '85%', threshold: '80%' }
			});
		});

		it('should log warning with complex context', () => {
			service.testLogWarn('Rate limit approaching', {
				current: 950,
				limit: 1000,
				user: { id: '789', name: 'Test User' }
			});

			expect(mockLogger.warn).toHaveBeenCalledWith({
				message: 'Rate limit approaching',
				service: 'TestService',
				context: {
					current: 950,
					limit: 1000,
					user: { id: '789', name: 'Test User' }
				}
			});
		});
	});

	describe('service name in logs', () => {
		it('should use correct service name in logs', () => {
			service.testLogInfo('Testing service name');

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					service: 'TestService'
				})
			);
		});
	});
});
