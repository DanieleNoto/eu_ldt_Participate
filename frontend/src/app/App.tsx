import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import getRoutes from './App.routes';
import ErrorBoundary from './core/error/ErrorBoundary';
import Router from './core/router/components/Router';
import ToastrRender from './shared/toastr/components/ToastrRender';
import { UIProvider } from './theme/context/UI';
import StandardLayout from './theme/layouts/standard/StandardLayout';

// Create a client
const queryClient = new QueryClient();

const ReactQueryDevtoolsProduction = React.lazy(() =>
	import('@tanstack/react-query-devtools/build/modern/production.js').then(d => ({
		default: d.ReactQueryDevtools
	}))
);

// TODO [HIGH][20250521][PieSpedica]: Refactor this in order to manage only a web component
const App = ({ standalone }: { standalone: boolean }) => {
	const [showDevtools, setShowDevtools] = React.useState(false);
	const routes = useCallback(() => getRoutes(standalone), [standalone]);

	React.useEffect(() => {
		// @ts-expect-error
		window.toggleDevtools = () => setShowDevtools(old => !old);
	}, []);

	return (
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<UIProvider>
					<StandardLayout standalone={standalone}>
						<>
							<Router routes={routes()}></Router>
							<ToastrRender />
							{showDevtools && (
								<React.Suspense fallback={null}>
									<ReactQueryDevtoolsProduction />
								</React.Suspense>
							)}
						</>
					</StandardLayout>
				</UIProvider>
			</QueryClientProvider>
		</ErrorBoundary>
	);
};

export default App;
