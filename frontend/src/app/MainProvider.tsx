import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { store } from './store/store';
import { PALETTE } from './theme/styles/palette';

// query client for tanstackQuery
const queryClient = new QueryClient({});

// theme settings for MUI
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
		},
		MuiInputBase: {
			styleOverrides: {
				input: {
					paddingLeft: '16px !important',
					paddingRight: '16px !important'
				}
			}
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					paddingLeft: '0px'
				},
				notchedOutline: {
					border: '1px solid',
					borderColor: '#6F797A',
					borderRadius: '4px'
				},
				// InputText
				input: {
					height: '48px',
					padding: 0,
					paddingLeft: '8px'
				},
				// TextArea
				inputMultiline: {
					height: '137px'
				}
			}
		},
		MuiAutocomplete: {
			styleOverrides: {
				root: {
					'& .MuiOutlinedInput-root': {
						height: '48px',
						padding: 0
					},
					'& .MuiAutocomplete-input': {
						height: 'auto'
					}
				},
				tag: {
					height: '32px', // Chip height
					'&:first-of-type': {
						marginLeft: '16px'
					}
				}
			}
		},
		MuiSelect: {
			styleOverrides: {
				root: {
					height: '48px',
					padding: '0px !important',
					paddingLeft: '8px'
				}
			}
		},
		MuiCard: {
			styleOverrides: {
				root: {
					border: '1px solid',
					borderRadius: '8px',
					borderColor: '#E9EBEF',
					boxShadow: 'none',
					backgroundColor: '#F6F8FA'
				}
			}
		},
		MuiTab: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					minWidth: 170,
					fontWeight: 600,
					backgroundColor: 'transparent',
					transition: 'background-color 200ms',
					'&:hover': {
						backgroundColor: '#ededed'
					}
				}
			}
		},
		MuiTableContainer: {
			styleOverrides: {
				root: {
					border: '1px solid',
					borderColor: '#D2D7DB',
					borderRadius: '8px'
				}
			}
		},
		MuiTableRow: {
			styleOverrides: {
				root: {
					'&:last-child .MuiTableCell-root': {
						borderBottom: 'none'
					}
				}
			}
		},
		MuiTableCell: {
			styleOverrides: {
				root: {
					height: '48px',
					padding: '8px'
				},
				head: {
					fontWeight: 'bolder'
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

const MainProvider = ({ children }: { children: ReactNode }) => {
	return (
		<Provider store={store}>
			<ThemeProvider theme={theme}>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</ThemeProvider>
		</Provider>
	);
};

export default MainProvider;
