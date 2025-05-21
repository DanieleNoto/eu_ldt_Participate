import { MutableRefObject, useRef } from 'react';

/**
 * Hook for use focus on html element
 *
 * Usage example
 *
 * ```jsx
 * const [ref, setFocus] = useFocus<HTMLButtonElement>();
 *
 * setFocus();
 *
 * <button ref={ref}></button>
 * ```
 */
export const useFocus = <T extends HTMLElement>(): [MutableRefObject<T>, () => void] => {
	const containerRef = useRef<T>(null) as MutableRefObject<T>;
	const setFocus = (): void => {
		if (containerRef.current) {
			containerRef?.current.focus();
		}
	};

	return [containerRef, setFocus];
};
