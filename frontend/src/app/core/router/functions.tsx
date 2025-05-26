import { RouteObject } from 'react-router';

export const getLazyRoute: (route: RouteObject) => RouteObject = (route: RouteObject) => ({
	...route,
	hydrateFallbackElement: <></>
});
