import { configSliceName } from './config/config-slice.name';
import { ConfigSliceState } from './config/config-slice.state';
import { mainSliceName } from './main/main-slice.name';
import { MainSliceState } from './main/main-slice.state';

export interface RootState {
	[mainSliceName]: MainSliceState;
	[configSliceName]: ConfigSliceState;
}
