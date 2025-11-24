// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
import { chatbotConfig } from '@config/chatbot.config';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import '../i18n';
import { ConfigProvider } from './config/ConfigContext';
import { ToastrProvider } from './shared/toastr/context/ToastrContext';
import { ConfigState, setBackendBaseUrl } from './store/config/config-slice';
import { store } from './store/store';
import { PALETTE } from './theme/styles/palette';

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
        frontend: override.frontend ? { ...base.frontend, ...override.frontend } : base.frontend,
        logger: override.logger ? { ...base.logger, ...override.logger } : base.logger,
        toastr: override.toastr ? { ...base.toastr, ...override.toastr } : base.toastr,
        dateFns: override.dateFns ? { ...base.dateFns, ...override.dateFns } : base.dateFns
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
		let active = true;
		const baseConfig = chatbotConfig;
		const getViteApiUrl = () => {
			// Priority: process.env (Node.js) > globalThis (runtime override) > import.meta.env (build time)
			const env = typeof process === 'undefined' ? undefined : (process.env as Record<string, string | undefined>);
			if (env?.VITE_API_URL) {
				return env.VITE_API_URL;
			}
			// Allow runtime override via globalThis (useful for embedding config at runtime)
			if (typeof globalThis !== 'undefined' && (globalThis as any).__VITE_API_URL__) {
				return (globalThis as any).__VITE_API_URL__;
			}
			// No build-time import.meta reference here to keep compatibility with test TS config
			return undefined;
		};

		const envBaseVar = normalizeBaseUrl(getViteApiUrl() ?? '');

		const applyWithEnvOverride = (override?: Partial<ConfigState>) => {
			if (!active) return;
			const merged = mergeConfig(baseConfig, override);
			const finalConfig = envBaseVar
				? mergeConfig(merged, { backend: { baseUrl: envBaseVar, api: merged.backend.api } })
				: merged;
			(globalThis as { __CHATBOT_CONFIG__?: ConfigState }).__CHATBOT_CONFIG__ = finalConfig;
			onConfigResolved(finalConfig);
			const finalBase = finalConfig.backend?.baseUrl;
			if (finalBase) {
				dispatch(setBackendBaseUrl(finalBase));
			}
			setInitialized(true); // Mark as initialized after config is set
		};

		const dynamicConfig = (globalThis as { __CHATBOT_CONFIG__?: ConfigState }).__CHATBOT_CONFIG__;
		if (dynamicConfig) {
			applyWithEnvOverride(dynamicConfig);
			return () => {
				active = false;
			};
		}

		const baseUrl = normalizeBaseUrl((globalThis as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ ?? '');
		
		if (!baseUrl) {
			applyWithEnvOverride();
			return () => {
				active = false;
			};
		}

		const controller = new AbortController();
		const fetchConfig = async () => {
			try {
				const response = await fetch(`${baseUrl}/config/config.json`, { signal: controller.signal });
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}
				const config = (await response.json()) as Partial<ConfigState>;
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

	
	// Don't render children until config is initialized
	if (!initialized) {
		return null;
	}

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
