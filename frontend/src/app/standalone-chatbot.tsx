import React, { useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import i18n from '../i18n';
import SimplifiedMainProvider from './SimplifiedMainProvider';
import Chatbot from './shared/components/Chatbot/Chatbot';
import '@theme/styles/global.css';

// Simple standalone chatbot component for web component use
const StandaloneChatbot: React.FC<{ initialLanguage?: string }> = ({ 
	initialLanguage = 'en'
}) => {
	const [language, setLanguage] = useState(initialLanguage);

	// Set initial language in i18n
	React.useEffect(() => {
		i18n.changeLanguage(initialLanguage);
	}, [initialLanguage]);

	// Expose language change method to the web component
	React.useEffect(() => {
		const element = document.querySelector('eu-chatbot');
		if (element) {
			(element as HTMLElement & { changeLanguage: (lang: string) => void }).changeLanguage = (newLanguage: string) => {
				setLanguage(newLanguage);
				i18n.changeLanguage(newLanguage);
			};
		}
	}, []);

	return (
		<SimplifiedMainProvider>
			<Chatbot language={language} />
		</SimplifiedMainProvider>
	);
};

// Web component class
class ChatbotWebElement extends HTMLElement {
	private _root: Root | null = null;

	static get observedAttributes() {
		return ['language'];
	}

	connectedCallback() {
		this._mount();
	}

	disconnectedCallback() {
		this._unmount();
	}

	attributeChangedCallback() {
		if (this._root) {
			this._mount(); // Remount with new attributes
		}
	}

	private _mount() {
		if (this._root) {
			this._unmount();
		}

		const language = this.getAttribute('language') || 'en';
		
		try {
			this._root = createRoot(this);
			this._root.render(
				<StandaloneChatbot 
					initialLanguage={language}
				/>
			);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to mount chatbot:', error);
		}
	}

	private _unmount() {
		if (this._root) {
			try {
				this._root.unmount();
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to unmount chatbot:', error);
			}
			this._root = null;
		}
	}
}

// Register the web component
if (!customElements.get('eu-chatbot')) {
	customElements.define('eu-chatbot', ChatbotWebElement);
}

export default ChatbotWebElement;
