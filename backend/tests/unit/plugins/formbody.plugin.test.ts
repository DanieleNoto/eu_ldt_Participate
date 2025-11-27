// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Test coverage for formbody plugin
import { FastifyInstance } from 'fastify';
import formbodyPlugin from '../../../src/plugins/formbody.plugin';

// Mock fastify formbody
jest.mock('@fastify/formbody', () => jest.fn());

describe('Formbody Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			register: jest.fn()
		} as any;
	});

	test('should register formbody plugin', async () => {
		await formbodyPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledTimes(1);
		expect(mockFastify.register).toHaveBeenCalledWith(expect.any(Function));
	});
});
