// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
import appConfig from '../../../src/config/config';
import jwtPlugin from '../../../src/plugins/jwt.plugin';
import logger from '../../../src/utils/logger';

jest.mock('../../../src/config/config');
jest.mock('../../../src/utils/logger', () => ({
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn()
}));

describe('JWT plugin', () => {
	const ORIGINAL_ENV = process.env as typeof process.env;
	const mockLogger = logger as jest.Mocked<typeof logger>;

	let fastifyMock: { register: jest.Mock; addHook: jest.Mock };
	let replyMock: { send: jest.Mock };

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...ORIGINAL_ENV, CONTEXT_URL: '/api' };

		// Default config
		appConfig.jwtConfig = { enable: true, secret: { public: 's' } };

		// Clear mock calls
		jest.clearAllMocks();

		fastifyMock = {
			register: jest.fn(),
			addHook: jest.fn()
		};
		replyMock = { send: jest.fn() };
	});

	afterEach(() => {
		process.env = ORIGINAL_ENV;
	});

	it('does nothing when JWT disabled', async () => {
		appConfig.jwtConfig.enable = false;
		await jwtPlugin(fastifyMock as any, {} as any);
		expect(fastifyMock.register).not.toHaveBeenCalled();
		expect(fastifyMock.addHook).not.toHaveBeenCalled();
	});

	it('registers jwt plugin and adds the onRequest hook when enabled', async () => {
		appConfig.jwtConfig.enable = true;
		await jwtPlugin(fastifyMock as any, {} as any);

		expect(fastifyMock.register).toHaveBeenCalledWith(expect.any(Function), appConfig.jwtConfig);
		expect(fastifyMock.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
	});

	describe('onRequest hook behavior', () => {
		let hookFn: (req: any, reply: any) => Promise<void>;
		let request: { raw: { url?: string }; headers: Record<string, string>; jwtVerify: jest.Mock };

		beforeEach(async () => {
			appConfig.jwtConfig.enable = true;
			await jwtPlugin(fastifyMock as any, {} as any);

			// extract the registered hook callback
			const calls = fastifyMock.addHook.mock.calls;
			const onReqCall = calls.find(call => call[0] === 'onRequest');
			hookFn = onReqCall![1];

			request = {
				raw: { url: '' },
				headers: {},
				jwtVerify: jest.fn()
			};
		});

		it('skips verification for /documentation', async () => {
			request.raw.url = '/documentation/index.html';
			await hookFn(request, replyMock as any);
			expect(request.jwtVerify).not.toHaveBeenCalled();
			expect(replyMock.send).not.toHaveBeenCalled();
		});

		it('skips verification for health check', async () => {
			request.raw.url = '/api/health';
			await hookFn(request, replyMock as any);
			expect(request.jwtVerify).not.toHaveBeenCalled();
			expect(replyMock.send).not.toHaveBeenCalled();
		});

		it('skips verification when no Authorization header', async () => {
			request.raw.url = '/secure';
			request.headers = {};
			await hookFn(request, replyMock as any);
			expect(request.jwtVerify).not.toHaveBeenCalled();
		});

		it('calls jwtVerify and logs on valid header', async () => {
			request.raw.url = '/secure';
			request.headers = { authorization: 'Bearer token' };
			const decoded = { sub: 'user' };
			request.jwtVerify.mockResolvedValue(decoded);

			await hookFn(request, replyMock as any);

			expect(request.jwtVerify).toHaveBeenCalled();
			expect(mockLogger.debug).toHaveBeenCalledWith({ msg: 'jwtVerify: ', jwtVerify: decoded });
			expect(replyMock.send).not.toHaveBeenCalled();
		});

		it('catches jwtVerify errors and calls reply.send', async () => {
			request.raw.url = '/secure';
			request.headers = { authorization: 'Bearer token' };
			const err = new Error('bad token');
			request.jwtVerify.mockRejectedValue(err);

			await hookFn(request, replyMock as any);

			expect(request.jwtVerify).toHaveBeenCalled();
			expect(replyMock.send).toHaveBeenCalledWith(err);
		});
	});
});
