import { ConfigState } from './config-slice';
import { configSliceName } from './config-slice.name';
import { ConfigSliceState } from './config-slice.state';

interface PartialRootState {
	[configSliceName]: ConfigSliceState;
}

export const selectConfig = (state: PartialRootState): ConfigState => state[configSliceName].config;
