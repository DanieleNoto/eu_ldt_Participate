// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { RouteObject } from 'react-router';

export const getLazyRoute: (route: RouteObject) => RouteObject = (route: RouteObject) => ({
	...route,
	hydrateFallbackElement: <></>
});
