/**
 * EU LDT Participate Chatbot Web Component
 * 
 * This is the main entry point for the chatbot as a web component.
 * It creates a custom element that can be embedded in any web page.
 * 
 * Best practices implemented:
 * - Shadow DOM for style encapsulation
 * - Proper lifecycle management
 * - Clean React integration
 * - Attribute-based configuration
 */

import { createRoot, Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import SimplifiedMainProvider from './SimplifiedMainProvider';
import Chatbot from './shared/components/Chatbot/Chatbot';
import '../i18n';

// Import global styles that will be injected into shadow DOM
import '@theme/styles/global.css';

class EuChatbotElement extends HTMLElement {
	private _root: Root | null = null;
	private _shadowRoot: ShadowRoot | null = null;
	private _mountPoint: HTMLDivElement | null = null;
	private _styleElement: HTMLStyleElement | null = null;

	constructor() {
		super();
		// Attach shadow DOM for style encapsulation
		this._shadowRoot = this.attachShadow({ mode: 'open' });
	}

	static get observedAttributes() {
		return ['language', 'open'];
	}

	connectedCallback() {
		this._setupShadowDOM();
		this._mount();
	}

	disconnectedCallback() {
		this._unmount();
		this._cleanup();
	}

	attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null) {
		if (oldValue !== newValue && this._root) {
			this._render();
		}
	}

	// Public API methods
	public setLanguage(language: string) {
		this.setAttribute('language', language);
	}

	public getLanguage(): string {
		return this.getAttribute('language') || 'en';
	}

	private _setupShadowDOM() {
		if (!this._shadowRoot) return;

		// Create style element for global styles
		this._styleElement = document.createElement('style');
		
		// Add styles that ensure the chatbot is positioned correctly
		// and doesn't interfere with the host page
		this._styleElement.textContent = `
			:host {
				position: fixed;
				bottom: 20px;
				right: 20px;
				z-index: 2147483647; /* Maximum z-index */
				font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
				pointer-events: none; /* Allow clicks through when chatbot is closed */
			}

			:host > div {
				pointer-events: auto; /* Re-enable clicks on the chatbot itself */
			}

			/* Reset box-sizing for all elements inside shadow DOM */
			*, *::before, *::after {
				box-sizing: border-box;
			}

			/* Ensure proper font loading */
			@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
		`;

		this._shadowRoot.appendChild(this._styleElement);

		// Create mount point for React
		this._mountPoint = document.createElement('div');
		this._mountPoint.id = 'chatbot-root';
		this._shadowRoot.appendChild(this._mountPoint);

		// Load global CSS from the build
		this._injectGlobalStyles();
	}

	private async _injectGlobalStyles() {
		// In production, the CSS is bundled. We need to fetch and inject it.
		const baseUrl = (window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ || '';
		
		if (baseUrl) {
			try {
				// Try to find the global CSS file
				const cssResponse = await fetch(`${baseUrl}/global.css`).catch(() => null);
				
				if (cssResponse && cssResponse.ok) {
					const cssText = await cssResponse.text();
					const cssElement = document.createElement('style');
					cssElement.textContent = cssText;
					this._shadowRoot?.insertBefore(cssElement, this._mountPoint);
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.warn('[Chatbot] Could not load global styles, using inline styles', error);
			}
		}
	}

	private _mount() {
		if (!this._mountPoint || this._root) return;

		try {
			this._root = createRoot(this._mountPoint);
			this._render();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('[Chatbot] Failed to mount React root:', error);
		}
	}

	private _render() {
		if (!this._root) return;

		const language = this.getAttribute('language') || 'en';

		try {
			this._root.render(
				<Provider store={store}>
					<SimplifiedMainProvider>
						<Chatbot
							language={language}
							onSupportSent={() => {
								this.dispatchEvent(
									new CustomEvent('support-sent', {
										bubbles: true,
										composed: true, // Allow event to cross shadow DOM boundary
										detail: {
											timestamp: new Date().toISOString(),
											conversationId: this.getAttribute('conversation-id')
										}
									})
								);
							}}
						/>
					</SimplifiedMainProvider>
				</Provider>
			);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('[Chatbot] Failed to render:', error);
		}
	}

	private _unmount() {
		if (this._root) {
			try {
				this._root.unmount();
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('[Chatbot] Failed to unmount:', error);
			}
			this._root = null;
		}
	}

	private _cleanup() {
		if (this._mountPoint) {
			this._mountPoint.remove();
			this._mountPoint = null;
		}

		if (this._styleElement) {
			this._styleElement.remove();
			this._styleElement = null;
		}

		this._shadowRoot = null;
	}
}

export const registerChatbot = () => {
	if (!customElements.get('eu-chatbot')) {
		customElements.define('eu-chatbot', EuChatbotElement);
		// eslint-disable-next-line no-console
		console.log('[Chatbot] Web component registered successfully');
	}
};

registerChatbot();

export default EuChatbotElement;
