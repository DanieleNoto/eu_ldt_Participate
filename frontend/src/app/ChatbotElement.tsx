import React from 'react';
import { createRoot } from 'react-dom/client';
import { Root } from 'react-dom/client';
import ChatbotWebComponent from './shared/components/Chatbot/ChatbotWebComponent';

class ChatbotCustomElement extends HTMLElement {
	private _root: Root | null = null;
	private _mountPoint: HTMLDivElement | null = null;

	static get observedAttributes() {
		return ['language'];
	}

	connectedCallback() {
		// Create mount point
		this._mountPoint = document.createElement('div');
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
		
		const language = this.getAttribute('language') || 'en';
		
		try {
			this._root.render(
				React.createElement(ChatbotWebComponent, {
					language,
					onSupportSent: () => {
						// Dispatch custom event for parent page
						this.dispatchEvent(new CustomEvent('supportSent', {
							bubbles: true,
							detail: { timestamp: new Date().toISOString() }
						}));
					}
				})
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
