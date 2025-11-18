// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Mock the controller before any imports
const mockHealthController = {
	health: jest.fn(),
	ready: jest.fn(),
	live: jest.fn(),
	serviceStatuses: jest.fn(),
	kubernetes: jest.fn()
};

jest.mock('../../../src/controllers/health.controller', () => mockHealthController);

// Mock the schemas
jest.mock('../../../src/schemas/health.schema', () => ({
	HealthResponseSchema: { type: 'object' },
	ServiceStatusesResponseSchema: { type: 'object' },
	KubernetesHealthResponseSchema: { type: 'object' }
}));

import { FastifyInstance } from 'fastify';

describe('Health Routes', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	let healthRoutes: any;

	beforeAll(() => {
		// Import after mocks are set up
		healthRoutes = require('../../../src/routes/health.routes').default;
	});

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			route: jest.fn()
		} as any;
	});

	test('should register all 5 health routes', () => {
		healthRoutes(mockFastify);

		// Should register 5 routes
		expect(mockFastify.route).toHaveBeenCalledTimes(5);
	});

	test('should register GET /health route', () => {
		healthRoutes(mockFastify);

		const healthRoute = mockFastify.route.mock.calls.find(
			call => call[0].url === '/health' && call[0].method === 'get'
		);
		expect(healthRoute).toBeDefined();
	});

	test('should register GET /health/ready route', () => {
		healthRoutes(mockFastify);

		const readyRoute = mockFastify.route.mock.calls.find(
			call => call[0].url === '/health/ready' && call[0].method === 'get'
		);
		expect(readyRoute).toBeDefined();
	});

	test('should register GET /health/live route', () => {
		healthRoutes(mockFastify);

		const liveRoute = mockFastify.route.mock.calls.find(
			call => call[0].url === '/health/live' && call[0].method === 'get'
		);
		expect(liveRoute).toBeDefined();
	});

	test('should register GET /health/services route', () => {
		healthRoutes(mockFastify);

		const servicesRoute = mockFastify.route.mock.calls.find(
			call => call[0].url === '/health/services' && call[0].method === 'get'
		);
		expect(servicesRoute).toBeDefined();
	});

	test('should register GET /health/kubernetes route', () => {
		healthRoutes(mockFastify);

		const k8sRoute = mockFastify.route.mock.calls.find(
			call => call[0].url === '/health/kubernetes' && call[0].method === 'get'
		);
		expect(k8sRoute).toBeDefined();
	});
});
