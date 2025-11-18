// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import logger from '../../utils/logger';

interface LogErrorOptions {
	message: string;
	cause?: unknown;
	context?: Record<string, unknown>;
}

export abstract class BaseService {
	/**
	 * Standardized error logging method for services
	 * @param options - Error logging options including message, cause, and context
	 */
	protected logError(options: LogErrorOptions): void {
		const { message, cause, context = {} } = options;

		const logData: Record<string, unknown> = {
			message,
			service: this.constructor.name,
			context
		};

		if (cause) {
			logData.error =
				cause instanceof Error
					? {
							name: cause.name,
							message: cause.message,
							stack: cause.stack
						}
					: cause;
		}

		logger.error(logData);
	}

	/**
	 * Standardized info logging method for services
	 * @param message - Info message to log
	 * @param context - Additional context data
	 */
	protected logInfo(message: string, context?: Record<string, unknown>): void {
		logger.info({
			message,
			service: this.constructor.name,
			...(context && { context })
		});
	}

	/**
	 * Standardized warning logging method for services
	 * @param message - Warning message to log
	 * @param context - Additional context data
	 */
	protected logWarn(message: string, context?: Record<string, unknown>): void {
		logger.warn({
			message,
			service: this.constructor.name,
			...(context && { context })
		});
	}
}
