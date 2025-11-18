// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
//   # Pierluigi Spedicato
// Code Coverage
import { FastifyReply, FastifyRequest } from 'fastify';
import { formatLog } from '../../../src/utils/logger';

describe('Logs-check service test', () => {
	test('The two logs must match', async () => {
		const req = {
			id: 'req-123',
			method: 'GET',
			url: '/api/test',
			routeOptions: { url: '/api/test' },
			headers: {}
		} as FastifyRequest;

		const reply = {
			statusCode: 200
		} as FastifyReply;

		const log = formatLog(req, reply, 'info', `Test request: ${req.method} ${req.url}`);

		const logTest = {
			request_id: 'req-123',
			response_status: 200,
			event: {
				http_verb: 'GET',
				path: '/api/test',
				details: {
					user_agent: 'unknown'
				}
			},
			source: {
				environment: 'test',
				file: '/api/test',
				function: 'GET'
			},
			metrics: {
				response_time_ms: 0
			},
			message: 'Test request: GET /api/test'
		};

		expect(log).toEqual(logTest);
	});
});
