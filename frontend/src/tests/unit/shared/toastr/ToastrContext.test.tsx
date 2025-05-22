import { render, act } from '@testing-library/react';
import { ToastrProvider, useToastrState } from '@shared/toastr/context/ToastrContext';

const ToastrTestComponent = () => {
	const { state, dispatch } = useToastrState();
	const count = state.toastr ? state.toastr.size : 0;

	return (
		<div>
			<span data-testid="toastr-count">{count}</span>
			<button
				data-testid="show"
				onClick={() =>
					dispatch({
						type: 'showToastr',
						payload: {
							uuid: '1',
							toastr: { message: 'Hello', type: 'success' }
						}
					})
				}
			>
				Show
			</button>
			<button
				data-testid="hide"
				onClick={() =>
					dispatch({
						type: 'hideToastr',
						payload: { uuid: '1' }
					})
				}
			>
				Hide
			</button>
		</div>
	);
};

describe('ToastrContext', () => {
	it('should add and remove toasts', () => {
		const { getByTestId } = render(
			<ToastrProvider>
				<ToastrTestComponent />
			</ToastrProvider>
		);

		expect(getByTestId('toastr-count').textContent).toBe('0');

		// show toast
		act(() => {
			getByTestId('show').click();
		});
		expect(getByTestId('toastr-count').textContent).toBe('1');

		// hide toast
		act(() => {
			getByTestId('hide').click();
		});
		expect(getByTestId('toastr-count').textContent).toBe('0');
	});

	it('returns context object even if used outside provider', () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		const Broken = () => {
			useToastrState();
			return null;
		};
		expect(() => render(<Broken />)).not.toThrow();
		spy.mockRestore();
	});
});
