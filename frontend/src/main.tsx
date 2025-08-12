import App from '@app/App';
import { RUNTIME_APP_CONFIG } from '@app/App.config';
import MainProvider from '@app/MainProvider';
import '@src/i18n';
import '@theme/styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

fetch('/config/config.json')
	.then(response => response.json())
	.then(data => RUNTIME_APP_CONFIG.extend(data))
	.then(_ => {
		const root = document.getElementById('root');
		if (!!root) {
			createRoot(root).render(
				<StrictMode>
					<BrowserRouter>
						<MainProvider>
							<App standalone={true} />
						</MainProvider>
					</BrowserRouter>
				</StrictMode>
			);
		} else {
			throw new Error('Root element not found');
		}
	});
