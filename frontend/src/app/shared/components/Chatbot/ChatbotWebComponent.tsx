import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SimplifiedMainProvider from '@app/SimplifiedMainProvider';
import Chatbot from './Chatbot';
import '@src/i18n';
import '@theme/styles/global.css';

interface ChatbotWebComponentProps {
	language?: string;
	onSupportSent?: () => void;
	className?: string;
}

// NOTE: This component is intentionally referencing window.__CHATBOT_BASE_URL__ at runtime.
// The explicit string '__CHATBOT_BASE_URL__' and dynamic config fetch MUST remain so the
// federation build can rewrite asset URLs correctly. Do not inline /config/config.json without baseUrl.
const ChatbotWebComponent: React.FC<ChatbotWebComponentProps> = ({
	language = 'en',
	onSupportSent,
	className
}) => {
	const [configLoaded, setConfigLoaded] = useState(false);
	const { i18n } = useTranslation();

	useEffect(() => {
		// Change i18n language when language prop changes
		if (i18n.language !== language) {
			i18n.changeLanguage(language);
		}
	}, [language, i18n]);

	useEffect(() => {
		// Resolve base URL (loader sets window.__CHATBOT_BASE_URL__)
		const baseUrl = (window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ || '';
		const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
		// If we have a config injected already (SSR or earlier script), skip network fetch
		if ((window as { __CHATBOT_CONFIG__?: unknown }).__CHATBOT_CONFIG__) {
			setConfigLoaded(true);
			return;
		}
		if (!normalized) {
			// eslint-disable-next-line no-console
			console.warn('[Chatbot] Base URL missing, skipping remote config fetch');
			setConfigLoaded(true);
			return;
		}
		const controller = new AbortController();
		const configUrl = `${normalized}/config/config.json`;
		fetch(configUrl, { signal: controller.signal })
			.then(r => {
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				return r.json();
			})
			.then((config) => {
				(window as { __CHATBOT_CONFIG__?: unknown }).__CHATBOT_CONFIG__ = config;
				setConfigLoaded(true);
			})
			.catch(error => {
				if ((error as { name?: string }).name === 'AbortError') return;
				// eslint-disable-next-line no-console
				console.warn('[Chatbot] Failed to load config.json, using defaults:', error);
				setConfigLoaded(true);
			});
		return () => controller.abort();
	}, []);

	if (!configLoaded) {
		return null; // Don't show loading text, just wait silently
	}

	return (
		<SimplifiedMainProvider>
			<div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
				<Chatbot 
					language={language}
					onSupportSent={onSupportSent}
					className={className}
				/>
			</div>
		</SimplifiedMainProvider>
	);
};

export default ChatbotWebComponent;
