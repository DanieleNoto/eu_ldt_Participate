import MainMenu from '@app/theme/components/menu/MainMenu';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

describe('MainMenu Component', () => {
	test('Correctly renders the main menu', () => {
		render(
			<MemoryRouter>
				<MainMenu />
			</MemoryRouter>
		);

		expect(screen.getByTestId('main-menu')).toBeInTheDocument();
	});

	test('Renders all navigation links correctly', () => {
		render(
			<MemoryRouter>
				<MainMenu />
			</MemoryRouter>
		);

		const links = screen.getAllByRole('link');
		expect(links).toHaveLength(3);

		expect(screen.getByTestId('main-menu-link-0')).toHaveAttribute('href', '/dashboard');
		expect(screen.getByTestId('main-menu-link-1')).toHaveAttribute('href', '/simulation');
		expect(screen.getByTestId('main-menu-link-2')).toHaveAttribute('href', '/parameters');
	});

	test('Renders icons and labels for each navigation link', () => {
		render(
			<MemoryRouter>
				<MainMenu />
			</MemoryRouter>
		);

		expect(screen.getByTestId('main-menu-icon-0')).toBeInTheDocument();
		expect(screen.getByTestId('main-menu-icon-1')).toBeInTheDocument();

		expect(screen.getByTestId('main-menu-label-0')).toHaveTextContent('Dashboard');
		expect(screen.getByTestId('main-menu-label-1')).toHaveTextContent('Simulation');
	});

	test('Applies the active class when a link is active', () => {
		render(
			<MemoryRouter initialEntries={['/dashboard']}>
				<MainMenu />
			</MemoryRouter>
		);

		const activeLink = screen.getByTestId('main-menu-link-0');
		expect(activeLink).toHaveClass('uc:bg-[#FBE186]');
	});

	test('applies the inactive class when a link is not active', () => {
		render(
			<MemoryRouter initialEntries={['/dashboard']}>
				<MainMenu />
			</MemoryRouter>
		);

		const inactiveLink = screen.getByTestId('main-menu-link-1');
		expect(inactiveLink).not.toHaveClass('uc:bg-[#F6F8FA]');
	});
});
