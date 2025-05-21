import { ApiConfig } from './api-config.model';
import { BackendConfig, BackendConfigConstructor } from './backend-config.model';

export interface ApiClientConfigConstructor {
	backend: BackendConfigConstructor;
}

export class ApiClientConfig {
	backend!: BackendConfig;

	constructor(config: ApiClientConfigConstructor) {
		this.backend = new BackendConfig(config.backend);
	}

	/**
	 * Get api configuration from the environment file
	 * @param apiName name of requested api
	 * @returns api config
	 */
	getApiConfig(apiName: string): ApiConfig {
		return this.backend.getApiConfig(apiName);
	}

	/**
	 * Get api configuration from the environment file
	 * @returns backend config
	 */
	getBackendConfig(): Partial<BackendConfig> {
		return this.backend;
	}
}
