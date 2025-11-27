// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
import { createRoot, Root } from 'react-dom/client';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
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
	private readonly _emotionCache: ReturnType<typeof createCache> | null = null;

	constructor() {
		super();
		// Attach shadow DOM for style encapsulation
		this._shadowRoot = this.attachShadow({ mode: 'open' });
		if (this._shadowRoot) {
			this._emotionCache = createCache({ key: 'chatbot', container: this._shadowRoot });
		}
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
		return this.getAttribute('language') ?? 'en';
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
				display: flex;
				flex-direction: column;
				align-items: flex-end; /* Align button and dialog to the right */
				gap: 12px; /* Space between dialog and button */
			}

			#chatbot-root {
				pointer-events: auto; /* Re-enable clicks on the chatbot itself */
				display: flex;
				flex-direction: column;
				align-items: flex-end;
				gap: 12px;
			}
			
			/* Ensure dialog appears above button */
			#chatbot-root dialog[open] {
				position: static !important;
				margin: 0;
			}
			
			/* Button stays at bottom */
			#chatbot-root > button {
				order: 2;
			}
			
			/* Dialog appears above button */
			#chatbot-root > dialog {
				order: 1;
			}

			*, *::before, *::after {
				box-sizing: border-box;
			}

			style, script {
				all: unset; /* Avoid inheriting typography that could still render text if shown */
				display: none !important;
			}

			.MuiSvgIcon-root {
				width: 1em;
				height: 1em;
				fill: currentColor;
				flex-shrink: 0;
				user-select: none;
				display: inline-block;
				font-size: 24px; /* Match typical icon size for consistency */
			}

			@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
		`;

		this._shadowRoot.appendChild(this._styleElement);

		this._mountPoint = document.createElement('div');
		this._mountPoint.id = 'chatbot-root';
		this._shadowRoot.appendChild(this._mountPoint);

		this._injectGlobalStyles();
	}

	private async _injectGlobalStyles() {
		const baseUrl = (globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ ?? '';
		const loadedGlobal = baseUrl ? await this._loadGlobalCSS(baseUrl) : false;
		this._applyProtectiveOverrides(loadedGlobal);
	}

	private async _loadGlobalCSS(baseUrl: string): Promise<boolean> {
		try {
			const url = `${baseUrl}/global.css`;
			
			// Try using <link> tag first (more reliable for Shadow DOM)
			if (this._shadowRoot) {
				const linkElement = document.createElement('link');
				linkElement.rel = 'stylesheet';
				linkElement.href = url;
				linkElement.dataset.source = 'global.css';
				
				// Insert before mount point
				this._shadowRoot.insertBefore(linkElement, this._mountPoint);
				
				// eslint-disable-next-line no-console
				console.log('[Chatbot] Loading styles via <link> from', url);
				return true;
			}
			
			// Fallback to fetch if link doesn't work
			const cssResponse = await fetch(url).catch(() => null);
			
			if (!cssResponse?.ok) {
				// eslint-disable-next-line no-console
				console.warn('[Chatbot] Failed to fetch CSS from', url);
				return false;
			}

			const cssText = await cssResponse.text();
			const sheetApplied = await this._applyCSSSheet(cssText);

			if (!sheetApplied) {
				this._insertCSSElement(cssText);
			}

			this._logCSSLoadSuccess(cssText, url);
			return true;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.warn('[Chatbot] Could not load global styles, using inline styles', error);
			return false;
		}
	}

	private async _applyCSSSheet(cssText: string): Promise<boolean> {
		if (!this._shadowRoot || !('adoptedStyleSheets' in this._shadowRoot)) {
			return false;
		}

		try {
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(cssText);
			this._shadowRoot.adoptedStyleSheets = [...this._shadowRoot.adoptedStyleSheets, sheet];
			return true;
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn('[Chatbot] Failed to apply constructable stylesheet, falling back to <style>', e);
			return false;
		}
	}

	private _insertCSSElement(cssText: string): void {
		if (!this._shadowRoot) {
			return;
		}

	const cssElement = document.createElement('style');
	cssElement.dataset.source = 'global.css';
	cssElement.textContent = cssText;
		this._shadowRoot.insertBefore(cssElement, this._mountPoint);
	}

	private _logCSSLoadSuccess(cssText: string, url: string): void {
		if (/all:\s*initial/.test(cssText)) {
			// eslint-disable-next-line no-console
			console.debug('[Chatbot] Detected `all: initial` in global.css');
		}
		// eslint-disable-next-line no-console
		console.log('[Chatbot] Successfully loaded styles from', url);
	}

	private _applyProtectiveOverrides(loadedGlobal: boolean): void {
		if (!this._shadowRoot) {
			return;
		}

		const override = document.createElement('style');
		override.dataset.source = 'chatbot-overrides';
		override.textContent = `style, script { display: none !important; }`;
		this._shadowRoot.appendChild(override);

		if (loadedGlobal) {
			// eslint-disable-next-line no-console
			console.debug('[Chatbot] Applied protective overrides after global.css');
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

		const language = this.getAttribute('language') ?? 'en';

		try {
			const content = (
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

			this._root.render(
				this._emotionCache ? <CacheProvider value={this._emotionCache}>{content}</CacheProvider> : content
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
