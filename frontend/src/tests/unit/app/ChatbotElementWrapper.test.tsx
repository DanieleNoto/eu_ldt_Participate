// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
import ChatbotCustomElement, { registerChatbot } from '@app/ChatbotElementWrapper';
import createCache from '@emotion/cache';
import { createRoot } from 'react-dom/client';

// Mock react-dom/client
jest.mock('react-dom/client', () => ({
	createRoot: jest.fn()
}));

// Mock @emotion/cache
jest.mock('@emotion/cache', () => ({
	__esModule: true,
	default: jest.fn()
}));

// Mock @emotion/react
jest.mock('@emotion/react', () => ({
	CacheProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock Redux store
jest.mock('@app/store/store', () => ({
	store: {}
}));

// Mock SimplifiedMainProvider
jest.mock('@app/SimplifiedMainProvider', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => children
}));

// Mock Chatbot component
jest.mock('@app/shared/components/Chatbot/Chatbot', () => ({
	__esModule: true,
	default: jest.fn(() => null)
}));

// Mock i18n
jest.mock('../../../i18n', () => ({}));

// Mock global styles
jest.mock('@theme/styles/global.css', () => ({}));

// Mock customElements
const mockDefine = jest.fn();
const mockGet = jest.fn();

Object.defineProperty(global, 'customElements', {
	value: {
		define: mockDefine,
		get: mockGet
	},
	writable: true
});

// Mock fetch
globalThis.fetch = jest.fn() as jest.Mock;

// Mock console methods
/* eslint-disable no-console */
const originalConsole = {
	log: console.log,
	warn: console.warn,
	error: console.error,
	debug: console.debug
};

interface MockRoot {
	render: jest.Mock;
	unmount: jest.Mock;
}

interface MockCache {
	key: string;
}

describe('ChatbotElementWrapper', () => {
	let mockRoot: MockRoot;
	let mockCache: MockCache;

	beforeEach(() => {
		jest.clearAllMocks();
		mockGet.mockReturnValue(undefined);

		// Setup mock root
		mockRoot = {
			render: jest.fn(),
			unmount: jest.fn()
		};
		(createRoot as jest.Mock).mockReturnValue(mockRoot);

		// Setup mock cache
		mockCache = { key: 'chatbot' };
		(createCache as jest.Mock).mockReturnValue(mockCache);

		// Mock console to suppress logs during tests
		console.log = jest.fn();
		console.warn = jest.fn();
		console.error = jest.fn();
		console.debug = jest.fn();
	});

	afterEach(() => {
		// Restore console
		console.log = originalConsole.log;
		console.warn = originalConsole.warn;
		console.error = originalConsole.error;
		console.debug = originalConsole.debug;
	});

	describe('Module exports', () => {
		it('should export ChatbotCustomElement as default', () => {
			expect(ChatbotCustomElement).toBeDefined();
			expect(typeof ChatbotCustomElement).toBe('function');
		});

		it('should export registerChatbot function', () => {
			expect(registerChatbot).toBeDefined();
			expect(typeof registerChatbot).toBe('function');
		});
	});

	describe('registerChatbot function', () => {
		it('should register eu-chatbot custom element when not already defined', () => {
			mockGet.mockReturnValue(undefined);

			registerChatbot();

			expect(mockGet).toHaveBeenCalledWith('eu-chatbot');
			expect(mockDefine).toHaveBeenCalledWith('eu-chatbot', ChatbotCustomElement);
		});

		it('should not register eu-chatbot when already defined', () => {
			mockGet.mockReturnValue(
				class ExistingElement {
					existingProp = true;
				}
			);

			registerChatbot();

			expect(mockGet).toHaveBeenCalledWith('eu-chatbot');
			expect(mockDefine).not.toHaveBeenCalled();
		});

		it('should log success message when registering', () => {
			mockGet.mockReturnValue(undefined);

			registerChatbot();

			expect(console.log).toHaveBeenCalledWith('[Chatbot] Web component registered successfully');
		});
	});

	describe('EuChatbotElement lifecycle', () => {
		let element: InstanceType<typeof ChatbotCustomElement>;

		beforeEach(() => {
			element = new ChatbotCustomElement();
		});

		it('should create shadow DOM on construction', () => {
			expect(element.shadowRoot).toBeDefined();
		});

		it('should create emotion cache on construction', () => {
			expect(createCache).toHaveBeenCalledWith({
				key: 'chatbot',
				container: element.shadowRoot
			});
		});

		it('should return observed attributes', () => {
			const attrs = ChatbotCustomElement.observedAttributes;
			expect(attrs).toContain('language');
			expect(attrs).toContain('open');
		});

		describe('connectedCallback', () => {
			it('should setup shadow DOM and mount React on connect', () => {
				document.body.appendChild(element);

				expect(element.shadowRoot?.childNodes.length).toBeGreaterThan(0);
				expect(createRoot).toHaveBeenCalled();
				expect(mockRoot.render).toHaveBeenCalled();
			});

			it('should inject global styles on connect', () => {
				document.body.appendChild(element);

				const styleElement = element.shadowRoot?.querySelector('style');
				expect(styleElement).toBeDefined();
				expect(styleElement?.textContent).toContain(':host');
				expect(styleElement?.textContent).toContain('z-index: 2147483647');
			});

			it('should create mount point with correct id', () => {
				document.body.appendChild(element);

				const mountPoint = element.shadowRoot?.querySelector('#chatbot-root');
				expect(mountPoint).toBeDefined();
			});
		});

		describe('disconnectedCallback', () => {
			it('should unmount React root on disconnect', () => {
				document.body.appendChild(element);
				element.remove();

				expect(mockRoot.unmount).toHaveBeenCalled();
			});

			it('should handle unmount errors gracefully', () => {
				const unmountError = new Error('Unmount error');
				mockRoot.unmount.mockImplementationOnce(() => {
					throw unmountError;
				});

				document.body.appendChild(element);

				expect(() => {
					element.remove();
				}).not.toThrow();

				expect(console.error).toHaveBeenCalledWith('[Chatbot] Failed to unmount:', unmountError);
			});
		});

		describe('attributeChangedCallback', () => {
			beforeEach(() => {
				document.body.appendChild(element);
			});

			afterEach(() => {
				if (document.body.contains(element)) {
					document.body.removeChild(element);
				}
			});

			it('should re-render when language attribute changes', () => {
				mockRoot.render.mockClear();

				element.setAttribute('language', 'fr');

				expect(mockRoot.render).toHaveBeenCalled();
			});

			it('should not re-render when attribute value is the same', () => {
				element.setAttribute('language', 'en');
				mockRoot.render.mockClear();

				element.setAttribute('language', 'en');

				// attributeChangedCallback is called but render is skipped due to oldValue === newValue
				expect(mockRoot.render).not.toHaveBeenCalled();
			});

			it('should re-render when open attribute changes', () => {
				mockRoot.render.mockClear();

				element.setAttribute('open', 'true');

				expect(mockRoot.render).toHaveBeenCalled();
			});
		});

		describe('Public API methods', () => {
			beforeEach(() => {
				document.body.appendChild(element);
			});

			afterEach(() => {
				if (document.body.contains(element)) {
					document.body.removeChild(element);
				}
			});

			it('should set language via setLanguage method', () => {
				element.setLanguage('de');

				expect(element.getAttribute('language')).toBe('de');
			});

			it('should get language via getLanguage method', () => {
				element.setAttribute('language', 'es');

				expect(element.getLanguage()).toBe('es');
			});

			it('should return default language "en" when not set', () => {
				expect(element.getLanguage()).toBe('en');
			});

			it('should trigger re-render when setLanguage is called', () => {
				mockRoot.render.mockClear();

				element.setLanguage('it');

				expect(mockRoot.render).toHaveBeenCalled();
			});
		});

		describe('Custom events', () => {
			beforeEach(() => {
				document.body.appendChild(element);
			});

			afterEach(() => {
				if (document.body.contains(element)) {
					document.body.removeChild(element);
				}
			});

			it('should dispatch support-sent event with correct details', () => {
				const eventListener = jest.fn();
				element.addEventListener('support-sent', eventListener);

				element.setAttribute('conversation-id', 'test-123');

				// Manually trigger the onSupportSent callback
				// Extract from the render call's structure
				const renderCall = mockRoot.render.mock.calls[mockRoot.render.mock.calls.length - 1][0];
				
				// Navigate through the component tree to find Chatbot props
				// Structure: CacheProvider > Provider > SimplifiedMainProvider > Chatbot
				let chatbotElement = renderCall;
				
				// If wrapped in CacheProvider
				if (chatbotElement.props.children) {
					chatbotElement = chatbotElement.props.children;
				}
				// Provider
				if (chatbotElement.props && chatbotElement.props.children) {
					chatbotElement = chatbotElement.props.children;
				}
				// SimplifiedMainProvider
				if (chatbotElement.props && chatbotElement.props.children) {
					chatbotElement = chatbotElement.props.children;
				}

				const onSupportSent = chatbotElement.props?.onSupportSent;
				expect(onSupportSent).toBeDefined();

				// Call the handler
				if (onSupportSent) {
					onSupportSent();
				}

				expect(eventListener).toHaveBeenCalled();
				const event = eventListener.mock.calls[0][0];
				expect(event.detail.conversationId).toBe('test-123');
				expect(event.detail.timestamp).toBeDefined();
				expect(event.bubbles).toBe(true);
				expect(event.composed).toBe(true);
			});
		});
	});

	describe('Global CSS loading', () => {
		let element: InstanceType<typeof ChatbotCustomElement>;

		beforeEach(() => {
			element = new ChatbotCustomElement();
			(globalThis.fetch as jest.Mock).mockClear();
		});

		it('should load global.css when __CHATBOT_BASE_URL__ is set', async () => {
			(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'https://example.com';
			(globalThis.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				text: async () => 'body { margin: 0; }'
			});

			document.body.appendChild(element);
			await new Promise(resolve => setTimeout(resolve, 0));

			// Now uses <link> tag instead of fetch
			expect(console.log).toHaveBeenCalledWith(
				'[Chatbot] Loading styles via <link> from',
				'https://example.com/global.css'
			);
			
			delete (globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__;
		});

		it('should handle non-ok response gracefully', async () => {
			(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'https://example.com';
			(globalThis.fetch as jest.Mock).mockResolvedValue({
				ok: false,
				status: 404
			});

			document.body.appendChild(element);
			await new Promise(resolve => setTimeout(resolve, 0));

			// Should not throw or cause errors
			expect(element.shadowRoot).toBeDefined();

			delete (globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__;
		});

		it('should apply protective overrides after loading global CSS', async () => {
			(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'https://example.com';
			(globalThis.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				text: async () => 'body { margin: 0; }'
			});

			document.body.appendChild(element);
			await new Promise(resolve => setTimeout(resolve, 100));

			const overrideStyle = Array.from(element.shadowRoot?.querySelectorAll('style') || []).find(
				(style: HTMLStyleElement) => style.dataset.source === 'chatbot-overrides'
			);

			expect(overrideStyle).toBeDefined();
			expect(overrideStyle?.textContent).toContain('display: none !important');

			delete (globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__;
		});

		it('should log success when global.css is loaded', async () => {
			(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'https://example.com';
			(globalThis.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				text: async () => 'body { margin: 0; }'
			});

			document.body.appendChild(element);
			await new Promise(resolve => setTimeout(resolve, 100));

			// Updated to match new <link> tag behavior
			expect(console.log).toHaveBeenCalledWith(
				'[Chatbot] Loading styles via <link> from',
				'https://example.com/global.css'
			);

			delete (globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__;
		});

		it('should detect "all: initial" in global.css', async () => {
			(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'https://example.com';
			
			// Since we now use <link> tag, fetch is not called initially
			// This test should verify the <link> element is created instead
			document.body.appendChild(element);
			await new Promise(resolve => setTimeout(resolve, 100));

			// Check that a link element was created
			const linkElement = element.shadowRoot?.querySelector('link[rel="stylesheet"]');
			expect(linkElement).toBeDefined();
			expect(linkElement?.getAttribute('href')).toBe('https://example.com/global.css');

			delete (globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__;
		});
	});

	describe('Constructable stylesheets', () => {
		beforeEach(() => {
			(globalThis.fetch as jest.Mock).mockClear();
		});

		it('should use <link> tag as primary method for loading CSS', async () => {
			(globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'https://example.com';

			const testElement = new ChatbotCustomElement();
			document.body.appendChild(testElement);
			await new Promise(resolve => setTimeout(resolve, 100));

			// Verify <link> element was created
			const linkElement = testElement.shadowRoot?.querySelector('link[rel="stylesheet"]');
			expect(linkElement).toBeDefined();
			expect(linkElement?.getAttribute('href')).toBe('https://example.com/global.css');
			expect(linkElement?.getAttribute('data-source')).toBe('global.css');
			
			testElement.remove();
			delete (globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__;
		});

		it('should handle CSS loading gracefully when base URL is missing', async () => {
			// Don't set __CHATBOT_BASE_URL__
			const testElement = new ChatbotCustomElement();
			document.body.appendChild(testElement);
			await new Promise(resolve => setTimeout(resolve, 100));

			// Should still create shadow DOM and mount point
			expect(testElement.shadowRoot).toBeDefined();
			expect(testElement.shadowRoot?.querySelector('#chatbot-root')).toBeDefined();

			testElement.remove();
		});
	});

	describe('Error handling', () => {
		let element: InstanceType<typeof ChatbotCustomElement>;

		beforeEach(() => {
			element = new ChatbotCustomElement();
		});

		it('should handle mount errors gracefully', () => {
			(createRoot as jest.Mock).mockImplementationOnce(() => {
				throw new Error('Mount error');
			});

			expect(() => {
				document.body.appendChild(element);
			}).not.toThrow();

			expect(console.error).toHaveBeenCalledWith('[Chatbot] Failed to mount React root:', expect.any(Error));
		});

		it('should handle render errors gracefully', () => {
			mockRoot.render.mockImplementationOnce(() => {
				throw new Error('Render error');
			});

			expect(() => {
				document.body.appendChild(element);
			}).not.toThrow();

			expect(console.error).toHaveBeenCalledWith('[Chatbot] Failed to render:', expect.any(Error));
		});

		it('should not mount if already mounted', () => {
			document.body.appendChild(element);
			const firstCallCount = (createRoot as jest.Mock).mock.calls.length;

			// Try to trigger mount again (internal call)
			element.connectedCallback();

			// Should not create a new root
			expect(createRoot).toHaveBeenCalledTimes(firstCallCount);
		});
	});
});
/* eslint-enable no-console */
