// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { ApiConfig, ApiConfigConstructor } from './api-config.model';

export interface BackendConfigConstructor {
	baseUrl: string;
	api: ApiConfigConstructor[];
	timeout?: number;
}

export class BackendConfig {
	baseUrl: string;
	api: ApiConfig[];
	timeout?: number;

	constructor(backend: BackendConfigConstructor) {
		this.baseUrl = backend.baseUrl as string;
		this.api = (backend.api as ApiConfig[]).map((a: ApiConfig) => new ApiConfig(a));
		this.timeout = backend.timeout || 3000;
	}

	addApiConfig(api: ApiConfig): void {
		this.api.push(new ApiConfig(api));
	}

	getApiConfig(apiName: string): ApiConfig {
		// tslint:disable-next-line:no-shadowed-variable
		const api = this.api.find((config: ApiConfig) => config.name === apiName);
		if (!api) {
			throw new Error(`${apiName} not found!`);
		}

		api.url = this.prepareUrl(api.url);

		return api;
	}

	/**
	 * Add baseUrl as prefix if the api url is relative
	 * @param url Relative api url
	 */
	prepareUrl(url: string): string {
		if (url.trim().indexOf('http') !== 0) {
			url = (this.baseUrl + url).trim();
		}
		return url;
	}
}
