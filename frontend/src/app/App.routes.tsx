import { Outlet, RouteObject } from 'react-router';

const getRoutes: (standalone: boolean) => RouteObject[] = () => [
	{
		path: '',
		element: <Outlet />,
		children: [
			{
				path: '',
				element: <></>  // Empty placeholder since we only need the chatbot
			}
		]
	}
];

export default getRoutes;
