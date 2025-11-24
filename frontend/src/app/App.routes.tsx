// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
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
