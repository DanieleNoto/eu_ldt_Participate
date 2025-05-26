import useRetryUntilResolved from '@app/utils/hooks/useRetryUntilResolved';
import { renderHook } from '@testing-library/react';
import { act } from 'react';

describe('useRetryUntilResolved hook', () => {
	jest.useFakeTimers();

	test('should retry until callback returns true', () => {
		let attempt = 0;
		const callback = jest.fn(() => {
			attempt++;
			return attempt >= 3;
		});

		const { result } = renderHook(() => useRetryUntilResolved(callback, 100));
		// Initially, the hook returns false
		expect(result.current).toBe(false);

		act(() => {
			jest.advanceTimersByTime(300);
		});

		expect(callback).toHaveBeenCalled();
		expect(result.current).toBe(true);
	});
});
