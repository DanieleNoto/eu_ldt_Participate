import useDebounce from '@app/utils/hooks/useDebounce';
import { renderHook } from '@testing-library/react';
import { act } from 'react';

describe('useDebounce hook', () => {
	jest.useFakeTimers();

	test('should debounce function calls', () => {
		const callback = jest.fn();
		const delay = 500;
		const { result } = renderHook(() => useDebounce(callback, delay));

		act(() => {
			result.current('first call');
			// Calling again within the delay period
			result.current('final call');
		});

		act(() => {
			jest.advanceTimersByTime(delay);
		});

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith('final call');
	});
});
