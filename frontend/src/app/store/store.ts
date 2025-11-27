// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { configureStore } from '@reduxjs/toolkit';
import { configReducer } from './config/config-slice';
import { configSliceName } from './config/config-slice.name';
import { mainReducer } from './main/main-slice';
import { mainSliceName } from './main/main-slice.name';

const store = configureStore({
	// ...reduxDevToolsConfig,
	reducer: {
		[mainSliceName]: mainReducer,
		[configSliceName]: configReducer
	}
});

export { store };

export type AppStore = typeof store;

export type AppDispatch = AppStore['dispatch'];
