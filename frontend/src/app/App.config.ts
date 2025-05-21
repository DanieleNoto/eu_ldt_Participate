import { API_CONFIG } from '@config/api-config';
import { dateFnsConfig, DateFnsConfig } from '@config/dateFns.config';
import { frontendConfig, FrontendConfig } from '@config/front-end.config';
import { loggerConfig, LoggerConfig } from '@config/logger.config';
import { toastrConfig, ToastrConfig } from '@config/toastr.config';
import { unflatten } from 'flat';
import { LevelWithSilentOrString } from 'pino';
import { ApiConfigConstructor } from './core/api-client/models/api-config.model';
import { ToastrHorizontalPosition, ToastrVerticalPosition } from './shared/toastr/model/toastr-options.model';

/**
 * This interface represents a "flat" version of the application configuration,
 * where keys are dot-separated paths (e.g., 'backend.baseUrl') rather than
 * nested objects.
 */
interface FlatAppConfig {
	'backend.baseUrl': string;
	'frontend.appBasePath': string;
	'logger.level': LevelWithSilentOrString;
	'dateFns.format': string;
	'toastr.delay': number;
	'toastr.vertical': ToastrVerticalPosition;
	'toastr.horizontal': ToastrHorizontalPosition;
}

/**
 * Recursively merges two objects (dest and source) into a new target object.
 * Properties from 'source' overwrite or extend those in 'dest'.
 *
 * @template T The type of the objects being merged.
 * @param dest The base object into which properties will be merged.
 * @param source The object whose properties will overwrite or extend 'dest'.
 * @returns A new merged object of type T.
 */
const merge = <T>(dest: T, source: T): T => {
	const target = {} as T;

	// Helper function that iterates over each property of the given object
	// and merges it into the 'target'.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const merger = (obj: any) => {
		for (const prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
					// If the property is an object, do a deep merge.
					// @ts-ignore
					target[prop] = merge(target[prop], obj[prop]);
				} else {
					// Otherwise, simply assign the value to the target.
					// @ts-ignore
					target[prop] = obj[prop];
				}
			}
		}
	};

	// Merge 'dest' into 'target'
	merger(dest);
	// Then merge 'source' into the updated 'target'
	merger(source);

	return target;
};

/**
 * Represents the internal structure of the application’s runtime configuration.
 * It contains default values for different modules (frontend, backend, logger, etc.)
 * and provides an 'extend' method to override or add new settings at runtime.
 */
class InternalAppConfig {
	/**
	 * A friendly name for the application.
	 */
	appName = 'euldt-ucs-manager-fe';

	/**
	 * Configuration for front-end related settings, such as the base path.
	 */
	frontend: FrontendConfig = frontendConfig;

	/**
	 * Backend configuration, including the base URL and the list of API endpoints.
	 */
	backend: { api: ApiConfigConstructor[]; baseUrl?: string } = {
		api: API_CONFIG
	};

	/**
	 * Logger configuration, specifying log level, etc.
	 */
	logger: LoggerConfig = loggerConfig;

	/**
	 * Toastr (toast notification) configuration, including delay, position, etc.
	 */
	toastr: Partial<ToastrConfig> = toastrConfig;

	/**
	 * Date-fns configuration for date formatting and parsing.
	 */
	dateFns: DateFnsConfig = dateFnsConfig;

	/**
	 * Dynamically extends the existing configuration using a flat configuration object.
	 * It unflattens the given object (converting dot-separated keys into nested objects)
	 * and merges those properties into the current instance.
	 *
	 * @param flatAppConfig A flat configuration object, possibly loaded at runtime.
	 * @returns The updated InternalAppConfig instance.
	 */
	extend(flatAppConfig: FlatAppConfig): InternalAppConfig {
		// Convert the flat config into a nested structure, then merge it into 'this'.
		const target = merge(this, unflatten<FlatAppConfig, InternalAppConfig>(flatAppConfig));

		// Assign the merged properties back to the current instance.
		return Object.assign(this, target);
	}
}

/**
 * A singleton instance of the application configuration that can be
 * imported and used throughout the codebase. It is typically extended
 * with environment-specific or user-provided settings at runtime.
 */
export const RUNTIME_APP_CONFIG = new InternalAppConfig();
