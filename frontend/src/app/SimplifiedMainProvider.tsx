import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PALETTE } from './theme/styles/palette';
import { ToastrProvider } from './shared/toastr/context/ToastrContext';
import '../i18n';

// Minimal config slice for chatbot
const configSlice = createSlice({
	name: 'config',
	initialState: {
		config: {
			backend: {
				baseUrl: 'http://localhost:3000',
				api: [
					{
						name: 'chatMessage',
						url: '/api/v1/chat/',
						method: 'post',
						headers: {
							'Content-Type': 'application/json'
						}
					},
					{
						name: 'supportSend',
						url: '/api/v1/support/send',
						method: 'post',
						headers: {
							'Content-Type': 'application/json'
						}
					}
				]
			},
			toastr: {
				duration: 5000
			},
			logger: {
				level: 'info'
			},
			appName: 'EU LDT Participate Chatbot'
		}
	},
	reducers: {}
});

// Minimal store for chatbot
const chatbotStore = configureStore({
	reducer: {
		config: configSlice.reducer
	}
});

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

const SimplifiedMainProvider = ({ children }: { children: ReactNode }) => {
	return (
		<Provider store={chatbotStore}>
			<ThemeProvider theme={theme}>
				<QueryClientProvider client={queryClient}>
					<ToastrProvider>
						{children}
					</ToastrProvider>
				</QueryClientProvider>
			</ThemeProvider>
		</Provider>
	);
};

export default SimplifiedMainProvider;
