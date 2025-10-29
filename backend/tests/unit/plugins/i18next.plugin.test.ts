// Test coverage for i18next plugin
import { FastifyInstance, FastifyRequest } from 'fastify';
import i18nextPlugin from '../../../src/plugins/i18next.plugin';
import i18next from 'i18next';
import * as fs from 'fs';

// Mock dependencies
jest.mock('i18next', () => ({
	init: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('fs', () => ({
	existsSync: jest.fn(),
	readFileSync: jest.fn()
}));

describe('i18next Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	let mockRequest: jest.Mocked<FastifyRequest>;
	const mockI18next = i18next as jest.Mocked<typeof i18next>;
	const mockFs = fs as jest.Mocked<typeof fs>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			addHook: jest.fn()
		} as any;

		mockRequest = {} as any;

		// Mock file existence check and successful file reading
		(mockFs.existsSync as jest.Mock).mockReturnValue(true);
		mockFs.readFileSync.mockReturnValue('{"hello": "Hello", "world": "World"}');
	});

	test('should initialize i18next with correct configuration', async () => {
		await i18nextPlugin(mockFastify);

		expect(mockI18next.init).toHaveBeenCalledWith({
			lng: 'en',
			fallbackLng: 'en',
			resources: expect.any(Object),
			ns: 'translation',
			defaultNS: 'translation',
			interpolation: {
				escapeValue: false
			},
			returnEmptyString: false,
			returnNull: false,
			returnObjects: false
		});
	});

	test('should add onRequest hook for i18n instance assignment', async () => {
		await i18nextPlugin(mockFastify);

		expect(mockFastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
	});

	test('onRequest hook should assign i18next instance to request', async () => {
		await i18nextPlugin(mockFastify);

		const onRequestHandler = mockFastify.addHook.mock.calls[0][1];
		await (onRequestHandler as any)(mockRequest);

		expect((mockRequest as any).i18n).toBe(mockI18next);
	});

	test('should handle missing translation files gracefully', async () => {
		(mockFs.existsSync as jest.Mock).mockReturnValue(false);

		await expect(i18nextPlugin(mockFastify)).resolves.not.toThrow();
		expect(mockI18next.init).toHaveBeenCalled();
	});
});
