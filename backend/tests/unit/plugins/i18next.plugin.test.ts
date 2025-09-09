// Test coverage for i18next plugin
import { FastifyInstance, FastifyRequest } from 'fastify';
import i18nextPlugin from '../../../src/plugins/i18next.plugin';
import i18next from 'i18next';
import backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';

// Mock dependencies
jest.mock('i18next', () => ({
	use: jest.fn().mockReturnThis(),
	init: jest.fn().mockResolvedValue(undefined),
	cloneInstance: jest.fn().mockReturnValue({
		changeLanguage: jest.fn()
	})
}));

jest.mock('i18next-fs-backend', () => jest.fn());
jest.mock('i18next-http-middleware', () => ({
	LanguageDetector: jest.fn(),
	plugin: jest.fn()
}));

describe('i18next Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	let mockRequest: jest.Mocked<FastifyRequest>;
	const mockI18next = i18next as jest.Mocked<typeof i18next>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			register: jest.fn(),
			addHook: jest.fn()
		} as any;

		mockRequest = {
			language: 'en'
		} as any;
	});

	test('should initialize i18next with correct configuration', async () => {
		await i18nextPlugin(mockFastify, {});

		expect(mockI18next.use).toHaveBeenCalledWith(middleware.LanguageDetector);
		expect(mockI18next.use).toHaveBeenCalledWith(backend);
		expect(mockI18next.init).toHaveBeenCalledWith({
			fallbackLng: 'en',
			preload: ['en', 'es', 'fr', 'de'],
			backend: {
				loadPath: expect.stringContaining('i18n')
			}
		});
	});

	test('should register middleware plugin with i18next instance', async () => {
		await i18nextPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledWith(middleware.plugin, {
			i18next: mockI18next
		});
	});

	test('should add onRequest hook for language handling', async () => {
		await i18nextPlugin(mockFastify, {});

		expect(mockFastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
	});

	test('onRequest hook should clone i18next instance and set language', async () => {
		const mockI18nInstance = {
			changeLanguage: jest.fn()
		};
		mockI18next.cloneInstance.mockReturnValue(mockI18nInstance as any);

		await i18nextPlugin(mockFastify, {});

		const onRequestHandler = mockFastify.addHook.mock.calls[0][1];
		await (onRequestHandler as any).call(mockFastify, mockRequest, {} as any, {} as any);

		expect(mockI18next.cloneInstance).toHaveBeenCalled();
		expect(mockRequest.i18n).toBe(mockI18nInstance);
		expect(mockI18nInstance.changeLanguage).toHaveBeenCalledWith('en');
	});

	test('onRequest hook should handle different languages', async () => {
		const mockI18nInstance = {
			changeLanguage: jest.fn()
		};
		mockI18next.cloneInstance.mockReturnValue(mockI18nInstance as any);
		mockRequest.language = 'fr';

		await i18nextPlugin(mockFastify, {});

		const onRequestHandler = mockFastify.addHook.mock.calls[0][1];
		await (onRequestHandler as any).call(mockFastify, mockRequest, {} as any, {} as any);

		expect(mockI18nInstance.changeLanguage).toHaveBeenCalledWith('fr');
	});
});
