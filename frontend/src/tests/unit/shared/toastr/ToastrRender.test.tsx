import ToastrRender from '@app/shared/toastr/components/ToastrRender';
import { render, screen } from '@testing-library/react';
const mockUseAppSelector = require('@app/store/hook').useAppSelector;
const mockSelectConfig = require('@app/store/config/config-slice.selectors').selectConfig;
const mockUseToastrState = require('@shared/toastr/context/ToastrContext').useToastrState;

// Mock dependencies
jest.mock('@app/store/hook', () => ({
	useAppSelector: jest.fn()
}));
jest.mock('@app/store/config/config-slice.selectors', () => ({
	selectConfig: jest.fn()
}));
jest.mock('@shared/toastr/context/ToastrContext', () => ({
	useToastrState: jest.fn()
}));

describe('ToastrRender', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSelectConfig.mockReturnValue({});
	});

	it('renders nothing when there are no toasts', () => {
		mockUseAppSelector.mockReturnValue({ toastr: {} });
		mockUseToastrState.mockReturnValue({ state: { toastr: new Map() } });

		render(<ToastrRender />);
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('renders a single toast with correct title and text', () => {
		mockUseAppSelector.mockReturnValue({ toastr: { vertical: 'top', horizontal: 'center' } });
		const onClose = jest.fn();
		const toastMap = new Map([
			[
				'1',
				{
					title: 'Test Title',
					text: 'Test message',
					onClose,
					options: { status: 'success' }
				}
			]
		]);
		mockUseToastrState.mockReturnValue({ state: { toastr: toastMap } });

		render(<ToastrRender />);
		expect(screen.getByText('Test Title')).toBeInTheDocument();
		expect(screen.getByText('Test message')).toBeInTheDocument();
		expect(screen.getByText('Test message')).toBeInTheDocument();
	});

	it('renders multiple toasts', () => {
		mockUseAppSelector.mockReturnValue({ toastr: { vertical: 'bottom', horizontal: 'left' } });
		const toastMap = new Map([
			[
				'1',
				{
					title: 'First',
					text: 'First message',
					onClose: jest.fn(),
					options: { status: 'info' }
				}
			],
			[
				'2',
				{
					title: 'Second',
					text: 'Second message',
					onClose: jest.fn(),
					options: { status: 'error' }
				}
			]
		]);
		mockUseToastrState.mockReturnValue({ state: { toastr: toastMap } });

		render(<ToastrRender />);
		expect(screen.getByText('First')).toBeInTheDocument();
		expect(screen.getByText('Second')).toBeInTheDocument();
		expect(screen.getAllByRole('alert')).toHaveLength(2);
	});

	it('uses default anchorOrigin if config is missing', () => {
		mockUseAppSelector.mockReturnValue({ toastr: {} });
		const toastMap = new Map([
			[
				'1',
				{
					title: 'Default',
					text: 'Default anchor',
					onClose: jest.fn(),
					options: { status: 'warning' }
				}
			]
		]);
		mockUseToastrState.mockReturnValue({ state: { toastr: toastMap } });

		render(<ToastrRender />);
		expect(screen.getByText('Default')).toBeInTheDocument();
	});
});
