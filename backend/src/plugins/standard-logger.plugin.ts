// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { formatLog } from '../utils/logger';

/**
 * Standard logging plugin for Fastify.
 * Logs all incoming requests and responses.
 */
const loggingPlugin = async (fastify: FastifyInstance) => {
	fastify.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
		formatLog(req, reply, 'info', `Incoming request: ${req.method} ${req.url}`);
	});

	fastify.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
		const statusCode = reply.statusCode;
		const level = statusCode >= 400 ? 'error' : 'info';

		formatLog(req, reply, level, `Response sent with status ${reply.statusCode}`);
	});

	fastify.addHook('onError', async (req: FastifyRequest, reply: FastifyReply, error) => {
		formatLog(req, reply, 'error', `Error occurred: ${error.message}`, error);
	});
};

export default fp(loggingPlugin);
