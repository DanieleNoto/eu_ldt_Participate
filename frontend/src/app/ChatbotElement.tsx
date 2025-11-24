// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import { createRoot, Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import SimplifiedMainProvider from './SimplifiedMainProvider';
import Chatbot from './shared/components/Chatbot/Chatbot';

class ChatbotCustomElement extends HTMLElement {
	private _root: Root | null = null;
	private _mountPoint: HTMLDivElement | null = null;

	static get observedAttributes() {
		return ['language'];
	}

	connectedCallback() {
		// Create mount point
		this._mountPoint = document.createElement('div');
		this._mountPoint.className = 'chatbot-root';
		this._mountPoint.style.position = 'fixed';
		this._mountPoint.style.bottom = '1rem';
		this._mountPoint.style.right = '1rem';
		this._mountPoint.style.zIndex = '50';
		this.appendChild(this._mountPoint);
		
		// Initialize React root
		try {
			this._root = createRoot(this._mountPoint);
			this._render();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to initialize React root:', error);
		}
	}

	disconnectedCallback() {
		if (this._root) {
			try {
				this._root.unmount();
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to unmount React root:', error);
			}
			this._root = null;
		}
		if (this._mountPoint) {
			this._mountPoint.remove();
			this._mountPoint = null;
		}
	}

	attributeChangedCallback() {
		if (this._root) {
			this._render();
		}
	}

	private _render() {
		if (!this._root) return;
		
		const language = this.getAttribute('language') ?? 'en';
		
		try {
			this._root.render(
				<Provider store={store}>
					<SimplifiedMainProvider>
						<Chatbot
							language={language}
							onSupportSent={() => {
								this.dispatchEvent(new CustomEvent('supportSent', {
									bubbles: true,
									detail: { timestamp: new Date().toISOString() }
								}));
							}}
						/>
					</SimplifiedMainProvider>
				</Provider>
			);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to render chatbot:', error);
		}
	}
}

// Define the custom element
if (!customElements.get('eu-chatbot')) {
	customElements.define('eu-chatbot', ChatbotCustomElement);
}

export default ChatbotCustomElement;
