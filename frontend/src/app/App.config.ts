// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Runtime application configuration that can be extended dynamically.
 * This configuration is loaded from /config/config.json at application startup.
 */
class RuntimeAppConfig {
	private config: Record<string, any> = {};

	/**
	 * Extend the current configuration with new values.
	 * @param newConfig - Configuration object to merge
	 * @returns Promise that resolves when configuration is extended
	 */
	extend(newConfig: Record<string, any>): Promise<void> {
		return new Promise(resolve => {
			this.config = {
				...this.config,
				...newConfig
			};
			resolve();
		});
	}

	/**
	 * Get a configuration value by key.
	 * @param key - The configuration key (supports dot notation)
	 * @returns The configuration value
	 */
	get(key: string): any {
		return this.getNestedValue(this.config, key);
	}

	/**
	 * Get the entire configuration object.
	 * @returns The complete configuration object
	 */
	getAll(): Record<string, any> {
		return { ...this.config };
	}

	/**
	 * Set a configuration value.
	 * @param key - The configuration key (supports dot notation)
	 * @param value - The value to set
	 */
	set(key: string, value: any): void {
		this.setNestedValue(this.config, key, value);
	}

	/**
	 * Helper method to get nested values using dot notation.
	 * @param obj - The object to search in
	 * @param path - The dot-separated path
	 * @returns The value at the specified path
	 */
	private getNestedValue(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => current?.[key], obj);
	}

	/**
	 * Helper method to set nested values using dot notation.
	 * @param obj - The object to modify
	 * @param path - The dot-separated path
	 * @param value - The value to set
	 */
	private setNestedValue(obj: any, path: string, value: any): void {
		const keys = path.split('.');
		const lastKey = keys.pop()!;
		const target = keys.reduce((current, key) => {
			if (!(key in current)) {
				current[key] = {};
			}
			return current[key];
		}, obj);
		target[lastKey] = value;
	}
}

/**
 * Global runtime application configuration instance.
 * This is used to store configuration that is loaded dynamically at runtime.
 */
export const RUNTIME_APP_CONFIG = new RuntimeAppConfig();
