import React from 'react';

export const useInterval = (callback: Function, delay: number | null) => {
	const intervalRef = React.useRef(null);
	const savedCallback = React.useRef(callback);
	React.useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);
	React.useEffect(() => {
		const tick = () => savedCallback.current();
		if (typeof delay === 'number') {
			// @ts-ignore
			intervalRef.current = window.setInterval(tick, delay);

			// @ts-ignore
			return () => window.clearInterval(intervalRef.current);
		}
	}, [delay]);
	return intervalRef;
};
