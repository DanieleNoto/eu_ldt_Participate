// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Test coverage for request context plugin
import { FastifyInstance, FastifyRequest } from 'fastify';
import requestContextPlugin from '../../../src/plugins/request-context.plugin';
import fastifyRequestContext from '@fastify/request-context';

// Mock dependencies
jest.mock('@fastify/request-context', () => jest.fn());

describe('Request Context Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	let mockRequest: jest.Mocked<FastifyRequest>;
	let mockRequestContext: jest.Mocked<any>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockRequestContext = {
			set: jest.fn()
		};

		mockFastify = {
			register: jest.fn(),
			addHook: jest.fn()
		} as any;

		mockRequest = {
			id: 'req-123',
			user: { author: 'testuser' },
			i18n: { language: 'en' },
			requestContext: mockRequestContext
		} as any;
	});

	test('should register fastifyRequestContext plugin', async () => {
		await requestContextPlugin(mockFastify);

		expect(mockFastify.register).toHaveBeenCalledWith(fastifyRequestContext);
	});

	test('should add onRequest hook', async () => {
		await requestContextPlugin(mockFastify);

		expect(mockFastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
	});

	test('onRequest hook should set request context with user author', async () => {
		await requestContextPlugin(mockFastify);

		const onRequestHandler = mockFastify.addHook.mock.calls[0][1];
		await (onRequestHandler as any).call(mockFastify, mockRequest, {} as any, {} as any);

		expect(mockRequestContext.set).toHaveBeenCalledWith('sid', 'req-123');
		expect(mockRequestContext.set).toHaveBeenCalledWith('i18n', mockRequest.i18n);
		expect(mockRequestContext.set).toHaveBeenCalledWith('user', mockRequest.user);
		expect(mockRequestContext.set).toHaveBeenCalledWith('author', 'testuser');
	});

	test('onRequest hook should use system as default author when user has no author', async () => {
		mockRequest.user = {} as any;

		await requestContextPlugin(mockFastify);

		const onRequestHandler = mockFastify.addHook.mock.calls[0][1];
		await (onRequestHandler as any).call(mockFastify, mockRequest, {} as any, {} as any);

		expect(mockRequestContext.set).toHaveBeenCalledWith('author', 'system');
	});

	test('onRequest hook should use system as default author when user is undefined', async () => {
		mockRequest.user = undefined as any;

		await requestContextPlugin(mockFastify);

		const onRequestHandler = mockFastify.addHook.mock.calls[0][1];
		await (onRequestHandler as any).call(mockFastify, mockRequest, {} as any, {} as any);

		expect(mockRequestContext.set).toHaveBeenCalledWith('author', 'system');
	});

	test('onRequest hook should handle all context properties', async () => {
		await requestContextPlugin(mockFastify);

		const onRequestHandler = mockFastify.addHook.mock.calls[0][1];
		await (onRequestHandler as any).call(mockFastify, mockRequest, {} as any, {} as any);

		expect(mockRequestContext.set).toHaveBeenCalledTimes(4);
		expect(mockRequestContext.set).toHaveBeenCalledWith('sid', mockRequest.id);
		expect(mockRequestContext.set).toHaveBeenCalledWith('i18n', mockRequest.i18n);
		expect(mockRequestContext.set).toHaveBeenCalledWith('user', mockRequest.user);
		expect(mockRequestContext.set).toHaveBeenCalledWith('author', 'testuser');
	});

	test('onRequest hook should set correct author when user author is null', async () => {
		mockRequest.user = { author: null } as any;

		await requestContextPlugin(mockFastify);

		const onRequestHandler = mockFastify.addHook.mock.calls[0][1];
		await (onRequestHandler as any).call(mockFastify, mockRequest, {} as any, {} as any);

		expect(mockRequestContext.set).toHaveBeenCalledWith('author', 'system');
	});
});
