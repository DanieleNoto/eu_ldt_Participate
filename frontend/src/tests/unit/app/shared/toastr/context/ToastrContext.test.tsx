// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import { render, screen, act, cleanup } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ToastrProvider, useToastrState } from '@app/shared/toastr/context/ToastrContext';

// Mock the toastr props model
jest.mock('@shared/toastr/model/toastr.props', () => ({
	ToastrProps: {}
}));

describe('ToastrContext', () => {
	// Clean up after each test to prevent state leakage
	afterEach(() => {
		cleanup();
	});
	// Test component that uses the toastr context
	const TestComponent = ({ testId }: { testId: string }) => {
		const { state, dispatch } = useToastrState();
		
		const showToastr = () => {
			dispatch({
				type: 'showToastr',
				payload: {
					uuid: 'test-uuid',
					toastr: {
						message: 'Test message',
						type: 'success'
					}
				}
			});
		};

		const hideToastr = () => {
			dispatch({
				type: 'hideToastr',
				payload: {
					uuid: 'test-uuid'
				}
			});
		};

		return (
			<div data-testid={testId}>
				<button data-testid="show-toastr" onClick={showToastr}>
					Show Toastr
				</button>
				<button data-testid="hide-toastr" onClick={hideToastr}>
					Hide Toastr
				</button>
				<div data-testid="toastr-count">
					{state.toastr?.size || 0}
				</div>
			</div>
		);
	};

	const TestComponentWithError = () => {
		const { dispatch } = useToastrState();
		
		const triggerError = () => {
			dispatch({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type: 'invalidAction' as any,
				payload: {}
			});
		};

		return (
			<button data-testid="trigger-error" onClick={triggerError}>
				Trigger Error
			</button>
		);
	};

	describe('ToastrProvider', () => {
		it('should render children correctly', () => {
			render(
				<ToastrProvider>
					<div data-testid="child">Test Child</div>
				</ToastrProvider>
			);

			expect(screen.getByTestId('child')).toBeInTheDocument();
		});

		it('should provide toastr context to children', () => {
			render(
				<ToastrProvider>
					<TestComponent testId="test-component" />
				</ToastrProvider>
			);

			expect(screen.getByTestId('test-component')).toBeInTheDocument();
			expect(screen.getByTestId('toastr-count')).toHaveTextContent('0');
		});

		it('should initialize with empty toastr map', () => {
			render(
				<ToastrProvider>
					<TestComponent testId="test-component" />
				</ToastrProvider>
			);

			expect(screen.getByTestId('toastr-count')).toHaveTextContent('0');
		});
	});

	describe('ToastrReducer - showToastr action', () => {
		it('should add toastr to state when showToastr is dispatched', () => {
			render(
				<ToastrProvider>
					<TestComponent testId="test-component" />
				</ToastrProvider>
			);

			act(() => {
				screen.getByTestId('show-toastr').click();
			});

			expect(screen.getByTestId('toastr-count')).toHaveTextContent('1');
		});

		it('should handle multiple toastrs', () => {
			const MultipleToastrsComponent = () => {
				const { state, dispatch } = useToastrState();
				
				const showMultipleToastrs = () => {
					dispatch({
						type: 'showToastr',
						payload: {
							uuid: 'toast-1',
							toastr: { message: 'Message 1', type: 'success' }
						}
					});
					dispatch({
						type: 'showToastr',
						payload: {
							uuid: 'toast-2',
							toastr: { message: 'Message 2', type: 'error' }
						}
					});
				};

				return (
					<div>
						<button data-testid="show-multiple" onClick={showMultipleToastrs}>
							Show Multiple
						</button>
						<div data-testid="toastr-count">{state.toastr?.size || 0}</div>
					</div>
				);
			};

			render(
				<ToastrProvider>
					<MultipleToastrsComponent />
				</ToastrProvider>
			);

			act(() => {
				screen.getByTestId('show-multiple').click();
			});

			expect(screen.getByTestId('toastr-count')).toHaveTextContent('2');
		});
	});

	describe('ToastrReducer - hideToastr action', () => {
		it('should remove toastr from state when hideToastr is dispatched', () => {
			render(
				<ToastrProvider>
					<TestComponent testId="test-component" />
				</ToastrProvider>
			);

			// First show a toastr
			act(() => {
				screen.getByTestId('show-toastr').click();
			});

			expect(screen.getByTestId('toastr-count')).toHaveTextContent('1');

			// Then hide it
			act(() => {
				screen.getByTestId('hide-toastr').click();
			});

			expect(screen.getByTestId('toastr-count')).toHaveTextContent('0');
		});

		it('should handle hiding non-existent toastr gracefully', () => {
			render(
				<ToastrProvider>
					<TestComponent testId="test-component" />
				</ToastrProvider>
			);

			// Try to hide a toastr that doesn't exist
			act(() => {
				screen.getByTestId('hide-toastr').click();
			});

			expect(screen.getByTestId('toastr-count')).toHaveTextContent('0');
		});
	});

	describe('ToastrReducer - error handling', () => {
		it('should throw error for unhandled action types', () => {
			// Suppress console.error for this test
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			expect(() => {
				render(
					<ToastrProvider>
						<TestComponentWithError />
					</ToastrProvider>
				);

				act(() => {
					screen.getByTestId('trigger-error').click();
				});
			}).toThrow('unhandled action');

			consoleSpy.mockRestore();
		});
	});

	describe('useToastrState hook', () => {
		it('should throw error when used outside ToastrProvider', () => {
			// Suppress console.error for this test
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			expect(() => {
				renderHook(() => useToastrState());
			}).toThrow('useToastrState must be used within a ToastrProvider');

			consoleSpy.mockRestore();
		});

		it('should return context when used inside ToastrProvider', () => {
			const ComponentInsideProvider = () => {
				const context = useToastrState();
				expect(context).toBeDefined();
				expect(context.state).toBeDefined();
				expect(context.dispatch).toBeDefined();
				return <div data-testid="success">Success</div>;
			};

			render(
				<ToastrProvider>
					<ComponentInsideProvider />
				</ToastrProvider>
			);

			expect(screen.getByTestId('success')).toBeInTheDocument();
		});
	});

	describe('payload handling', () => {
		it('should handle different payload structures', () => {
			const PayloadTestComponent = () => {
				const { state, dispatch } = useToastrState();
				
				const showCustomToastr = () => {
					dispatch({
						type: 'showToastr',
						payload: {
							uuid: 'custom-uuid',
							toastr: {
								message: 'Custom message',
								type: 'warning',
								duration: 3000,
								actions: []
							}
						}
					});
				};

				return (
					<div>
						<button data-testid="show-custom" onClick={showCustomToastr}>
							Show Custom
						</button>
						<div data-testid="toastr-count">{state.toastr?.size || 0}</div>
					</div>
				);
			};

			render(
				<ToastrProvider>
					<PayloadTestComponent />
				</ToastrProvider>
			);

			act(() => {
				screen.getByTestId('show-custom').click();
			});

			expect(screen.getByTestId('toastr-count')).toHaveTextContent('1');
		});
	});
});
