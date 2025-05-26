import { useEffect, useState } from 'react';

export interface Size {
	width: number | undefined;
	height: number | undefined;
}

export const useWindowSize = () => {
	// Initialize state with undefined width/height so server and client renders match
	const [windowSize, setWindowSize] = useState<Size>({
		width: undefined,
		height: undefined
	});

	useEffect(() => {
		// only execute all the code below in client side
		// Handler to call on window resize
		const handleResize = () => {
			// Set window width/height to state
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight
			});
		};

		// Add event listener
		window.addEventListener('resize', handleResize);

		// Call handler right away so state gets updated with initial window size
		handleResize();

		// Remove event listener on cleanup
		return () => window.removeEventListener('resize', handleResize);
	}, []); // Empty array ensures that effect is only run on mount
	return windowSize;
};
