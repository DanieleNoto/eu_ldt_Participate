import React, { lazy, useCallback, useEffect, useState } from 'react';
import getRoutes from './App.routes';
import ErrorBoundary from './core/error/ErrorBoundary';
import Router from './core/router/components/Router';
import ToastrRender from './shared/toastr/components/ToastrRender';
import { extendConfig } from './store/config/config-slice';
import { useAppDispatch, useAppSelector } from './store/hook';
import { setAppIsLoaded, setAppIsStandalone } from './store/main/main-slice';
import { selectAppIsLoaded } from './store/main/main-slice.selectors';
import StandardLayout from './theme/layouts/standard/StandardLayout';
// import AuthProvider from './shared/providers/AuthProvider';
import { Chatbot } from './shared/components/Chatbot';

const ReactQueryDevtoolsProduction = lazy(() =>
	import('@tanstack/react-query-devtools/build/modern/production.js').then(d => ({
		default: d.ReactQueryDevtools
	}))
);

const App = ({ standalone }: { standalone: boolean }) => {
	const [showDevtools, setShowDevtools] = useState(false);
	const appIsLoaded = useAppSelector(selectAppIsLoaded);

	const routes = useCallback(() => getRoutes(standalone), [standalone]);
	const dispatch = useAppDispatch();

	useEffect(() => {
		const loadConfig = async () => {
			const response = await fetch('/config/config.json');
			const flatConfig = await response.json();

			await dispatch(extendConfig(flatConfig));

			dispatch(setAppIsLoaded());
			dispatch(setAppIsStandalone(standalone));
		};

		loadConfig();
	}, [dispatch, standalone]);

	useEffect(() => {
		// @ts-expect-error
		window.toggleDevtools = () => setShowDevtools(old => !old);
	}, []);

	return (
		<ErrorBoundary>
			{appIsLoaded && (
				// exceptional declaration of AuthProvider in App to use appIsLoaded
				// all provider must be in MainProvider
				// IMPORTANT: config.json load may happens after the providers
					<StandardLayout standalone={standalone}>
						<Router routes={routes()} />
						<ToastrRender />
						{showDevtools && (
							<React.Suspense fallback={null}>
								<ReactQueryDevtoolsProduction />
							</React.Suspense>
						)}
						<div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
							<Chatbot />
						</div>
					</StandardLayout>
			)}
		</ErrorBoundary>
	);
};

export default App;
