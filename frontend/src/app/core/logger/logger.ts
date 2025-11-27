// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
// src/app/hooks/useLogger.ts

import { useConfig } from '@app/config/ConfigContext';
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
	const config = useConfig();
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
