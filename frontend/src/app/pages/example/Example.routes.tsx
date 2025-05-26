import LazyRoute from '@app/core/router/components/LazyRoute';
import React from 'react';
import { Navigate, RouteObject } from 'react-router';

const FormsExample = React.lazy(() => import('./pages/forms/Forms'));
const Utils = React.lazy(() => import('./pages/utils/Utils'));
const Query = React.lazy(() => import('./pages/query/Query'));

const exampleRoutes: RouteObject[] = [
	{
		path: 'forms',
		element: (
			<LazyRoute>
				<FormsExample />
			</LazyRoute>
		),
	},
	{
		path: 'utils',
		element: (
			<LazyRoute>
				<Utils />
			</LazyRoute>
		),
	},
	{
		path: 'query',
		element: (
			<LazyRoute>
				<Query />
			</LazyRoute>
		),
		
	},
	{ path: '*', element: <Navigate to="/example/forms" /> }
];

export default exampleRoutes;
