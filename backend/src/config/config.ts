import * as dotenv from 'dotenv';
import { PinoLoggerOptions } from 'fastify/types/logger';
import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { getLoggerConfig } from './logger';
import { swaggerConfig } from './swagger';

dotenv.config();


interface Config {
	port: number;
	nodeEnv: string;
	jwtConfig: {
		enable: boolean;
		secret: {
			public: string;
		};
	};
	cypher: { algorithm: string; seperator: string };
	logger: PinoLoggerOptions;
	swagger: FastifyDynamicSwaggerOptions;
	rateLimit: {
		max: number;
		timeWindow: string;
		global: true;
		errorResponseBuilder: (
			request: unknown,
			context: unknown
		) => {
			statusCode: number;
			error: string;
			message: string;
		};
	};
	underPressure: {
		maxEventLoopDelay: number;
		maxHeapUsedBytes: number;
		maxRssBytes: number;
		maxEventLoopUtilization: number;
	};
}

// TODO [HIGH][20250205][piespedica]: Check config structure
const appConfig: Config = {
	port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
	nodeEnv: process.env.NODE_ENV || 'development',
	// jwtSecret: process.env.JWT_SECRET || 'changeme',
	jwtConfig: {
		enable: process.env.JWT_ENABLE_CHECK === 'true',
		secret: {
			public: process.env.JWT_ISSUER_PUBKEY || 'changeme'
		}
	},
	swagger: swaggerConfig,
	cypher: { algorithm: 'aes-256-ctr', seperator: ':' },
	logger: getLoggerConfig(),
	rateLimit: {
		max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100,
		timeWindow: process.env.RATE_LIMIT_TIME_WINDOW || '1 minute',
		global: true,
		errorResponseBuilder: (request, context) => {
			return {
				statusCode: 429,
				error: 'Too Many Requests',
				message: `Rate limit exceeded, retry in ${process.env.RATE_LIMIT_TIME_WINDOW}`
			};
		}
	},
	underPressure: {
		maxEventLoopDelay: process.env.EVENT_LOOP_DELAY ? parseInt(process.env.EVENT_LOOP_DELAY, 10) : 900000,
		maxHeapUsedBytes: process.env.MAX_HEAP_USED_BYTES ? parseInt(process.env.MAX_HEAP_USED_BYTES, 10) : 90000000000,
		maxRssBytes: process.env.MAX_RSS_BYTES ? parseInt(process.env.MAX_RSS_BYTES, 10) : 90000000000,
		maxEventLoopUtilization: process.env.MAX_EVENT_LOOP_USE ? parseInt(process.env.MAX_EVENT_LOOP_USE, 10) : 0.98
	}
};

export default appConfig;
