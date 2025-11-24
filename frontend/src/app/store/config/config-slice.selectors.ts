// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { ConfigState } from './config-slice';
import { configSliceName } from './config-slice.name';
import { ConfigSliceState } from './config-slice.state';

interface PartialRootState {
	[configSliceName]: ConfigSliceState;
}

export const selectConfig = (state: PartialRootState): ConfigState => state[configSliceName].config;
