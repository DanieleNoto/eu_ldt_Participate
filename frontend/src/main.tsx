import App from '@app/App';
import { RUNTIME_APP_CONFIG } from '@app/App.config';
import SimplifiedMainProvider from '@app/SimplifiedMainProvider';
import '@src/i18n';
import '@theme/styles/global.css';
// Register the chatbot web component
import '@app/ChatbotElementWrapper';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

// Get base URL for fetching config (supports embedding as web component)
const getBaseUrl = () => {
	const baseUrl = (window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__;
	if (baseUrl) {
		return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
	}
	return '';
};

const configUrl = `${getBaseUrl()}/config/config.json`;

fetch(configUrl)
	.then(response => response.json())
	.then(data => RUNTIME_APP_CONFIG.extend(data))
	.then(_ => {
		const root = document.getElementById('root');
		if (!!root) {
			createRoot(root).render(
				<StrictMode>
					<BrowserRouter>
						<SimplifiedMainProvider>
							<App />
						</SimplifiedMainProvider>
					</BrowserRouter>
				</StrictMode>
			);
		} else {
			throw new Error('Root element not found');
		}
	});
