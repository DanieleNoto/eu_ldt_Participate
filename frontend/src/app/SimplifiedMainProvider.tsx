import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ReactNode, useEffect, useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { chatbotConfig } from '@config/chatbot.config';
import { ConfigProvider } from './config/ConfigContext';
import { PALETTE } from './theme/styles/palette';
import { ToastrProvider } from './shared/toastr/context/ToastrContext';
import '../i18n';
import { store } from './store/store';
import { ConfigState, setBackendBaseUrl } from './store/config/config-slice';

// query client for tanstackQuery
const queryClient = new QueryClient({});

// theme settings for MUI - simplified for chatbot
const theme = createTheme({
	palette: {
		primary: {
			main: PALETTE.BLUE_PRIMARY
		}
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: '8px',
					textTransform: 'none',
					boxShadow: 'none'
				},
				outlined: {
					borderColor: '#6F797A',
					fontWeight: 700,
					color: '#004494'
				},
				containedPrimary: {
					'&:hover': {
						backgroundColor: '#001a41'
					}
				}
			}
		}
	},
	typography: {
		allVariants: {
			fontFamily: '"Open Sans", sans-serif !important'
		}
	}
});

// Internal component to initialize dynamic runtime values in Redux store
const mergeConfig = (base: ConfigState, override?: Partial<ConfigState>): ConfigState => {
	if (!override) {
		return { ...base };
	}
	return {
		appName: override.appName ?? base.appName,
		backend: {
			api: override.backend?.api ?? base.backend.api,
			baseUrl: override.backend?.baseUrl ?? base.backend.baseUrl
		},
		frontend: {
			...base.frontend,
			...(override.frontend ?? {})
		},
		logger: {
			...base.logger,
			...(override.logger ?? {})
		},
		toastr: {
			...base.toastr,
			...(override.toastr ?? {})
		},
		dateFns: {
			...base.dateFns,
			...(override.dateFns ?? {})
		}
	};
};

const normalizeBaseUrl = (value: string) => {
	if (!value) return '';
	return value.endsWith('/') ? value.slice(0, -1) : value;
};

const RuntimeConfigInitializer = ({
	children,
	onConfigResolved
}: {
	children: ReactNode;
	onConfigResolved: (config: ConfigState) => void;
}) => {
	const dispatch = useDispatch();
	const [initialized, setInitialized] = useState(false);

	useEffect(() => {
		console.log('[SimplifiedMainProvider] RuntimeConfigInitializer useEffect started');
		let active = true;
		const baseConfig = chatbotConfig;
		const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
		const envBaseVar = normalizeBaseUrl(metaEnv?.VITE_API_URL ?? '');
		console.log('[SimplifiedMainProvider] envBaseVar:', envBaseVar);

		const applyWithEnvOverride = (override?: Partial<ConfigState>) => {
			console.log('[SimplifiedMainProvider] applyWithEnvOverride called, active:', active, 'override:', override);
			if (!active) return;
			const merged = mergeConfig(baseConfig, override);
			const finalConfig = envBaseVar
				? mergeConfig(merged, { backend: { baseUrl: envBaseVar, api: merged.backend.api } })
				: merged;
			console.log('[SimplifiedMainProvider] finalConfig:', finalConfig);
			(window as { __CHATBOT_CONFIG__?: ConfigState }).__CHATBOT_CONFIG__ = finalConfig;
			onConfigResolved(finalConfig);
			const finalBase = finalConfig.backend?.baseUrl;
			console.log('[SimplifiedMainProvider] finalBase:', finalBase);
			if (finalBase) {
				dispatch(setBackendBaseUrl(finalBase));
				console.log('[SimplifiedMainProvider] Dispatched setBackendBaseUrl');
			}
			setInitialized(true); // Mark as initialized after config is set
			console.log('[SimplifiedMainProvider] setInitialized(true) called');
		};

		const dynamicConfig = (window as { __CHATBOT_CONFIG__?: ConfigState }).__CHATBOT_CONFIG__;
		console.log('[SimplifiedMainProvider] dynamicConfig:', dynamicConfig);
		if (dynamicConfig) {
			console.log('[SimplifiedMainProvider] Using dynamicConfig from window');
			applyWithEnvOverride(dynamicConfig);
			return () => {
				active = false;
			};
		}

		const baseUrl = normalizeBaseUrl((window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ || '');
		console.log('[SimplifiedMainProvider] baseUrl from window.__CHATBOT_BASE_URL__:', baseUrl);
		if (!baseUrl) {
			console.log('[SimplifiedMainProvider] No baseUrl, using defaults');
			applyWithEnvOverride();
			return () => {
				active = false;
			};
		}

		const controller = new AbortController();
		const fetchConfig = async () => {
			console.log('[SimplifiedMainProvider] Fetching config from:', `${baseUrl}/config/config.json`);
			try {
				const response = await fetch(`${baseUrl}/config/config.json`, { signal: controller.signal });
				console.log('[SimplifiedMainProvider] Fetch response status:', response.status);
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}
				const config = (await response.json()) as Partial<ConfigState>;
				console.log('[SimplifiedMainProvider] Fetched config:', config);
				if (!active) return;
				applyWithEnvOverride(config);
			} catch (error) {
				if (!active && (error as { name?: string }).name === 'AbortError') {
					return;
				}
				// eslint-disable-next-line no-console
				console.warn('[SimplifiedMainProvider] Failed to load config.json, using defaults:', error);
				if (!active) return;
				applyWithEnvOverride();
			}
		};

		fetchConfig();

		return () => {
			active = false;
			controller.abort();
		};
	}, [dispatch, onConfigResolved]);

	console.log('[SimplifiedMainProvider] Render - initialized:', initialized);
	
	// Don't render children until config is initialized
	if (!initialized) {
		console.log('[SimplifiedMainProvider] Returning null - not initialized yet');
		return null;
	}

	console.log('[SimplifiedMainProvider] Rendering children');
	return <>{children}</>;
};

const SimplifiedMainProvider = ({ children }: { children: ReactNode }) => {
	const [resolvedConfig, setResolvedConfig] = useState<ConfigState>(chatbotConfig);

	return (
		<Provider store={store}>
			<ConfigProvider config={resolvedConfig}>
				<ThemeProvider theme={theme}>
					<QueryClientProvider client={queryClient}>
						<ToastrProvider>
							<RuntimeConfigInitializer onConfigResolved={setResolvedConfig}>
								{children}
							</RuntimeConfigInitializer>
						</ToastrProvider>
					</QueryClientProvider>
				</ThemeProvider>
			</ConfigProvider>
		</Provider>
	);
};

export default SimplifiedMainProvider;
