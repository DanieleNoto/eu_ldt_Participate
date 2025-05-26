import LazyRoute from '@app/core/router/components/LazyRoute';
import { lazy } from 'react';
import { RouteObject } from 'react-router';
import exampleRoutes from './example/Example.routes';

const Example = lazy(() => import('./example/Example'));
const Dashboard = lazy(() => import('./dashboard/Dashboard'));

const pagesRoutes: RouteObject[] = [
	{
		path: 'dashboard',
		element: (
			<LazyRoute>
				<Dashboard />
			</LazyRoute>
		)
	},
	{
		path: 'example',
		element: (
			<LazyRoute>
				<Example />
			</LazyRoute>
		),
		children: exampleRoutes
	}
];

export default pagesRoutes;
