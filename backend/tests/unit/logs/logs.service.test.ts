// Code Coverage
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { closeTestServer, createTestServer } from '../helper/createTestServer';
import { formatLog } from '../../../src/utils/logger';

describe('Logs-check service test', () => {
	let app: FastifyInstance;
	beforeAll(async () => {
		app = await createTestServer();
		await app.ready();
	}, 30000);

	afterAll(async () => {
		await closeTestServer();
	});

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
				environment: 'development',
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
