import LazyRoute from '@app/core/router/components/LazyRoute';
import { lazy } from 'react';
import { RouteObject } from 'react-router';
import exampleRoutes from './example/Example.routes';

const Example = lazy(() => import('./example/Example'));
const Dashboard = lazy(() => import('./dashboard/Dashboard'));

const pagesRoutes: RouteObject[] = [
	{
		path: '',
		element: (
			<LazyRoute>
				<Dashboard />
			</LazyRoute>
		)
	}
];

export default pagesRoutes;
