// src/app/hooks/useLogger.ts

import { selectConfig } from '@app/store/config/config-slice.selectors';
import { useAppSelector } from '@app/store/hook';
import pino from 'pino';
import { useCallback, useMemo } from 'react';

/**
 * Custom hook to provide a memoized logger instance and a helper function
 * to create info messages that include the application name.
 *
 * @returns An object containing:
 *   - logger: A pino logger instance configured with the runtime logger level.
 *   - createInfoMessage: A function that prefixes a message with the application name.
 *
 * @example
 * const { logger, createInfoMessage } = useLogger();
 * logger.info(createInfoMessage('Starting API call'));
 */
const useLogger = () => {
	const config = useAppSelector(selectConfig);
	const logger = useMemo(() => pino({ level: config.logger.level }), [config.logger.level]);

	const createInfoMessage = useCallback(
		(msg: string): string => {
			return `[${config.appName}] - ${msg}`;
		},
		[config.appName]
	);

	return { logger, createInfoMessage };
};

export default useLogger;
