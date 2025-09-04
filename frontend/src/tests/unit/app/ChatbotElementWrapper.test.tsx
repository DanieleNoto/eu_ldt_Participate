import ChatbotCustomElement, { registerChatbot } from '@app/ChatbotElementWrapper';

// Mock the ChatbotCustomElement
jest.mock('@app/ChatbotElement', () => {
	return class MockChatbotCustomElement extends HTMLElement {
		static get observedAttributes() {
			return ['language'];
		}
		
		connectedCallback() {}
		disconnectedCallback() {}
		attributeChangedCallback() {}
	};
});

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

// Mock process.env
const originalEnv = process.env;

describe('ChatbotElementWrapper', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGet.mockReturnValue(undefined); // Element not registered by default
		process.env = { ...originalEnv };
		
		// Reset window properties
		if (global.window) {
			global.window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
		}
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('should export ChatbotCustomElement as default', () => {
		expect(ChatbotCustomElement).toBeDefined();
		expect(typeof ChatbotCustomElement).toBe('function');
	});

	it('should export registerChatbot function', () => {
		expect(registerChatbot).toBeDefined();
		expect(typeof registerChatbot).toBe('function');
	});

	describe('registerChatbot function', () => {
		it('should register eu-chatbot custom element when not already defined', () => {
			mockGet.mockReturnValue(undefined);
			
			registerChatbot();
			
			expect(mockGet).toHaveBeenCalledWith('eu-chatbot');
			expect(mockDefine).toHaveBeenCalledWith('eu-chatbot', ChatbotCustomElement);
		});

		it('should not register eu-chatbot when already defined', () => {
			mockGet.mockReturnValue(class ExistingElement {});
			
			registerChatbot();
			
			expect(mockGet).toHaveBeenCalledWith('eu-chatbot');
			expect(mockDefine).not.toHaveBeenCalled();
		});

		it('should be safe to call multiple times', () => {
			mockGet.mockReturnValueOnce(undefined).mockReturnValueOnce(class ExistingElement {});
			
			registerChatbot();
			registerChatbot();
			
			expect(mockGet).toHaveBeenCalledTimes(2);
			expect(mockDefine).toHaveBeenCalledTimes(1);
		});
	});

	describe('React DevTools setup', () => {
		it('should set up React DevTools hook in development mode', () => {
			process.env.NODE_ENV = 'development';
			
			// Ensure window exists and clear the hook
			if (global.window) {
				global.window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
			}
			
			// Re-import to trigger the condition
			jest.resetModules();
			require('@app/ChatbotElementWrapper');
			
			if (global.window) {
				expect(global.window.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBeDefined();
			}
		});

		it('should not set up React DevTools hook in production mode', () => {
			process.env.NODE_ENV = 'production';
			if (global.window) {
				global.window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
			}
			
			// Re-import to trigger the condition
			jest.resetModules();
			require('@app/ChatbotElementWrapper');
			
			// The hook should remain undefined in production
			if (global.window) {
				expect(global.window.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBeUndefined();
			}
		});

		it('should preserve existing React DevTools hook', () => {
			process.env.NODE_ENV = 'development';
			const existingHook = { someProperty: 'value' };
			if (global.window) {
				global.window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = existingHook;
			}
			
			// Re-import to trigger the condition
			jest.resetModules();
			require('@app/ChatbotElementWrapper');
			
			if (global.window) {
				expect(global.window.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBe(existingHook);
			}
		});
	});

	describe('window environment check', () => {
		it('should handle server-side rendering (no window)', () => {
			const savedWindow = global.window;
			// @ts-ignore
			delete global.window;
			
			expect(() => {
				jest.resetModules();
				require('@app/ChatbotElementWrapper');
			}).not.toThrow();
			
			global.window = savedWindow;
		});
	});

	describe('module loading', () => {
		it('should auto-register chatbot when module is loaded', () => {
			mockGet.mockReturnValue(undefined);
			
			// Clear previous calls
			mockDefine.mockClear();
			mockGet.mockClear();
			
			// Re-import to trigger auto-registration
			jest.resetModules();
			require('@app/ChatbotElementWrapper');
			
			expect(mockGet).toHaveBeenCalledWith('eu-chatbot');
			expect(mockDefine).toHaveBeenCalledWith('eu-chatbot', expect.any(Function));
		});
	});
});
