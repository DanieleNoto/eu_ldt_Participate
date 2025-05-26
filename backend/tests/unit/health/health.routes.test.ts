// Code Coverage
import { FastifyInstance } from 'fastify';
import { closeTestServer, createTestServer } from '../helper/createTestServer';

describe('Health-check Route test', () => {
	let app: FastifyInstance;
	beforeAll(async () => {
		app = await createTestServer();
		await app.ready();
	}, 30000);

	afterAll(async () => {
		await closeTestServer();
	});

	test(`GET ${process.env.CONTEXT_URL}/health should return 200 and status ok`, async () => {
		const response = await app.inject({
			url: `${process.env.CONTEXT_URL}/health`
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().status).toEqual('Healthy');
	});
});
