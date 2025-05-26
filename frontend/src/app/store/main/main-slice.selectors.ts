import { MenuItem } from '@app/core/models/menuItem.model';
import { SectionModel } from '@app/theme/components/section/section.model';
import { mainSliceName } from './main-slice.name';
import { MainSliceState } from './main-slice.state';

interface PartialRootState {
	[mainSliceName]: MainSliceState;
}

export const selectAppIsLoaded = (state: PartialRootState): boolean => state[mainSliceName].appIsLoaded;

export const selectAppIsLoading = (state: PartialRootState): boolean => state[mainSliceName].loadingSpinner > 0;

export const selectAppIsStandalone = (state: PartialRootState): boolean => state[mainSliceName].appIsStandalone;

export const selectAppIsMainMenuActive = (state: PartialRootState): boolean => state[mainSliceName].isMainMenuActive;

export const selectAppIsMenuActive = (state: PartialRootState): boolean => state[mainSliceName].isMenuActive;

export const selectAppError = (state: PartialRootState): MainSliceState['error'] => state[mainSliceName].error;

export const selectSection = (state: PartialRootState): SectionModel | null => state[mainSliceName].section;

export const selectMenuItems = (state: PartialRootState): MenuItem[] => state[mainSliceName].menuItems;
