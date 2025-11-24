// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { configSliceName } from './config/config-slice.name';
import { ConfigSliceState } from './config/config-slice.state';
import { mainSliceName } from './main/main-slice.name';
import { MainSliceState } from './main/main-slice.state';

export interface RootState {
	[mainSliceName]: MainSliceState;
	[configSliceName]: ConfigSliceState;
}
