// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
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
	let app: any;

	afterEach(async () => {
		if (app) {
			await app.close();
		}
	});

	test('should build fastify instance', async () => {
		app = await build();

		expect(app).toBeDefined();
		expect(typeof app.listen).toBe('function');
		expect(typeof app.register).toBe('function');
	});

	test('should build fastify instance with options', async () => {
		app = await build({ logger: false });

		expect(app).toBeDefined();
	});
});
