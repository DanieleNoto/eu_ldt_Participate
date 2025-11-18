// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import * as dotenv from 'dotenv';
import { PinoLoggerOptions } from 'fastify/types/logger';

dotenv.config();

// TODO [HIGH][20250205][piespedica]: Check config structure
export const getLoggerConfig: () => PinoLoggerOptions = () => {
	if (process.env.NODE_ENV === 'development') {
		return {
			level: process.env.LOGGER_LEVEL || 'info',
			transport: {
				target: 'pino-pretty',
				options: {
					ignore: 'pid,hostname'
				}
			}
		};
	}
	return {
		level: process.env.LOGGER_LEVEL || 'info'
	};
};
