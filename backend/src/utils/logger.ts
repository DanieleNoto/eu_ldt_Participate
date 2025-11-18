// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyReply, FastifyRequest } from 'fastify';
import pino from 'pino';
import packageJson from '../../package.json';
import appConfig from '../config/config';

const logger = pino({
	...appConfig.logger,
	timestamp: () => `,"timestamp":${Date.now()}`,
	formatters: {
		log: object => {
			return {
				...object,
				tool_name: packageJson.name || 'Unknown Tool',
				service_name: packageJson.description || 'Unknown Service',
				tool_version: packageJson.version || '0.0.0'
			};
		}
	}
});

const getLogDetails = (req: FastifyRequest) => {
	return {
		user_agent: req.headers['user-agent'] || 'unknown'
	};
};

/**
 * Standardized logging function.
 */
export const formatLog = (
	req: FastifyRequest,
	reply: FastifyReply,
	level: 'info' | 'error' | 'warn',
	message: string,
	error?: any
) => {
	const toLogObj = {
		request_id: req.id,
		response_status: reply.statusCode,
		error_id: error?.id ?? undefined,
		error_message: error?.message ?? undefined,
		event: {
			http_verb: req.method,
			path: req.routeOptions.url || req.url,
			details: getLogDetails(req)
		},
		source: {
			environment: process.env.NODE_ENV || 'development',
			file: req.routeOptions.url || 'unknown',
			function: req.method || 'unknown'
		},
		metrics: {
			response_time_ms: reply.elapsedTime ?? 0
		},
		message
	};

	logger[level](toLogObj);

	if (level === 'error') {
		logger.error(error);
	}

	return toLogObj;
};

export default logger;
