import logger from '../../utils/logger';
import GenericMessage from '../../models/generic-message.model';

export abstract class BaseService {
	/**
	 * Logs an info message.
	 */
	protected logInfo(genericMessage: GenericMessage) {
		logger.info({ message: genericMessage.message, data: genericMessage.data });
	}

	/**
	 * Logs a warning message.
	 */
	protected logWarning(genericMessage: GenericMessage) {
		logger.warn({ message: genericMessage.message, data: genericMessage.data });
	}

	/**
	 * Logs an error message.
	 */
	protected logError(genericMessage: GenericMessage) {
		logger.error({
			message: genericMessage.message,
			error: genericMessage.cause
		});
	}
}
