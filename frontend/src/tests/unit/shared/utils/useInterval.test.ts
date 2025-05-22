/* eslint-disable @typescript-eslint/no-explicit-any */
import { useInterval } from '@app/utils/hooks/useInterval';
import { renderHook } from '@testing-library/react';
import { act } from 'react';

describe('useInterval hook', () => {
	jest.useFakeTimers();

	test('should call callback repeatedly based on delay', () => {
		const callback = jest.fn();
		renderHook(() => useInterval(callback, 1000));

		act(() => {
			jest.advanceTimersByTime(3000);
		});
		expect(callback).toHaveBeenCalledTimes(3);
	});

	test('should stop calling callback when delay is null', () => {
		const callback = jest.fn();
		const { rerender }: { rerender: any } = renderHook(
			({ delay }: { delay: number | null }) => useInterval(callback, delay),
			{
				initialProps: { delay: 1000 }
			}
		);

		act(() => {
			jest.advanceTimersByTime(1000);
		});
		expect(callback).toHaveBeenCalledTimes(1);

		// Update delay to null to stop the interval
		rerender({ delay: null });

		act(() => {
			jest.advanceTimersByTime(5000);
		});
		expect(callback).toHaveBeenCalledTimes(1);
	});
});
