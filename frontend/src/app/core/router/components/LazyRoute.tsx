import { CircularProgress } from '@mui/material';
import { JSX, ReactNode, Suspense } from 'react';

interface Props {
	children?: ReactNode;
}

/**
 * LazyRoute. Wrapper element of React.Suspense. Handle fallback with default SuspenseLoader
 * @param props
 * @constructor
 */
const LazyRoute: (props: Props) => JSX.Element = (props: Props) => {
	return <Suspense fallback={<CircularProgress />}>{props.children}</Suspense>;
};

export default LazyRoute;
