// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useConfig } from '@app/config/ConfigContext';
import { API_CONFIG } from '@config/api-config';
import { useToastr } from '@app/shared/toastr/hooks/useToastr';
import useLogger from '../logger/logger';
import { PathParams } from './models';
import { BaseModel } from './models/base.model';
import FilterObjectModel from './models/filterObject.model';

/**
 * Request options for the API call.
 *
 * @template T - The type of the model or raw data returned from the API.
 * @template R - The type returned after applying the postMapper for a single element (defaults to T).
 * @template L - The type returned after applying the postMapper for a list (defaults to T[]).
 */
export interface RequestOptions<T extends BaseModel, R = T, L = T[]> {
	apiName: string; // Name of the API endpoint (must match a configured API)
	body?: unknown;
	queryParams?: Record<string, any>;
	pathParams?: Record<string, any>;
	headers?: HeadersInit;
	/**
	 * Model class with a static fromDto method to map the response DTO.
	 */
	model?: ModelConstructor<T>;
	/**
	 * Custom mapper function that acts on the mapped data after model mapping for a single element.
	 */
	postMapperSingle?: (data: T) => R;
	/**
	 * Custom mapper function that acts on the mapped data after model mapping for a list of elements.
	 */
	postMapperList?: (data: T[]) => L;
}

export interface CustomRequestOptions {
	body?: unknown;
	queryParams?: Record<string, any>;
	pathParams?: Record<string, any>;
	headers?: HeadersInit;
	responseType?: 'json' | 'blob';
}

/**
 * Type that ensures a class has a static `fromDto` method.
 */
interface ModelConstructor<T extends BaseModel> {
	new (...args: any[]): T;
	fromDto(dto: any): T;
}

export interface BlobWithHeaders {
	blob: Blob;
	headers: Headers;
}

/**
 * Custom hook that packages an API request based on initial options.
 *
 * Usage:
 *   // single request
 *   const { request } = useApiRequest({
 *     apiName: BackendApiName.FETCH_TODO,
 *     model: TodoModel,
 *     postMapperSingle: (mapped) => { // modify mapped data and return a new type }
 *   });
 *
 *   // list request
 *   const { requestList } = useApiRequest<TodoModel, TodoModel, { data: TodoModel[]; total: number }>({
 *     apiName: BackendApiName.FETCH_TODOS,
 *     model: TodoModel,
 *     postMapperList: (response: TodoModel[]) => ({ data: response, total: response.length })
 *   });
 *
 * This hook reads the API configuration from Redux, builds the request URL (with path and query parameters),
 * merges headers, performs the fetch call, and maps the response using the provided model mapper if available.
 */
const useApiRequest = <T extends BaseModel, R = T, L = T[]>(options: RequestOptions<T, R, L>) => {
	// Always call hook (React rules); provide runtime fallback if slice missing
	const config = useConfig();
	// Defensive backend fallback: if config context not yet initialized, provide minimal structure
	const backend =
		config?.backend && Array.isArray(config.backend.api)
			? config.backend
			: { api: API_CONFIG, baseUrl: (globalThis as any).__CHATBOT_BASE_URL__ || '' };
	const { success: toastrSuccess, error: toastrError } = useToastr();
	const { logger } = useLogger();
	/**
	 * Retrieves the API configuration for the given API name.
	 * If the URL is relative, prepends the backend base URL.
	 */
	const getApiConfig = (apiName: string) => {
		const apiConfig = backend.api.find(api => api.name === apiName);
		if (!apiConfig) {
			throw new Error(`API configuration for "${apiName}" not found.`);
		}
		// Prepend the base URL if the URL is not absolute.
		if (!/^https?:\/\//.test(apiConfig.url)) {
			return { ...apiConfig, url: backend.baseUrl + apiConfig.url };
		}
		return apiConfig;
	};

	/**
	 * Binds path parameters in the URL.
	 * Example: "/users/{id}" with { id: 123 } becomes "/users/123".
	 */
	const bindPathParams = (url: string, params: PathParams = {}): string => {
		let urlInternal = url;
		for (const key in params) {
			if (params[key]) {
				const value = params[key] as string;
				urlInternal = urlInternal.replace(new RegExp(`{${key}}`, 'g'), value);
			}
		}
		return urlInternal;
	};

	/**
	 * Converts query parameters into a URL query string.
	 */
	const getQueryString = (queryParams?: any): URLSearchParams | null => {
		return queryParams ? new URLSearchParams(queryParams) : null;
	};

	/**
	 * Merges the default headers from the API configuration with any additional headers.
	 */
	const mergeHeaders = (defaultHeaders: HeadersInit, additionalHeaders?: HeadersInit): Headers => {
		const headers = new Headers(defaultHeaders);
		if (additionalHeaders) {
			if (additionalHeaders instanceof Headers) {
				additionalHeaders.forEach((value, key) => headers.append(key, value));
			} else if (Array.isArray(additionalHeaders)) {
				additionalHeaders.forEach(([key, value]) => headers.append(key, value));
			} else {
				Object.keys(additionalHeaders).forEach(key => {
					headers.append(key, (additionalHeaders as Record<string, string>)[key]);
				});
			}
		}
		return headers;
	};

	const internalRequest = async (overrideOptions?: CustomRequestOptions | null) => {
		// Retrieve API configuration based on the provided apiName.
		const apiConfig = getApiConfig(options.apiName);

		// Bind any path parameters to the URL.
		let url = bindPathParams(apiConfig.url, overrideOptions?.pathParams ?? options.pathParams);

		// Append query parameters if provided.
		if (overrideOptions?.queryParams) {
			url += '?' + normalizeParams(overrideOptions?.queryParams);
		} else {
			const query = getQueryString(options.queryParams);
			if (query) {
				url += '?' + query.toString();
			}
		}

		// Merge default headers with additional headers.
		const headers = mergeHeaders(apiConfig.headers || {}, options.headers);

		// Build the fetch options.
		const fetchOptions: RequestInit = {
			method: apiConfig.method,
			headers,
			credentials: 'include'
		};

		// Add body if provided (stringify if it's an object and not FormData).
		const bodyToUse = overrideOptions?.body ?? options.body;
		if (bodyToUse) {
			if (typeof bodyToUse === 'object' && !(bodyToUse instanceof FormData)) {
				fetchOptions.body = JSON.stringify(bodyToUse);
			} else {
				fetchOptions.body = bodyToUse as BodyInit;
			}
		}

		// Execute the fetch call.
		const response = await fetch(url, fetchOptions);

		if (overrideOptions?.responseType === 'blob') {
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
			}
			const blob = await response.blob();
			return { blob, headers: response.headers } as BlobWithHeaders;
		} else {
			//Parse the response JSON.
			const rawData = await response.json();

			if (!response.ok) {
				if (rawData.error) {
					handleErrorToastr(rawData.error || rawData.message);
				}

				throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
			}

			if (rawData.success || rawData.message) {
				handleSuccessToastr(rawData.message);
			}

			return rawData;
		}
	};

	/**
	 * Handles success toastr notifications.
	 * Displays a success message if provided.
	 */
	const handleSuccessToastr = (message: string | undefined) => {
		if (!message) return;
		toastrSuccess({
			title: message
		});
	};

	/**
	 * Handles error toastr notifications.
	 * Displays an error message if provided.
	 */
	const handleErrorToastr = (message: string | undefined) => {
		if (!message) return;
		toastrError({
			title: message
		});
	};

	/**
	 * The request function that builds and executes the API call for a single element.
	 */
	const request = async (): Promise<R> => {
		try {
			const rawData = await internalRequest();
			const result: T = options.model ? options.model.fromDto(rawData) : rawData;
			if (options.postMapperSingle) {
				return options.postMapperSingle(result);
			}
			return result as unknown as R;
		} catch (error) {
			logger.error({ msg: 'API Request error:', error });
			throw error;
		}
	};

	/**
	 * Normalizes the parameters for the request.
	 * Need to be updated to handle other types of params
	 * Used for the list request
	 */
	const normalizeParams = (params?: Record<string, any>) => {
		const paramSeparator = '::';
		const paramsObj = new URLSearchParams();

		// handle page for queryParams
		if (params?.page !== undefined) {
			paramsObj.append('page', params.page.toString());
		}

		// handle size for queryParams
		if (params?.size !== undefined) {
			paramsObj.append('size', params.size.toString());
		}

		// handle filters for queryParams
		if (params?.filters && Array.isArray(params.filters)) {
			params.filters.forEach((filter: FilterObjectModel) => {
				filter.query.forEach(value => {
					if (value) {
						paramsObj.append('search', `${filter.field}${paramSeparator}${value}`);
					}
				});
			});
		}

		// handle sort for queryParams
		if (params?.sortFields && Array.isArray(params.sortFields)) {
			params.sortFields.forEach((sort: { field: string; direction: string }) => {
				if (sort.field && sort.direction) {
					paramsObj.append('sort', `${sort.field}${paramSeparator}${sort.direction}`);
				}
			});
		}

		return paramsObj.toString();
	};

	/**
	 * The request function that builds and executes the API call for blob (for example files download).
	 */
	const requestBlob = async (opts: CustomRequestOptions): Promise<BlobWithHeaders> => {
		// set the responseType as blob
		const blobWithHeaders = await internalRequest({ ...opts, responseType: 'blob' });
		return blobWithHeaders as BlobWithHeaders;
	};

	/**
	 * The request function that builds and executes the API call for a list of elements.
	 */
	const requestList = async (params?: {
		page: number;
		size: number;
		filters?: FilterObjectModel[];
		sort?: { field: string; direction: string };
	}): Promise<L> => {
		try {
			const rawData = await internalRequest(params ? { queryParams: params } : undefined);

			let result: T[];
			if (options.model && Array.isArray(rawData)) {
				result = rawData.map(item => options.model!.fromDto(item));
			} else {
				result = rawData;
			}

			if (options.postMapperList) {
				return options.postMapperList(result);
			}

			return result as unknown as L;
		} catch (error) {
			logger.error({ msg: 'API Request error:', error });
			throw error;
		}
	};

	/**
	 * The request function that builds and executes the API call with custom options.
	 */
	const requestWithOptions = async (customOptions: CustomRequestOptions): Promise<R> => {
		try {
			const rawData = await internalRequest(customOptions);
			const result: T = options.model ? options.model.fromDto(rawData) : rawData;
			if (options.postMapperSingle) {
				return options.postMapperSingle(result);
			}
			return result as unknown as R;
		} catch (error) {
			logger.error({ msg: 'API Request error:', error });
			throw error;
		}
	};

	return { request, requestBlob, requestList, requestWithOptions };
};

export default useApiRequest;
