/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Menu from '@app/theme/components/menu/Menu';
import { MenuLevel } from '@app/pages/Pages.menu';
import { useAppSelector } from '@app/store/hook';
import { selectMenuItems, selectSection } from '@app/store/main/main-slice.selectors';

jest.mock('@app/store/hook', () => ({
	useAppSelector: jest.fn()
}));

jest.mock('@theme/context/UI', () => ({
	useUIState: () => ({ dispatch: jest.fn() })
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, options?: any) => (options && options.defaultValue ? options.defaultValue : key)
	})
}));

// Mock di getMenuItems
jest.mock('@app/pages/Pages.menu', () => {
	const originalModule = jest.requireActual('@app/pages/Pages.menu');
	return {
		...originalModule,
		getMenuItems: jest.fn(() => [
			{ title: 'cases.title', link: 'simulation/cases/list', iconKey: 'CASES' },
			{ title: 'scenarios.title', link: 'simulation/scenarios/list', iconKey: 'SCENARIOS' },
			{ title: 'experiments.title', link: 'simulation/experiments/list', iconKey: 'EXPERIMENTS' }
		])
	};
});

describe('Menu component', () => {
	const renderMenu = (menuId: string = 'test-menu') => {
		return render(
			<MemoryRouter>
				<Menu menuId={menuId} />
			</MemoryRouter>
		);
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	(useAppSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
		if (selector === selectMenuItems) return [];
		if (selector === selectSection) return null;
		return undefined;
	});

	test('renders the menu container with correct data-testid', () => {
		renderMenu();

		expect(screen.getByTestId('menu')).toBeInTheDocument();
	});

	test('renders PRIMARY heading when no section is present', () => {
		renderMenu();

		const primaryHeading = screen.getByTestId(`menu-${MenuLevel.PRIMARY}`);
		expect(primaryHeading).toBeInTheDocument();
		expect(primaryHeading).toHaveTextContent('sections.simulation');
	});

	test('does not render PRIMARY heading when section is present (menuLevel SECONDARY)', () => {
		(useAppSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
			if (selector === selectMenuItems) return [];
			if (selector === selectSection) return { id: 'sec1', title: 'Section Title' };
			return undefined;
		});

		renderMenu();
		expect(screen.queryByTestId(`menu-${MenuLevel.PRIMARY}`)).not.toBeInTheDocument();
	});

	test('renders menu items correctly from getMenuItems', () => {
		(useAppSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
			if (selector === selectMenuItems) return [];
			if (selector === selectSection) return null;
			return undefined;
		});

		renderMenu();
		expect(screen.getByTestId('menu-link-0')).toBeInTheDocument();
		expect(screen.getByTestId('menu-link-1')).toBeInTheDocument();
		expect(screen.getByTestId('menu-link-2')).toBeInTheDocument();
	});
});
