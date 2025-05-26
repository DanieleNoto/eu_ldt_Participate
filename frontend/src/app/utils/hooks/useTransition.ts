import { nop } from '@utils/functions';
import { MutableRefObject, useEffect, useRef } from 'react';

interface UseTransitionParams {
	onEnter?: typeof nop;
	onExit?: typeof nop;
}

/**
 * Hook for use transitions event on html element
 *
 * If `ref` not have a transition then the onEnter/onExit
 * not will invoked
 *
 * Usage example
 *
 * ```jsx
 * const ref = useTransitionEvents({
 *     onEnter() {
 *         // code executed on start transition event
 *     },
 *     onExit() {
 *         // code executed on end transition event
 *     }
 * });
 *
 * // div with a css transition
 * <div ref={ref}></div>
 * ```
 */
export const useTransitionEvents = <T extends HTMLElement>({
	onEnter = nop,
	onExit = nop
}: UseTransitionParams): MutableRefObject<T> => {
	const containerRef = useRef<T>(null) as MutableRefObject<T>;

	useEffect(() => {
		const current = containerRef.current;
		if (current) {
			current.addEventListener('transitionstart', onEnter);
			current.addEventListener('transitionend', onExit);
		}

		return () => {
			if (current) {
				current.removeEventListener('transitionstart', onEnter);

				current.removeEventListener('transitionend', onExit);
			}
		};
	}, [containerRef, onEnter, onExit]);

	return containerRef;
};
