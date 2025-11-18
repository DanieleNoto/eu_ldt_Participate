// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
// Test coverage for register plugin
import { FastifyInstance } from 'fastify';
import { registerPlugin } from '../../../src/plugins/register-plugin';

describe('Register Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			register: jest.fn()
		} as any;
	});

	test('should register multiple plugins', async () => {
		await registerPlugin(mockFastify);

		// Should register multiple plugins (cors, formbody, helmet, etc.)
		expect(mockFastify.register).toHaveBeenCalled();
		expect(mockFastify.register.mock.calls.length).toBeGreaterThan(1);
	});
});
