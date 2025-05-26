const mocks = {
	logger: {
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn()
	}
};

jest.mock('../../../../src/utils/logger', () => ({
	__esModule: true,
	default: {
		info: mocks.logger.info,
		warn: mocks.logger.warn,
		error: mocks.logger.error
	}
}));

import { BaseService } from '../../../../src/services/base/base.service';

// Create a concrete implementation of the abstract class for testing
class TestBaseService extends BaseService {
	// Expose protected methods for testing
	public testLogInfo(message: string, data?: unknown) {
		this.logInfo({ message, data });
	}

	public testLogWarning(message: string, data?: unknown) {
		this.logWarning({ message, data });
	}

	public testLogError(message: string, cause?: unknown) {
		this.logError({ message, cause });
	}
}

describe('BaseService', () => {
	let service: TestBaseService;

	beforeEach(() => {
		service = new TestBaseService();
		jest.clearAllMocks();
	});

	it('should log info messages', () => {
		const message = 'Info message';
		const data = { key: 'value' };

		service.testLogInfo(message, data);

		expect(mocks.logger.info).toHaveBeenCalledWith({ message, data });
	});

	it('should log warning messages', () => {
		const message = 'Warning message';
		const data = { key: 'value' };

		service.testLogWarning(message, data);

		expect(mocks.logger.warn).toHaveBeenCalledWith({ message, data });
	});

	it('should log error messages', () => {
		const message = 'Error message';
		const cause = new Error('Test error');

		service.testLogError(message, cause);

		expect(mocks.logger.error).toHaveBeenCalledWith({ message, error: cause });
	});
});
