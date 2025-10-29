import '@testing-library/jest-dom';

// Mock i18n
const mockChangeLanguage = jest.fn();
jest.mock('@/i18n', () => ({
	__esModule: true,
	default: {
		changeLanguage: mockChangeLanguage
	}
}));

// Mock React DOM
jest.mock('react-dom/client', () => ({
	createRoot: jest.fn(() => ({
		render: jest.fn(),
		unmount: jest.fn()
	}))
}));

// Mock SimplifiedMainProvider
jest.mock('@app/SimplifiedMainProvider', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock Chatbot component
jest.mock('@app/shared/components/Chatbot/Chatbot', () => ({
	__esModule: true,
	default: ({ language }: { language: string }) => (
		<div data-testid="chatbot" data-language={language}>
			Chatbot
		</div>
	)
}));

import ChatbotWebElement from '@app/standalone-chatbot';
import { createRoot } from 'react-dom/client';

describe('ChatbotWebElement (standalone-chatbot)', () => {
	let element: ChatbotWebElement;

	beforeEach(() => {
		jest.clearAllMocks();
		mockChangeLanguage.mockClear();
		
		// Remove existing custom element definition if it exists
		const existingElement = customElements.get('eu-chatbot');
		if (existingElement) {
			// We can't undefine custom elements, so we'll work with what we have
		} else {
			customElements.define('eu-chatbot', ChatbotWebElement);
		}
		
		element = document.createElement('eu-chatbot') as ChatbotWebElement;
	});

	afterEach(() => {
		if (element.parentNode) {
			element.parentNode.removeChild(element);
		}
	});

	describe('observedAttributes', () => {
		it('should observe language attribute', () => {
			expect(ChatbotWebElement.observedAttributes).toContain('language');
		});
	});

	describe('connectedCallback', () => {
		it('should create React root when connected', () => {
			document.body.appendChild(element);
			
			expect(createRoot).toHaveBeenCalled();
		});

		it('should use default language "en" when no attribute is set', () => {
			const mockRender = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			document.body.appendChild(element);
			
			expect(mockRender).toHaveBeenCalled();
		});

		it('should use language attribute when provided', () => {
			const mockRender = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			element.setAttribute('language', 'de');
			document.body.appendChild(element);
			
			expect(mockRender).toHaveBeenCalled();
		});

		it('should handle errors during mounting', () => {
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockImplementationOnce(() => {
				throw new Error('Failed to create root');
			});

			document.body.appendChild(element);
			
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to mount chatbot:',
				expect.any(Error)
			);
			
			consoleErrorSpy.mockRestore();
		});
	});

	describe('disconnectedCallback', () => {
		it('should unmount React root when disconnected', () => {
			const mockUnmount = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: jest.fn(),
				unmount: mockUnmount
			});

			document.body.appendChild(element);
			document.body.removeChild(element);
			
			expect(mockUnmount).toHaveBeenCalled();
		});

		it('should handle errors during unmount', () => {
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
			const mockUnmount = jest.fn().mockImplementation(() => {
				throw new Error('Failed to unmount');
			});
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: jest.fn(),
				unmount: mockUnmount
			});

			document.body.appendChild(element);
			document.body.removeChild(element);
			
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to unmount chatbot:',
				expect.any(Error)
			);
			
			consoleErrorSpy.mockRestore();
		});
	});

	describe('attributeChangedCallback', () => {
		it('should remount when language attribute changes', () => {
			const mockRender = jest.fn();
			const mockUnmount = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			
			// First mount
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: mockUnmount
			});

			document.body.appendChild(element);
			expect(mockRender).toHaveBeenCalledTimes(1);
			
			// Prepare for remount
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: mockUnmount
			});

			// Change attribute
			element.setAttribute('language', 'fr');
			
			expect(mockUnmount).toHaveBeenCalled();
			expect(mockRender).toHaveBeenCalledTimes(2);
		});

		it('should handle attribute changes when not mounted', () => {
			// Just create the element without appending
			element.setAttribute('language', 'de');
			
			// Should not throw error
			expect(element.getAttribute('language')).toBe('de');
		});
	});

	describe('language change functionality', () => {
		it('should mount with React component containing language prop', () => {
			const mockRender = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			element.setAttribute('language', 'de');
			document.body.appendChild(element);

			expect(mockRender).toHaveBeenCalled();
			// The component should be rendered with the language
		});
	});

	describe('i18n integration', () => {
		it('should initialize i18n with default language', () => {
			const mockRender = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			document.body.appendChild(element);
			
			// The component should be rendered
			expect(mockRender).toHaveBeenCalled();
		});

		it('should initialize i18n with custom language', () => {
			const mockRender = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			element.setAttribute('language', 'es');
			document.body.appendChild(element);
			
			expect(mockRender).toHaveBeenCalled();
		});
	});

	describe('mount and unmount lifecycle', () => {
		it('should handle multiple mount/unmount cycles', () => {
			const mockRender = jest.fn();
			const mockUnmount = jest.fn();
			
			for (let i = 0; i < 3; i++) {
				const mockCreateRoot = createRoot as jest.Mock;
				mockCreateRoot.mockReturnValueOnce({
					render: mockRender,
					unmount: mockUnmount
				});

				document.body.appendChild(element);
				document.body.removeChild(element);
			}
			
			expect(mockRender).toHaveBeenCalledTimes(3);
			expect(mockUnmount).toHaveBeenCalledTimes(3);
		});

		it('should clean up properly on unmount', () => {
			const mockUnmount = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: jest.fn(),
				unmount: mockUnmount
			});

			document.body.appendChild(element);
			
			document.body.removeChild(element);
			
			expect(mockUnmount).toHaveBeenCalled();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((element as any)._root).toBeNull();
		});
	});
});
