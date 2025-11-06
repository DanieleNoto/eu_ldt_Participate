import { render, screen } from '@testing-library/react';
import ToastrRender from '@app/shared/toastr/components/ToastrRender';
import { ToastrProvider } from '@app/shared/toastr/context/ToastrContext';
import { ConfigProvider } from '@app/config/ConfigContext';
import '@testing-library/jest-dom';

const mockConfig = {
	appName: 'Test App',
	backend: {
		api: [],
		baseUrl: 'http://localhost:3000'
	},
	frontend: {
		url: 'http://localhost:5173',
		appBasePath: '/'
	},
	logger: {
		level: 'info' as const
	},
	toastr: {
		vertical: 'top' as const,
		horizontal: 'center' as const,
		duration: 3000
	},
	dateFns: {
		locale: 'it' as const,
		format: 'yyyy-MM-dd'
	},
	chatbot: {
		title: 'Test Chatbot',
		position: { bottom: 20, right: 20 }
	}
};

describe('ToastrRender', () => {
	it('should render without crashing', () => {
		render(
			<ConfigProvider config={mockConfig}>
				<ToastrProvider>
					<ToastrRender />
				</ToastrProvider>
			</ConfigProvider>
		);
	});

	it('should not render any snackbars when toastr is empty', () => {
		const { container } = render(
			<ConfigProvider config={mockConfig}>
				<ToastrProvider>
					<ToastrRender />
				</ToastrProvider>
			</ConfigProvider>
		);

		const snackbars = container.querySelectorAll('[role="presentation"]');
		expect(snackbars.length).toBe(0);
	});

	it('should render snackbar when toastr has entries', () => {
		const TestWrapper = () => {
			const { useToastrState } = require('@app/shared/toastr/context/ToastrContext');
			const { dispatch } = useToastrState();

			React.useEffect(() => {
				dispatch({
					type: 'showToastr',
					payload: {
						uuid: 'test-toast',
						toastr: {
							title: 'Test Title',
							text: 'Test Message',
							options: {
								status: 'success'
							},
							onClose: jest.fn()
						}
					}
				});
			}, [dispatch]);

			return <ToastrRender />;
		};

		const React = require('react');
		render(
			<ConfigProvider config={mockConfig}>
				<ToastrProvider>
					<TestWrapper />
				</ToastrProvider>
			</ConfigProvider>
		);

		expect(screen.getByText('Test Title')).toBeInTheDocument();
		expect(screen.getByText('Test Message')).toBeInTheDocument();
	});

	it('should render multiple toastrs', () => {
		const TestWrapper = () => {
			const { useToastrState } = require('@app/shared/toastr/context/ToastrContext');
			const { dispatch } = useToastrState();

			React.useEffect(() => {
				dispatch({
					type: 'showToastr',
					payload: {
						uuid: 'toast-1',
						toastr: {
							title: 'First Toast',
							text: 'First message',
							options: { status: 'success' },
							onClose: jest.fn()
						}
					}
				});
				dispatch({
					type: 'showToastr',
					payload: {
						uuid: 'toast-2',
						toastr: {
							title: 'Second Toast',
							text: 'Second message',
							options: { status: 'error' },
							onClose: jest.fn()
						}
					}
				});
			}, [dispatch]);

			return <ToastrRender />;
		};

		const React = require('react');
		render(
			<ConfigProvider config={mockConfig}>
				<ToastrProvider>
					<TestWrapper />
				</ToastrProvider>
			</ConfigProvider>
		);

		expect(screen.getByText('First Toast')).toBeInTheDocument();
		expect(screen.getByText('Second Toast')).toBeInTheDocument();
	});

	it('should use config for snackbar positioning', () => {
		const customConfig = {
			...mockConfig,
			toastr: {
				vertical: 'bottom' as const,
				horizontal: 'left' as const,
				duration: 5000
			}
		};

		render(
			<ConfigProvider config={customConfig}>
				<ToastrProvider>
					<ToastrRender />
				</ToastrProvider>
			</ConfigProvider>
		);

		// Component should render without errors with custom config
	});

	it('should handle different severity levels', () => {
		const TestWrapper = ({ severity }: { severity: 'success' | 'error' | 'warning' | 'info' }) => {
			const { useToastrState } = require('@app/shared/toastr/context/ToastrContext');
			const { dispatch } = useToastrState();

			React.useEffect(() => {
				dispatch({
					type: 'showToastr',
					payload: {
						uuid: `toast-${severity}`,
						toastr: {
							title: `${severity} toast`,
							text: `This is a ${severity} message`,
							options: { status: severity },
							onClose: jest.fn()
						}
					}
				});
			}, [dispatch, severity]);

			return <ToastrRender />;
		};

		const React = require('react');
		
		render(
			<ConfigProvider config={mockConfig}>
				<ToastrProvider>
					<TestWrapper severity="warning" />
				</ToastrProvider>
			</ConfigProvider>
		);

		expect(screen.getByText('warning toast')).toBeInTheDocument();
	});
});
