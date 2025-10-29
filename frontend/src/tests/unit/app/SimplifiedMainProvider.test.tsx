import { render, screen, waitFor, act } from '@testing-library/react';
import SimplifiedMainProvider from '@app/SimplifiedMainProvider';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@config/chatbot.config', () => ({
	chatbotConfig: {
		appName: 'Test Chatbot',
		backend: {
			api: '/api',
			baseUrl: 'http://localhost:3000'
		},
		frontend: { url: 'http://localhost:5173' },
		logger: { level: 'info' },
		toastr: { vertical: 'top', horizontal: 'center', duration: 3000 },
		dateFns: { locale: 'en' }
	}
}));

// Mock fetch
global.fetch = jest.fn();

describe('SimplifiedMainProvider', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(global.fetch as jest.Mock).mockClear();
		delete (globalThis as { __CHATBOT_CONFIG__?: unknown }).__CHATBOT_CONFIG__;
		delete (globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__;
		delete (globalThis as { __VITE_API_URL__?: string }).__VITE_API_URL__;
	});

	it('should render children when config is initialized', async () => {
		render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test Child</div>
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('child')).toBeInTheDocument();
		});
	});

	it('should provide all required providers (Redux, Theme, QueryClient, Toastr, Config)', async () => {
		const TestComponent = () => {
			const { useSelector } = require('react-redux');
			const { useConfig } = require('@app/config/ConfigContext');
			const { useToastrState } = require('@app/shared/toastr/context/ToastrContext');
			
			const state = useSelector((s: { config: unknown }) => s.config);
			const config = useConfig();
			const toastr = useToastrState();
			
			return (
				<div>
					<div data-testid="has-redux">{state ? 'yes' : 'no'}</div>
					<div data-testid="has-config">{config ? 'yes' : 'no'}</div>
					<div data-testid="has-toastr">{toastr ? 'yes' : 'no'}</div>
				</div>
			);
		};

		render(
			<SimplifiedMainProvider>
				<TestComponent />
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('has-redux')).toHaveTextContent('yes');
			expect(screen.getByTestId('has-config')).toHaveTextContent('yes');
			expect(screen.getByTestId('has-toastr')).toHaveTextContent('yes');
		});
	});

	it('should initialize with default config when no external config is provided', async () => {
		render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('child')).toBeInTheDocument();
		});

		const globalConfig = (globalThis as { __CHATBOT_CONFIG__?: { appName: string } }).__CHATBOT_CONFIG__;
		expect(globalConfig?.appName).toBe('Test Chatbot');
	});

	it('should fetch config from base URL if __CHATBOT_BASE_URL__ is set', async () => {
		const mockConfig = {
			appName: 'Fetched Chatbot',
			backend: {
				api: '/api/v2',
				baseUrl: 'http://example.com'
			}
		};

		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => mockConfig
		});

		(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';

		render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('child')).toBeInTheDocument();
		});

		expect(global.fetch).toHaveBeenCalledWith(
			'http://example.com/config/config.json',
			expect.objectContaining({ signal: expect.any(AbortSignal) })
		);
	});

	it('should use existing __CHATBOT_CONFIG__ if already set', async () => {
		const presetConfig = {
			appName: 'Preset Chatbot',
			backend: {
				api: '/api/preset',
				baseUrl: 'http://preset.com'
			},
			frontend: { url: 'http://frontend.com' },
			logger: { level: 'debug' },
			toastr: { vertical: 'bottom' as const, horizontal: 'left' as const, duration: 5000 },
			dateFns: { locale: 'de' }
		};

		(globalThis as { __CHATBOT_CONFIG__?: typeof presetConfig }).__CHATBOT_CONFIG__ = presetConfig;

		render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('child')).toBeInTheDocument();
		});

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('should handle fetch errors gracefully and use defaults', async () => {
		const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
		
		(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
		(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';

		render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('child')).toBeInTheDocument();
		});

		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'[SimplifiedMainProvider] Failed to load config.json, using defaults:',
			expect.any(Error)
		);

		consoleWarnSpy.mockRestore();
	});

	it('should handle HTTP errors when fetching config', async () => {
		const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
		
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: false,
			status: 404
		});
		
		(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';

		render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('child')).toBeInTheDocument();
		});

		expect(consoleWarnSpy).toHaveBeenCalled();
		consoleWarnSpy.mockRestore();
	});

	it('should normalize baseUrl by removing trailing slash', async () => {
		(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com/';

		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({})
		});

		render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				'http://example.com/config/config.json',
				expect.any(Object)
			);
		});
	});

	it('should use VITE_API_URL environment variable if available', async () => {
		const originalEnv = process.env.VITE_API_URL;
		process.env.VITE_API_URL = 'http://vite-url.com';

		render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('child')).toBeInTheDocument();
		});

		const globalConfig = (globalThis as { __CHATBOT_CONFIG__?: { backend: { baseUrl: string } } }).__CHATBOT_CONFIG__;
		expect(globalConfig?.backend.baseUrl).toBe('http://vite-url.com');

		// Restore
		if (originalEnv !== undefined) {
			process.env.VITE_API_URL = originalEnv;
		} else {
			delete process.env.VITE_API_URL;
		}
	});

	it('should cleanup fetch on unmount', async () => {
		let abortCalled = false;
		const mockAbort = jest.fn(() => {
			abortCalled = true;
		});
		
		const originalAbortController = global.AbortController;
		global.AbortController = class MockAbortController {
			signal = {} as AbortSignal;
			abort = mockAbort;
		} as unknown as typeof AbortController;

		(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		
		(global.fetch as jest.Mock).mockImplementation(() => 
			new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
		);

		const { unmount } = render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		act(() => {
			unmount();
		});

		await waitFor(() => {
			expect(abortCalled).toBe(true);
		});

		global.AbortController = originalAbortController;
	});

	it('should not render children until config is initialized', () => {
		(global.fetch as jest.Mock).mockImplementation(() => 
			new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
		);

		(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';

		const { container } = render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		// Initially should not have child
		expect(container.textContent).toBe('');
	});

	it('should merge fetched config with base config', async () => {
		const partialConfig = {
			appName: 'Merged Chatbot'
			// Other fields should come from base config
		};

		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => partialConfig
		});

		(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';

		render(
			<SimplifiedMainProvider>
				<div data-testid="child">Test</div>
			</SimplifiedMainProvider>
		);

		await waitFor(() => {
			expect(screen.getByTestId('child')).toBeInTheDocument();
		});

		const globalConfig = (globalThis as { __CHATBOT_CONFIG__?: { appName: string; backend: { api: string } } }).__CHATBOT_CONFIG__;
		expect(globalConfig?.appName).toBe('Merged Chatbot');
		expect(globalConfig?.backend.api).toBe('/api'); // From base config
	});
});
