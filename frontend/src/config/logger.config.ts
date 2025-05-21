import { LevelWithSilentOrString } from 'pino';

export interface LoggerConfig {
	level: LevelWithSilentOrString;
}

export const loggerConfig: LoggerConfig = {
	level: 'info'
};
