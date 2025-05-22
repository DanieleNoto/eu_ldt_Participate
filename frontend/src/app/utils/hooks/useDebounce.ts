/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef } from 'react';

const useDebounce = <T extends (...args: any[]) => any>(
	callback: T,
	delay: number
): ((...args: Parameters<T>) => void) => {
	const timeoutRef = useRef<number | null>(null);

	const debouncedFunction = useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current !== null) {
				window.clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = window.setTimeout(() => {
				callback(...args);
				timeoutRef.current = null;
			}, delay);
		},
		[callback, delay]
	);

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) {
				window.clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return debouncedFunction;
};

export default useDebounce;
