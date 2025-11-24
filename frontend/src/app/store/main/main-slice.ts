// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuItem } from '@app/core/models/menuItem.model';
import { SectionModel } from '@app/theme/components/section/section.model';
import { mainSliceName } from './main-slice.name';
import { AppError, MainSliceState } from './main-slice.state';

const initialState: MainSliceState = {
	appIsLoaded: false,
	loadingSpinner: 0,
	error: null,
	appIsStandalone: false,
	isMainMenuActive: true,
	isMenuActive: true,
	section: null,
	menuItems: []
};

const mainSlice = createSlice({
	name: mainSliceName,
	initialState,
	reducers: {
		setAppIsLoaded: state => {
			state.appIsLoaded = true;
		},
		setAppIsStandalone: (state, { payload: isStandalone }: PayloadAction<boolean | undefined>) => {
			state.appIsStandalone = isStandalone ?? false;
		},
		showLoadingSpinner: state => {
			state.loadingSpinner++;
		},
		hideLoadingSpinner: (state, { payload: reset }: PayloadAction<boolean | undefined>) => {
			if (reset) {
				state.loadingSpinner = 0;
			} else {
				state.loadingSpinner--;
			}
		},
		setMainMenuActive: (state, { payload: isActive }: PayloadAction<boolean>) => {
			state.isMainMenuActive = isActive;
		},
		setMenuActive: (state, { payload: isActive }: PayloadAction<boolean>) => {
			state.isMenuActive = isActive;
		},
		setAppError: (state, { payload: error }: PayloadAction<AppError>) => {
			state.error = error;
		},
		resetAppError: state => {
			state.error = null;
		},
		setSection: (state, { payload }: PayloadAction<SectionModel | null>) => {
			state.section = payload;
		},
		setAppMenuItems: (state, { payload: menuItems }: PayloadAction<MenuItem[]>) => {
			state.menuItems = [...menuItems];
		}
	}
});

export const {
	setAppIsLoaded,
	setAppIsStandalone,
	setMainMenuActive,
	setMenuActive,
	showLoadingSpinner,
	hideLoadingSpinner,
	resetAppError,
	setAppError,
	setSection,
	setAppMenuItems
} = mainSlice.actions;
export const mainReducer = mainSlice.reducer;
