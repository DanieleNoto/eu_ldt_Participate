/* eslint-disable @typescript-eslint/no-explicit-any */
import { Route, RouteObject, Routes } from 'react-router';

interface Props {
	routes: RouteObject[];
}

/**
 * Router. EntryPoint for routes rendering
 * @param routes
 * @constructor
 */
const Router: ({ routes }: Props) => React.JSX.Element = ({ routes }: Props) => {
	return <Routes>{routes.map((route: RouteObject) => createRoute(route))}</Routes>;
};

const createRoute: (route: RouteObject) => React.JSX.Element = (route: RouteObject) => {
	const routeElement = <>{route.element}</>;

	if (!route.children || route.children.length === 0) {
		return <Route key={route.path} path={route.path} element={routeElement} />;
	}

	return (
		<Route key={route.path} path={route.path} element={routeElement}>
			{route.children.map((child: any) => createRoute(child))}
		</Route>
	);
};

export default Router;
