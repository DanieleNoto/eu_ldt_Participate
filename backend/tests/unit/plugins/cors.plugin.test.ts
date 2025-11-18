// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Test coverage for CORS plugin
import { FastifyInstance } from 'fastify';
import corsPlugin from '../../../src/plugins/cors.plugin';
import cors from '@fastify/cors';

// Mock dependencies
jest.mock('@fastify/cors', () => jest.fn());

describe('CORS Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	const mockCors = cors as jest.MockedFunction<typeof cors>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			register: jest.fn()
		} as any;
	});

	test('should register CORS with correct configuration', async () => {
		const opts = {};

		await corsPlugin(mockFastify, opts);

		expect(mockFastify.register).toHaveBeenCalledTimes(1);
		expect(mockFastify.register).toHaveBeenCalledWith(mockCors, {
			origin: ['http://localhost:5001', 'http://localhost:3000'],
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization']
		});
	});

	test('should register CORS regardless of options passed', async () => {
		const opts = { someCustomOption: 'value' };

		await corsPlugin(mockFastify, opts);

		expect(mockFastify.register).toHaveBeenCalledTimes(1);
		expect(mockFastify.register).toHaveBeenCalledWith(mockCors, {
			origin: ['http://localhost:5001', 'http://localhost:3000'],
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization']
		});
	});
});
