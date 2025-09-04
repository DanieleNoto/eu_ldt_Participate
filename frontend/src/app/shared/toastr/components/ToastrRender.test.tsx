import { render, screen } from '@testing-library/react';
import { ToastrProps } from '@shared/toastr/model/toastr.props';
import ToastrRender from './ToastrRender';

// Mock Material-UI components
jest.mock('@mui/material', () => ({
	Snackbar: ({ children, open, anchorOrigin, sx, ...props }: {
		[key: string]: unknown;
		children: React.ReactNode;
		open: boolean;
		anchorOrigin?: { vertical: string; horizontal: string };
		sx?: Record<string, unknown>;
	}) => (
		<div data-testid="snackbar" data-open={open} data-anchor-vertical={anchorOrigin?.vertical} data-anchor-horizontal={anchorOrigin?.horizontal} style={sx} {...props}>
			{children}
		</div>
	),
	Alert: ({ children, severity, onClose, sx, ...props }: {
		[key: string]: unknown;
		children: React.ReactNode;
		severity?: string;
		onClose?: () => void;
		sx?: Record<string, unknown>;
	}) => (
		<div data-testid="alert" data-severity={severity} style={sx} {...props}>
			<button data-testid="alert-close" onClick={onClose}>×</button>
			{children}
		</div>
	)
}));

// Mock the selectors and hooks to return a default config
jest.mock('@app/store/config/config-slice.selectors', () => ({
	selectConfig: jest.fn(() => ({
		toastr: {
			vertical: 'top',
			horizontal: 'center'
		}
	}))
}));

jest.mock('@app/store/hook', () => ({
	useAppSelector: jest.fn((selector) => selector())
}));

// Import the mocked functions for use in tests
const { selectConfig: mockSelectConfig } = jest.requireMock('@app/store/config/config-slice.selectors');

// Mock the ToastrContext hook
jest.mock('@shared/toastr/context/ToastrContext', () => {
	const original = jest.requireActual('@shared/toastr/context/ToastrContext');
	return {
		...original,
		useToastrState: jest.fn(() => ({
			state: { toastr: new Map() },
			dispatch: jest.fn()
		}))
	};
});

// Import the mocked functions for use in tests
const { useToastrState: mockUseToastrState } = jest.requireMock('@shared/toastr/context/ToastrContext');

describe('ToastrRender Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset to default mock values
		mockSelectConfig.mockReturnValue({
			toastr: {
				vertical: 'top',
				horizontal: 'center'
			}
		});
		mockUseToastrState.mockReturnValue({
			state: { toastr: new Map() },
			dispatch: jest.fn()
		});
	});

	it('should render without toastrs when state is empty', () => {
		render(<ToastrRender />);
		expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
	});

	it('should render single toastr correctly', () => {
		const toastrMap = new Map<string, ToastrProps>();
		toastrMap.set('toast-1', {
			title: 'Test Title',
			text: 'Test Message',
			options: {
				status: 'success'
			},
			onClose: jest.fn()
		});

		mockUseToastrState.mockReturnValue({
			state: { toastr: toastrMap },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		expect(screen.getByTestId('snackbar')).toBeInTheDocument();
		expect(screen.getByTestId('snackbar')).toHaveAttribute('data-open', 'true');
		expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'success');
		expect(screen.getByText('Test Title')).toBeInTheDocument();
		expect(screen.getByText('Test Message')).toBeInTheDocument();
	});

	it('should render multiple toastrs correctly', () => {
		const toastrMap = new Map<string, ToastrProps>();
		toastrMap.set('toast-1', {
			title: 'First Toast',
			text: 'First Message',
			options: { status: 'info' },
			onClose: jest.fn()
		});
		toastrMap.set('toast-2', {
			title: 'Second Toast',
			text: 'Second Message',
			options: { status: 'error' },
			onClose: jest.fn()
		});

		mockUseToastrState.mockReturnValue({
			state: { toastr: toastrMap },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		const snackbars = screen.getAllByTestId('snackbar');
		const alerts = screen.getAllByTestId('alert');

		expect(snackbars).toHaveLength(2);
		expect(alerts).toHaveLength(2);
		
		expect(screen.getByText('First Toast')).toBeInTheDocument();
		expect(screen.getByText('First Message')).toBeInTheDocument();
		expect(screen.getByText('Second Toast')).toBeInTheDocument();
		expect(screen.getByText('Second Message')).toBeInTheDocument();
	});

	it('should use default anchor position from config', () => {
		mockSelectConfig.mockReturnValue({
			toastr: {
				vertical: 'bottom',
				horizontal: 'left'
			}
		});

		const toastrMap = new Map<string, ToastrProps>();
		toastrMap.set('toast-1', {
			title: 'Test',
			text: 'Message',
			options: { status: 'warning' }
		});

		mockUseToastrState.mockReturnValue({
			state: { toastr: toastrMap },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		const snackbar = screen.getByTestId('snackbar');
		expect(snackbar).toHaveAttribute('data-anchor-vertical', 'bottom');
		expect(snackbar).toHaveAttribute('data-anchor-horizontal', 'left');
	});

	it('should use fallback position when config is undefined', () => {
		// Mock the config without specific toastr positioning
		jest.mocked(mockSelectConfig).mockReturnValue({
			toastr: {
				vertical: '',
				horizontal: ''
			}
		});

		const toastrMap = new Map<string, ToastrProps>();
		toastrMap.set('toast-1', {
			title: 'Test',
			text: 'Message',
			options: { status: 'success' }
		});

		mockUseToastrState.mockReturnValue({
			state: { toastr: toastrMap },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		const snackbar = screen.getByTestId('snackbar');
		expect(snackbar).toHaveAttribute('data-anchor-vertical', 'top');
		expect(snackbar).toHaveAttribute('data-anchor-horizontal', 'center');
	});

	it('should handle toastr without text', () => {
		const toastrMap = new Map<string, ToastrProps>();
		toastrMap.set('toast-1', {
			title: 'Title Only',
			options: { status: 'info' }
		});

		mockUseToastrState.mockReturnValue({
			state: { toastr: toastrMap },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		expect(screen.getByText('Title Only')).toBeInTheDocument();
		// Check that there's no text element with content
		const paragraphs = screen.getAllByText('Title Only').filter(el => el.tagName === 'P');
		expect(paragraphs).toHaveLength(1);
	});

	it('should handle toastr without options', () => {
		const toastrMap = new Map<string, ToastrProps>();
		toastrMap.set('toast-1', {
			title: 'Simple Toast',
			text: 'Simple Message'
		});

		mockUseToastrState.mockReturnValue({
			state: { toastr: toastrMap },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		const alert = screen.getByTestId('alert');
		// When no options are provided, severity should be undefined, which doesn't set the attribute
		expect(alert).not.toHaveAttribute('data-severity');
		expect(screen.getByText('Simple Toast')).toBeInTheDocument();
		expect(screen.getByText('Simple Message')).toBeInTheDocument();
	});

	it('should call onClose when alert close button is clicked', () => {
		const mockOnClose = jest.fn();
		const toastrMap = new Map<string, ToastrProps>();
		toastrMap.set('toast-1', {
			title: 'Closable Toast',
			text: 'Click to close',
			options: { status: 'success' },
			onClose: mockOnClose
		});

		mockUseToastrState.mockReturnValue({
			state: { toastr: toastrMap },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		const closeButton = screen.getByTestId('alert-close');
		closeButton.click();

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should apply correct styling', () => {
		const toastrMap = new Map<string, ToastrProps>();
		toastrMap.set('toast-1', {
			title: 'Styled Toast',
			text: 'Styled Message',
			options: { status: 'error' }
		});

		mockUseToastrState.mockReturnValue({
			state: { toastr: toastrMap },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		const snackbar = screen.getByTestId('snackbar');
		expect(snackbar).toHaveStyle('margin-top: 80px');

		const alert = screen.getByTestId('alert');
		expect(alert).toHaveStyle('width: 100%; display: flex; align-items: center');
	});

	it('should handle different severity types', () => {
		const severityTypes = ['success', 'error', 'warning', 'info'];
		
		severityTypes.forEach(severity => {
			const toastrMap = new Map<string, ToastrProps>();
			toastrMap.set(`toast-${severity}`, {
				title: `${severity} Toast`,
				text: `${severity} Message`,
				options: { status: severity as 'success' | 'error' | 'warning' | 'info' }
			});

			mockUseToastrState.mockReturnValue({
				state: { toastr: toastrMap },
				dispatch: jest.fn()
			});

			const { unmount } = render(<ToastrRender />);

			const alert = screen.getByTestId('alert');
			expect(alert).toHaveAttribute('data-severity', severity);
			
			unmount();
		});
	});

	it('should handle empty toastr map gracefully', () => {
		mockUseToastrState.mockReturnValue({
			state: { toastr: new Map() },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
		expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
	});

	it('should handle undefined toastr map', () => {
		mockUseToastrState.mockReturnValue({
			state: { toastr: null as unknown as Map<string, ToastrProps> },
			dispatch: jest.fn()
		});

		render(<ToastrRender />);

		expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
		expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
	});
});
