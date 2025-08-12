/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiConfigConstructor } from '@app/core/api-client/models/api-config.model';
import { ToastrHorizontalPosition, ToastrVerticalPosition } from '@app/shared/toastr/model/toastr-options.model';
import { API_CONFIG } from '@config/api-config';
import { dateFnsConfig, DateFnsConfig } from '@config/dateFns.config';
import { frontendConfig, FrontendConfig } from '@config/front-end.config';
import { loggerConfig, LoggerConfig } from '@config/logger.config';
import { toastrConfig, ToastrConfig } from '@config/toastr.config';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { unflatten } from 'flat';
import { LevelWithSilentOrString } from 'pino';
import { configSliceName } from './config-slice.name';
import { ConfigSliceState } from './config-slice.state';

/**
 * Interface for a flat configuration object.
 * Keys are dot-separated (e.g. 'backend.baseUrl') instead of nested objects.
 */
export interface FlatAppConfig {
	'backend.baseUrl': string;
	'frontend.appBasePath': string;
	'logger.level': LevelWithSilentOrString;
	'dateFns.format': string;
	'dateFns.locale': DateFnsConfig['locale'];
	'toastr.delay': number;
	'toastr.vertical': ToastrVerticalPosition;
	'toastr.horizontal': ToastrHorizontalPosition;
}

/**
 * Interface representing the configuration state.
 */
export interface ConfigState {
	/** A friendly name for the application. */
	appName: string;
	/** Front-end configuration (e.g., base path). */
	frontend: FrontendConfig;
	/** Backend configuration, including API endpoints and base URL. */
	backend: { api: ApiConfigConstructor[]; baseUrl?: string };
	/** Logger configuration. */
	logger: LoggerConfig;
	/** Toastr (toast notification) configuration. */
	toastr: Partial<ToastrConfig>;
	/** Date-fns configuration for date formatting. */
	dateFns: DateFnsConfig; // now only contains serializable values
}

// Initial state using the default configurations.
const initialState: ConfigSliceState = {
	config: {
		appName: 'euldt-ucs-manager-fe',
		frontend: frontendConfig,
		backend: { api: API_CONFIG },
		logger: loggerConfig,
		toastr: toastrConfig,
		dateFns: dateFnsConfig
	}
};

/**
 * Deep merge function that recursively merges two objects.
 * Properties from source overwrite or extend those in dest.
 *
 * @param dest - The base object.
 * @param source - The object whose properties will be merged into dest.
 * @returns A new object of type T with merged properties.
 */
const merge = <T>(dest: T, source: T): T => {
	const target = {} as T;
	const merger = (obj: any) => {
		for (const prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
					// Deep merge for nested objects
					// @ts-ignore
					target[prop] = merge(target[prop], obj[prop]);
				} else {
					// @ts-ignore
					target[prop] = obj[prop];
				}
			}
		}
	};
	merger(dest);
	merger(source);
	return target;
};

/**
 * Redux slice for managing the application's runtime configuration.
 */
const configSlice = createSlice({
	name: configSliceName,
	initialState,
	reducers: {
		/**
		 * Extends or overrides the current configuration with a flat configuration object.
		 * The flat configuration is first "unflattened" to a nested structure and then merged.
		 *
		 * @param state - The current configuration state.
		 * @param action - Payload containing the flat configuration object.
		 * @returns The new configuration state.
		 */
		extendConfig: (state, action: PayloadAction<FlatAppConfig>) => {
			const flatConfig = action.payload;
			// Unflatten the configuration into a nested structure
			const unflattened = unflatten<FlatAppConfig, ConfigState>(flatConfig);
			// Merge the current state with the unflattened configuration and return the result
			state.config = merge(state.config, unflattened);
		}
	}
});

export const { extendConfig } = configSlice.actions;
export const configReducer = configSlice.reducer;
