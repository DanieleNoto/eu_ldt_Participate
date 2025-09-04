import { useEffect, useState } from 'react';
import ErrorBoundary from './core/error/ErrorBoundary';
import { Chatbot } from './shared/components/Chatbot';

const App = () => {
	const [appIsLoaded, setAppIsLoaded] = useState(false);

	useEffect(() => {
		const loadConfig = async () => {
			try {
				// Try to load config.json, but don't fail if it's not available
				await fetch('/config/config.json');
			} catch (error) {
				// Config loading is optional for chatbot
				// eslint-disable-next-line no-console
				console.warn('Config not loaded, using defaults:', error);
			}
			setAppIsLoaded(true);
		};

		loadConfig();
	}, []);

	return (
		<ErrorBoundary>
			{appIsLoaded && (
				<div style={{ height: '100vh', width: '100vw' }}>
					<div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
						<Chatbot />
					</div>
				</div>
			)}
		</ErrorBoundary>
	);
};


export default App;
