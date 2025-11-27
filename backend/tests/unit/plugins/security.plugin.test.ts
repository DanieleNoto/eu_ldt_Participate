// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Test coverage for security plugin
import { FastifyInstance } from 'fastify';
import securityPlugin from '../../../src/plugins/security.plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import appConfig from '../../../src/config/config';

// Mock dependencies
jest.mock('@fastify/helmet', () => jest.fn());
jest.mock('@fastify/rate-limit', () => jest.fn());
jest.mock('../../../src/config/config', () => ({
	rateLimit: {
		max: 100,
		timeWindow: '1 minute'
	}
}));

describe('Security Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	const originalEnv = process.env;

	beforeEach(() => {
		jest.clearAllMocks();
		process.env = { ...originalEnv };

		mockFastify = {
			register: jest.fn(),
			log: {
				warn: jest.fn()
			}
		} as any;
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	test('should register helmet with security configuration when DISABLE_HELMET is not set', async () => {
		delete process.env.DISABLE_HELMET;

		await securityPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledWith(helmet, {
			contentSecurityPolicy: false,
			crossOriginOpenerPolicy: false,
			crossOriginEmbedderPolicy: false
		});
	});

	test('should not register helmet when DISABLE_HELMET is true', async () => {
		process.env.DISABLE_HELMET = 'true';

		await securityPlugin(mockFastify, {});

		expect(mockFastify.log.warn).toHaveBeenCalledWith('Helmet security headers disabled by DISABLE_HELMET env var');
		expect(mockFastify.register).not.toHaveBeenCalledWith(helmet, expect.any(Object));
	});

	test('should register helmet when DISABLE_HELMET is false', async () => {
		process.env.DISABLE_HELMET = 'false';

		await securityPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledWith(helmet, {
			contentSecurityPolicy: false,
			crossOriginOpenerPolicy: false,
			crossOriginEmbedderPolicy: false
		});
		expect(mockFastify.log.warn).not.toHaveBeenCalled();
	});

	test('should always register rate limit with app config', async () => {
		await securityPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledWith(rateLimit, appConfig.rateLimit);
	});

	test('should register rate limit regardless of helmet configuration', async () => {
		process.env.DISABLE_HELMET = 'true';

		await securityPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledWith(rateLimit, appConfig.rateLimit);
	});

	test('should handle empty DISABLE_HELMET environment variable', async () => {
		process.env.DISABLE_HELMET = '';

		await securityPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledWith(helmet, {
			contentSecurityPolicy: false,
			crossOriginOpenerPolicy: false,
			crossOriginEmbedderPolicy: false
		});
		expect(mockFastify.log.warn).not.toHaveBeenCalled();
	});
});
