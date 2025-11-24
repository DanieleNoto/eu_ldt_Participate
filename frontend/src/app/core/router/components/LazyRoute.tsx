// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
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
