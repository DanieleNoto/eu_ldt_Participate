import { render } from '@testing-library/react';
import Pages from '@app/pages/Pages';

jest.mock('react-router', () => ({
	Outlet: () => <div data-testid="outlet" />
}));

describe('Pages', () => {
	it('renders the Outlet component', () => {
		const { getByTestId } = render(<Pages />);
		expect(getByTestId('outlet')).toBeInTheDocument();
	});
});
