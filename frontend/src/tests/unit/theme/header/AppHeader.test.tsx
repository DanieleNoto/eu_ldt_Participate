import { render, screen } from '@testing-library/react';
import AppHeader from '@app/theme/components/header/AppHeader';

// Mock `useTranslation`
jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key })
}));

describe('AppHeader', () => {
	test('Correctly renders logo and user icon when authenticated', () => {

		render(<AppHeader />);

		expect(screen.getByTestId('app-header')).toBeInTheDocument();
		expect(screen.getByTestId('app-header-logo')).toBeInTheDocument();
		expect(screen.getByTestId('app-header-user-account')).toBeInTheDocument();
    // Check the presence of user's info in 'app-header-user-account' when their will be implemented
	});

	test('Does not render user icon when not authenticated', () => {
		render(<AppHeader />);

		const headerUser = screen.queryByTestId('app-header-user-account');
		expect(headerUser).toBeInTheDocument();
		const childHeaderUser = headerUser?.hasChildNodes();
		expect(childHeaderUser).toBeFalsy();
	});
});
