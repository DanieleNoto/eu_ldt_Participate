import { RequestMethods } from './request-method.model';
const DEFAULT_TIMEOUT = 30000;

export interface ApiConfigConstructor {
	name: string;
	url: string;
	method: string;
	headers?: HeadersInit;
	timeout?: number;
}

export class ApiConfig {
	name: string;
	url: string;
	method: string;
	headers: Headers;
	timeout: number;

	constructor(api: ApiConfigConstructor) {
		this.name = api.name || '';
		this.url = api.url;
		this.method = (api.method || RequestMethods.GET).toUpperCase();
		this.headers = new Headers(api.headers);
		this.headers.append('Content-Type', 'application/json; charset=UTF-8');
		this.timeout = api.timeout || DEFAULT_TIMEOUT;
	}
}
