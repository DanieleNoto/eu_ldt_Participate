import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Section from '@app/theme/components/section/Section';

// Mock useTranslation
jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key })
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
	useNavigate: () => mockNavigate
}));

// Helper to capture props passed to VerticalDotsAction
let lastMenuAction: any = null;
jest.mock('@app/theme/components/section/../menu/VerticalDotsActions', () => (props: any) => {
	lastMenuAction = props.menuAction;
	return <div data-testid="vertical-dots-actions">VerticalDotsAction</div>;
});

// Mock selector
const mockSelectSection = jest.fn();
jest.mock('@app/store/main/main-slice.selectors', () => ({
	selectSection: () => mockSelectSection()
}));

// Mock useAppSelector
jest.mock('@app/store/hook', () => ({
	useAppSelector: (fn: any) => fn()
}));

describe('Section', () => {
	const renderWithStore = (sectionState: any) => {
		mockSelectSection.mockReturnValue(sectionState);
		const store = configureStore({ reducer: { dummy: (s = {}) => s } });
		return render(
			<Provider store={store}>
				<Section />
			</Provider>
		);
	};

	afterEach(() => {
		jest.clearAllMocks();
		lastMenuAction = null;
	});

	it('does not render if section is null', () => {
		renderWithStore(null);
		expect(screen.queryByTestId('vertical-dots-actions')).not.toBeInTheDocument();
	});

	it('renders section title and back arrow', () => {
		renderWithStore({
			sectionTitle: 'Test Title',
			parentLink: '/parent',
			actions: []
		});
		expect(screen.getByText('Test Title')).toBeInTheDocument();
		expect(screen.getByTestId('ArrowBackIcon')).toBeTruthy();
	});

	it('does not render VerticalDotsAction if no actions', () => {
		renderWithStore({
			sectionTitle: 'Test Title',
			parentLink: '/parent',
			actions: []
		});
		expect(screen.queryByTestId('vertical-dots-actions')).not.toBeInTheDocument();
	});

	it('renders VerticalDotsAction if actions exist', () => {
		renderWithStore({
			sectionTitle: 'Test Title',
			parentLink: '/parent',
			actions: [
				{
					label: 'Export',
					actionType: 'EXPORT',
					dataTestId: 'export-action',
					iconType: 'export'
				}
			]
		});
		expect(screen.getByTestId('vertical-dots-actions')).toBeInTheDocument();
	});

	it('calls navigate when back arrow is clicked', () => {
		renderWithStore({
			sectionTitle: 'Test Title',
			parentLink: '/parent',
			actions: []
		});
		const backArrow = screen.getByTestId('ArrowBackIcon');
		fireEvent.click(backArrow);
		expect(mockNavigate).toHaveBeenCalledWith('/parent');
	});

	it('dispatches CustomEvent when action is clicked', () => {
		renderWithStore({
			sectionTitle: 'Test Title',
			parentLink: '/parent',
			actions: [
				{
					label: 'Export',
					actionType: 'EXPORT',
					dataTestId: 'export-action',
					iconType: 'export'
				}
			]
		});

		const eventSpy = jest.spyOn(window, 'dispatchEvent');
		if (Array.isArray(lastMenuAction) && lastMenuAction[0]) {
			lastMenuAction[0].action();
		}
		expect(eventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
		expect((eventSpy.mock.calls[0][0] as CustomEvent).detail).toBe('EXPORT');
	});
});
