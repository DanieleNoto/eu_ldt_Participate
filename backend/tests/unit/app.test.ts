// Test coverage for main app
import { build } from '../../src/app';

// Mock all plugins
jest.mock('../../src/plugins/register-plugin', () => ({
	registerPlugin: jest.fn()
}));

jest.mock('../../src/middlewares/error-handler.middleware', () =>
	jest.fn((error, request, reply) => reply.send({ error: 'test' }))
);

describe('App', () => {
	test('should build fastify instance', async () => {
		const app = await build();

		expect(app).toBeDefined();
		expect(typeof app.listen).toBe('function');
		expect(typeof app.register).toBe('function');
	});

	test('should build fastify instance with options', async () => {
		const options = { logger: false };
		const app = await build(options);

		expect(app).toBeDefined();
	});
});
