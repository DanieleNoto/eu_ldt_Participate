import { useWindowSize } from '@app/utils/hooks/useWindowsSize';
import { renderHook } from '@testing-library/react';
import { act } from 'react';

describe('useWindowSize hook', () => {
	test('should return the current window size and update on resize', () => {
		// Set initial window size
		window.innerWidth = 1024;
		window.innerHeight = 768;

		const { result } = renderHook(() => useWindowSize());

		// Simulate window resize
		act(() => {
			window.innerWidth = 800;
			window.innerHeight = 600;
			window.dispatchEvent(new Event('resize'));
		});

		expect(result.current.width).toBe(800);
		expect(result.current.height).toBe(600);
	});
});
