import { Outlet, RouteObject } from 'react-router';
import Pages from './pages/Pages';
import pagesRoutes from './pages/Pages.routes';

const getRoutes: (standalone: boolean) => RouteObject[] = () => [
	{
		path: '',
		element: <Outlet />,
		children: [
			{
				path: '',
				element: <Pages />,
				children: pagesRoutes
			}
		]
	}
];

export default getRoutes;
