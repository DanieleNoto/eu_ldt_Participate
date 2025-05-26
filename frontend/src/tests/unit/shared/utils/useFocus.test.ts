import { useFocus } from '@app/utils/hooks/useFocus';
import { renderHook } from '@testing-library/react';
import { act } from 'react';

describe('useFocus hook', () => {
	test('should return a ref and setFocus should call focus on the element', () => {
		const { result } = renderHook(() => useFocus<HTMLButtonElement>());
		// Create a fake element with a focus method
		const fakeElement = { focus: jest.fn() } as unknown as HTMLButtonElement;
		result.current[0].current = fakeElement;

		act(() => {
			result.current[1](); // Call setFocus
		});

		expect(fakeElement.focus).toHaveBeenCalled();
	});
});
