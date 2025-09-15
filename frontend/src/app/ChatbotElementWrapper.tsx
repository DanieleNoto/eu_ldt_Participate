import ChatbotCustomElement from './ChatbotElement';

// Type declaration for React DevTools
declare global {
	interface Window {
		__REACT_DEVTOOLS_GLOBAL_HOOK__?: Record<string, unknown>;
	}
}

// Ensure React is properly initialized
if (typeof window !== 'undefined') {
	// Force React development mode detection
	if (process.env.NODE_ENV === 'development') {
		// This helps with React DevTools and preamble detection
		window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
	}
}

// Export the custom element
export default ChatbotCustomElement;

// Also ensure the custom element is defined when this module is loaded
export const registerChatbot = () => {
	if (!customElements.get('eu-chatbot')) {
		customElements.define('eu-chatbot', ChatbotCustomElement);
	}
};

// Auto-register when module is loaded
registerChatbot();
