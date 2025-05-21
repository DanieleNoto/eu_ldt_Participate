import { useInterval } from '@utils/hooks/useInterval';
import React from 'react';

const useRetryUntilResolved = (callback: Function, interval = 100) => {
	const [hasResolved, setHasResolved] = React.useState(false);
	useInterval(
		() => {
			const result = callback();
			if (result) {
				setHasResolved(true);
			}
		},
		hasResolved ? null : interval
	);
	return hasResolved;
};

export default useRetryUntilResolved;
