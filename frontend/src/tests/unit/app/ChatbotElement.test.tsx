// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import '@testing-library/jest-dom';

// Mock React DOM
jest.mock('react-dom/client', () => ({
	createRoot: jest.fn(() => ({
		render: jest.fn(),
		unmount: jest.fn()
	}))
}));

// Mock Redux store
jest.mock('@app/store/store', () => ({
	store: {}
}));

// Mock SimplifiedMainProvider
jest.mock('@app/SimplifiedMainProvider', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock Chatbot component
jest.mock('@app/shared/components/Chatbot/Chatbot', () => ({
	__esModule: true,
	default: () => <div data-testid="chatbot">Chatbot</div>
}));

import ChatbotCustomElement from '@app/ChatbotElement';
import { createRoot } from 'react-dom/client';

describe('ChatbotCustomElement', () => {
	let element: ChatbotCustomElement;

	beforeEach(() => {
		// Clear all mocks before each test
		jest.clearAllMocks();
		
		// Define the custom element if not already defined
		if (!customElements.get('eu-chatbot')) {
			customElements.define('eu-chatbot', ChatbotCustomElement);
		}
		
		// Create a new instance
		element = document.createElement('eu-chatbot') as ChatbotCustomElement;
	});

	afterEach(() => {
		// Clean up
		if (element.parentNode) {
			element.parentNode.removeChild(element);
		}
	});

	describe('observedAttributes', () => {
		it('should observe language attribute', () => {
			expect(ChatbotCustomElement.observedAttributes).toContain('language');
		});
	});

	describe('connectedCallback', () => {
		it('should create mount point when connected', () => {
			document.body.appendChild(element);
			
			const mountPoint = element.querySelector('div');
			expect(mountPoint).toBeTruthy();
		});

		it('should initialize React root when connected', () => {
			document.body.appendChild(element);
			
			expect(createRoot).toHaveBeenCalled();
		});

		it('should handle errors during root initialization', () => {
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockImplementationOnce(() => {
				throw new Error('Failed to create root');
			});

			document.body.appendChild(element);
			
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to initialize React root:',
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
				'Failed to unmount React root:',
				expect.any(Error)
			);
			
			consoleErrorSpy.mockRestore();
		});

		it('should remove mount point when disconnected', () => {
			document.body.appendChild(element);
			const mountPoint = element.querySelector('div');
			
			document.body.removeChild(element);
			
			expect(mountPoint?.parentNode).toBeFalsy();
		});
	});

	describe('attributeChangedCallback', () => {
		it('should re-render when language attribute changes', () => {
			const mockRender = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			document.body.appendChild(element);
			mockRender.mockClear(); // Clear initial render call
			
			element.setAttribute('language', 'de');
			
			expect(mockRender).toHaveBeenCalled();
		});

		it('should use default language when attribute is not set', () => {
			const mockRender = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			document.body.appendChild(element);
			
			expect(mockRender).toHaveBeenCalled();
		});
	});

	describe('supportSent event', () => {
		it('should dispatch supportSent event with timestamp', (done) => {
			const mockRender = jest.fn((reactElement) => {
				// Extract the onSupportSent callback from the rendered Chatbot component
				const chatbotProps = reactElement.props.children.props.children.props;
				if (chatbotProps.onSupportSent) {
					chatbotProps.onSupportSent();
				}
			});
			
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			element.addEventListener('supportSent', ((event: CustomEvent) => {
				expect(event.detail).toHaveProperty('timestamp');
				expect(event.detail.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
				expect(event.bubbles).toBe(true);
				done();
			}) as EventListener);

			document.body.appendChild(element);
		});
	});

	describe('render with different languages', () => {
		it('should render with English language', () => {
			const mockRender = jest.fn();
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			element.setAttribute('language', 'en');
			document.body.appendChild(element);
			
			expect(mockRender).toHaveBeenCalled();
		});

		it('should render with German language', () => {
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
	});

	describe('error handling in render', () => {
		it('should handle render errors gracefully', () => {
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
			const mockRender = jest.fn().mockImplementation(() => {
				throw new Error('Render failed');
			});
			const mockCreateRoot = createRoot as jest.Mock;
			mockCreateRoot.mockReturnValueOnce({
				render: mockRender,
				unmount: jest.fn()
			});

			document.body.appendChild(element);
			
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to render chatbot:',
				expect.any(Error)
			);
			
			consoleErrorSpy.mockRestore();
		});
	});
});
