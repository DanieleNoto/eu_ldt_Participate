import { renderHook, act } from '@testing-library/react';
import { ToastrProps } from '@shared/toastr/model/toastr.props';
import { useToastrState } from '@shared/toastr/context/ToastrContext';
import { useToastr } from './useToastr';

// Mock the ToastrContext
jest.mock('@shared/toastr/context/ToastrContext');
const mockUseToastrState = useToastrState as jest.MockedFunction<typeof useToastrState>;

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('useToastr Hook', () => {
	const mockDispatch = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.clearAllTimers();
		
		// Mock the context to return our mock dispatch
		mockUseToastrState.mockReturnValue({
			state: { toastr: new Map() },
			dispatch: mockDispatch
		});
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
		jest.useFakeTimers();
	});

	describe('toastr method', () => {
		it('should dispatch showToastr action with correct payload', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Test Title',
				text: 'Test Message',
				options: {
					status: 'info'
				}
			};

			act(() => {
				result.current.toastr(props);
			});

			expect(mockDispatch).toHaveBeenCalledWith({
				type: 'showToastr',
				payload: {
					uuid: expect.any(String),
					toastr: props
				}
			});
		});

		it('should use default delay of 5000ms when not specified', () => {
			const { result } = renderHook(() => useToastr()); // No delay parameter
			
			const props: ToastrProps = {
				title: 'Test Title',
				text: 'Test Message'
			};

			act(() => {
				result.current.toastr(props);
			});

			// Clear the dispatch mock to check hideToastr call
			mockDispatch.mockClear();

			// Fast-forward time by default delay (5000ms)
			act(() => {
				jest.advanceTimersByTime(5000);
			});

			expect(mockDispatch).toHaveBeenCalledWith({
				type: 'hideToastr',
				payload: { uuid: expect.any(String) }
			});
		});

		it('should use custom delay when specified', () => {
			const customDelay = 3000;
			const { result } = renderHook(() => useToastr(customDelay));
			
			const props: ToastrProps = {
				title: 'Test Title',
				text: 'Test Message'
			};

			act(() => {
				result.current.toastr(props);
			});

			// Clear the dispatch mock to check hideToastr call
			mockDispatch.mockClear();

			// Fast-forward time by custom delay
			act(() => {
				jest.advanceTimersByTime(customDelay);
			});

			expect(mockDispatch).toHaveBeenCalledWith({
				type: 'hideToastr',
				payload: { uuid: expect.any(String) }
			});
		});

		it('should generate unique UUID for each toast', () => {
			const { result } = renderHook(() => useToastr());
			
			const props1: ToastrProps = {
				title: 'Test 1',
				text: 'Message 1'
			};
			
			const props2: ToastrProps = {
				title: 'Test 2',
				text: 'Message 2'
			};

			act(() => {
				result.current.toastr(props1);
				result.current.toastr(props2);
			});

			const firstUuid = mockDispatch.mock.calls[0][0].payload.uuid;
			const secondUuid = mockDispatch.mock.calls[1][0].payload.uuid;
			
			expect(firstUuid).not.toBe(secondUuid);
			expect(firstUuid).toMatch(/^id-[0-9a-z]{9}$/);
			expect(secondUuid).toMatch(/^id-[0-9a-z]{9}$/);
		});

		it('should automatically hide toast after delay', () => {
			const { result } = renderHook(() => useToastr(3000));
			
			const props: ToastrProps = {
				title: 'Test Title',
				text: 'Test Message'
			};

			act(() => {
				result.current.toastr(props);
			});

			// Get the UUID from the showToastr call
			const showCall = mockDispatch.mock.calls[0][0];
			const uuid = showCall.payload.uuid;

			// Clear the dispatch mock to check hideToastr call
			mockDispatch.mockClear();

			// Fast-forward time
			act(() => {
				jest.advanceTimersByTime(3000);
			});

			expect(mockDispatch).toHaveBeenCalledWith({
				type: 'hideToastr',
				payload: { uuid }
			});
		});

		it('should handle empty options object', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Test Title',
				text: 'Test Message',
				options: {}
			};

			act(() => {
				result.current.toastr(props);
			});

			expect(mockDispatch).toHaveBeenCalledWith({
				type: 'showToastr',
				payload: {
					uuid: expect.any(String),
					toastr: props
				}
			});
		});
	});

	describe('info method', () => {
		it('should call toastr with info status', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Info Title',
				text: 'Info Message'
			};

			act(() => {
				result.current.info(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options?.status).toBe('info');
			expect(dispatchCall.payload.toastr.title).toBe('Info Title');
			expect(dispatchCall.payload.toastr.text).toBe('Info Message');
		});

		it('should override existing status with info', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Info Title',
				text: 'Info Message',
				options: {
					status: 'error' // This should be overridden
				}
			};

			act(() => {
				result.current.info(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options?.status).toBe('info');
		});

		it('should preserve other options when setting info status', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Info Title',
				text: 'Info Message',
				options: {
					showClose: true,
					status: 'error'
				}
			};

			act(() => {
				result.current.info(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options?.status).toBe('info');
			expect(dispatchCall.payload.toastr.options?.showClose).toBe(true);
		});
	});

	describe('success method', () => {
		it('should call toastr with success status', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Success Title',
				text: 'Success Message'
			};

			act(() => {
				result.current.success(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options?.status).toBe('success');
			expect(dispatchCall.payload.toastr.title).toBe('Success Title');
			expect(dispatchCall.payload.toastr.text).toBe('Success Message');
		});

		it('should override existing status with success', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Success Title',
				text: 'Success Message',
				options: {
					status: 'warning'
				}
			};

			act(() => {
				result.current.success(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options?.status).toBe('success');
		});
	});

	describe('warning method', () => {
		it('should call toastr with warning status', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Warning Title',
				text: 'Warning Message'
			};

			act(() => {
				result.current.warning(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options?.status).toBe('warning');
			expect(dispatchCall.payload.toastr.title).toBe('Warning Title');
			expect(dispatchCall.payload.toastr.text).toBe('Warning Message');
		});

		it('should override existing status with warning', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Warning Title',
				text: 'Warning Message',
				options: {
					status: 'info'
				}
			};

			act(() => {
				result.current.warning(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options?.status).toBe('warning');
		});
	});

	describe('error method', () => {
		it('should call toastr with error status', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Error Title',
				text: 'Error Message'
			};

			act(() => {
				result.current.error(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options?.status).toBe('error');
			expect(dispatchCall.payload.toastr.title).toBe('Error Title');
			expect(dispatchCall.payload.toastr.text).toBe('Error Message');
		});

		it('should override existing status with error', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Error Title',
				text: 'Error Message',
				options: {
					status: 'success'
				}
			};

			act(() => {
				result.current.error(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options?.status).toBe('error');
		});
	});

	describe('setStatus helper function', () => {
		it('should create new options object when none provided', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Test Title',
				text: 'Test Message'
				// No options provided
			};

			act(() => {
				result.current.info(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options).toEqual({
				status: 'info'
			});
		});

		it('should preserve existing options when setting status', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Test Title',
				text: 'Test Message',
				options: {
					showClose: true
				}
			};

			act(() => {
				result.current.warning(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options).toEqual({
				status: 'warning',
				showClose: true
			});
		});
	});

	describe('timer management', () => {
		it('should handle multiple toasts with different delays', () => {
			const { result: result1 } = renderHook(() => useToastr(1000));
			const { result: result2 } = renderHook(() => useToastr(2000));
			
			act(() => {
				result1.current.info({
					title: 'First',
					text: 'Message'
				});
				
				result2.current.success({
					title: 'Second',
					text: 'Message'
				});
			});

			// Clear showToastr calls
			mockDispatch.mockClear();

			// Advance by 1000ms - only first should hide
			act(() => {
				jest.advanceTimersByTime(1000);
			});

			expect(mockDispatch).toHaveBeenCalledTimes(1);
			expect(mockDispatch).toHaveBeenCalledWith({
				type: 'hideToastr',
				payload: { uuid: expect.any(String) }
			});

			mockDispatch.mockClear();

			// Advance by another 1000ms - second should hide
			act(() => {
				jest.advanceTimersByTime(1000);
			});

			expect(mockDispatch).toHaveBeenCalledTimes(1);
			expect(mockDispatch).toHaveBeenCalledWith({
				type: 'hideToastr',
				payload: { uuid: expect.any(String) }
			});
		});

		it('should handle zero delay', () => {
			const { result } = renderHook(() => useToastr(0));
			
			act(() => {
				result.current.toastr({
					title: 'Instant',
					text: 'Message'
				});
			});

			mockDispatch.mockClear();

			// Should hide immediately
			act(() => {
				jest.advanceTimersByTime(0);
			});

			expect(mockDispatch).toHaveBeenCalledWith({
				type: 'hideToastr',
				payload: { uuid: expect.any(String) }
			});
		});
	});

	describe('edge cases', () => {
		it('should handle props modification in convenience methods', () => {
			const { result } = renderHook(() => useToastr());
			
			const originalProps: ToastrProps = {
				title: 'Test',
				text: 'Message',
				options: {
					showClose: true
				}
			};

			act(() => {
				result.current.info(originalProps);
			});

			// The original props should be modified to include the status
			expect(originalProps.options?.status).toBe('info');
		});

		it('should handle undefined text', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Test Title'
				// text is undefined
			};

			act(() => {
				result.current.toastr(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.title).toBe('Test Title');
			expect(dispatchCall.payload.toastr.text).toBeUndefined();
		});

		it('should handle empty title and text', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: '',
				text: ''
			};

			act(() => {
				result.current.error(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.title).toBe('');
			expect(dispatchCall.payload.toastr.text).toBe('');
			expect(dispatchCall.payload.toastr.options?.status).toBe('error');
		});

		it('should handle custom onClose callback', () => {
			const { result } = renderHook(() => useToastr());
			const mockOnClose = jest.fn();
			
			const props: ToastrProps = {
				title: 'Test',
				text: 'Message',
				onClose: mockOnClose
			};

			act(() => {
				result.current.toastr(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.onClose).toBe(mockOnClose);
		});

		it('should handle complex options object', () => {
			const { result } = renderHook(() => useToastr());
			
			const props: ToastrProps = {
				title: 'Test',
				text: 'Message',
				options: {
					showClose: false,
					style: {
						containerClass: 'custom-container',
						titleClass: 'custom-title'
					}
				}
			};

			act(() => {
				result.current.success(props);
			});

			const dispatchCall = mockDispatch.mock.calls[0][0];
			expect(dispatchCall.payload.toastr.options).toEqual({
				showClose: false,
				status: 'success',
				style: {
					containerClass: 'custom-container',
					titleClass: 'custom-title'
				}
			});
		});
	});
});
