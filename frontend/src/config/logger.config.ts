// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { LevelWithSilentOrString } from 'pino';

export interface LoggerConfig {
	level: LevelWithSilentOrString;
}

export const loggerConfig: LoggerConfig = {
	level: 'info'
};
