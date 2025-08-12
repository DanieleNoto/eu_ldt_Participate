/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodSchema } from 'zod';
// import { generateMock } from '@anatine/zod-mock'; // Temporarily disabled due to missing dependency in Zod v4 migration
import { FastifyInstance } from 'fastify';
import { HttpMethod } from '../../../src/enums/http-methods.enum';
import { StatusEnum } from '../../../src/enums/status.enum';
import logger from '../../../src/utils/logger';

export interface RouteSchema {
	method: HttpMethod;
	baseUrl: string;
	pathParams: Record<string, string>;
	bodyParams?: any;
	requestSchema?: ZodSchema;
	responseSchema?: ZodSchema;
	queryParams?: Record<string, string>;
	isAssociative?: boolean;
}

/**
 * Generate mock data but ensure it doesn't have DELETED status
 */
export const generateValidMock = <T>(schema: ZodSchema): T => {
	// Minimal fallback: returns empty object casted. Replace with real mock generator library compatible with Zod v4.
	const mockData = {} as T & { status?: StatusEnum };
	if (mockData.status === StatusEnum.DELETED) {
		mockData.status = StatusEnum.DRAFT;
	}
	return mockData;
};

/**
 * Replace dynamic parameters in URL with actual values
 */
export const resolveUrl = (url: string, params: Record<string, string>): string => {
	let resolvedUrl = url;
	for (const [key, value] of Object.entries(params)) {
		resolvedUrl = resolvedUrl.replace(`:${key}`, value);
	}
	return resolvedUrl;
};

/**
 * Build full API URL with context
 */
export const buildApiUrl = (endpoint: string): string => {
	return `${process.env.CONTEXT_URL}${endpoint}`;
};

export const createUniqueName = (prefix: string): string => {
	const randomSuffix = Math.floor(Math.random() * 10000);
	return `${prefix}_${randomSuffix}`;
};

export const sortRoutes = (a: any, b: any): number => {
	const order = [HttpMethod.POST, HttpMethod.PUT, HttpMethod.GET, HttpMethod.DELETE];
	const indexA = order.indexOf(a.method);
	const indexB = order.indexOf(b.method);

	if (indexA !== indexB) {
		// Sort primarily by HTTP method (POST -> PUT -> GET -> DELETE)
		return indexA - indexB;
	}

	// Helper function to count dynamic path parameters (e.g., ":id", ":caseId")
	const countPathParams = (url: string): number => {
		const matches = url.match(/:\w+/g); // Matches parameters in the URL
		return matches ? matches.length : 0;
	};

	// Custom comparison for DELETE routes
	const compareDeletePaths = (urlA: string, urlB: string): number => {
		const segmentsA = urlA.split('/').length; // Count the number of URL segments (e.g., "/case/:caseId/problem")
		const segmentsB = urlB.split('/').length;

		// DELETE routes: deeper URLs should come first
		return segmentsB - segmentsA; // Reverse order for DELETE
	};

	if (a.method === HttpMethod.DELETE && b.method === HttpMethod.DELETE) {
		const pathComparison = compareDeletePaths(a.url, b.url);
		if (pathComparison !== 0) {
			return pathComparison; // Prioritize deeper DELETE paths
		}
	}

	const paramsCountA = countPathParams(a.url);
	const paramsCountB = countPathParams(b.url);

	if (paramsCountA !== paramsCountB) {
		// Sort by the number of dynamic path parameters
		return paramsCountA - paramsCountB;
	}

	return 0;
};

/**
 * Call a simple route with the given Fastify instance and route schema
 * @param app - The Fastify instance to use for the request
 * @param routeSchema - The route schema containing the route details
 * @returns The response from the route call
 */
export const callSimpleRoute = async (app: FastifyInstance, routeSchema: RouteSchema): Promise<any> => {
	const { method, baseUrl, pathParams, requestSchema, queryParams, bodyParams } = routeSchema;

	const urlWithParams = resolveUrl(baseUrl, pathParams);
	let fullUrl = buildApiUrl(urlWithParams);

	const mockBody = requestSchema ? generateValidMock(requestSchema) : {};
	let payload = mockBody || {};
	if (bodyParams && Object.keys(bodyParams).length > 0) {
		payload = { ...payload, ...bodyParams };
	}

	if (queryParams && Object.keys(queryParams).length > 0) {
		const searchParams = new URLSearchParams(queryParams);
		fullUrl += `?${searchParams.toString()}`;
	}

	return await app.inject({
		method,
		url: fullUrl,
		payload,
		headers: payload ? { 'Content-Type': 'application/json' } : undefined
	});
};

/**
 * Test a route call with the given Fastify instance and route schema
 * @param app - The Fastify instance to use for the request
 * @param routeSchema - The route schema containing the route details
 * @param executeCall - Optional function to execute the route call, defaults to executCall
 * @returns The response body from the route call
 */
export const testRoute = async (
	app: FastifyInstance,
	routeSchema: RouteSchema,
	executeCall: (app: FastifyInstance, schema: RouteSchema) => Promise<any> = callSimpleRoute
) => {
	const response = await executeCall(app, routeSchema);

	let responseBody: any = {};
	if (response.statusCode !== 204) {
		const contentType = response.headers['content-type'];

		if (contentType?.toLowerCase().includes('application/json')) {
			responseBody = await response.json();
			expect(responseBody).toBeDefined();
		} else {
			const stream = await response.stream();
			responseBody = stream;
		}
	}

	// Validate the response against schema
	const parseResult = routeSchema.responseSchema
		? routeSchema.responseSchema.safeParse(responseBody)
		: { success: true };
	if (!parseResult.success) {
		logger.error('Response body:');
		logger.error(JSON.stringify(responseBody, null, 2));
		logger.error('Response schema:');
		logger.error(JSON.stringify(routeSchema.responseSchema, null, 2));
	}
	expect(parseResult?.success).toBe(true);

	return responseBody;
};

const createEntity = async (
	app: FastifyInstance,
	entityType: string,
	schema: ZodSchema,
	entityUrl: string,
	customNamePrefix?: string
): Promise<Record<string, string>> => {
	const uniqueName = createUniqueName(customNamePrefix || `Test ${entityType}`);
	const payload: any = { ...generateValidMock(schema), name: uniqueName };

	const response = await app.inject({
		method: 'POST',
		url: `${process.env.CONTEXT_URL}${entityUrl}`,
		payload,
		headers: { 'Content-Type': 'application/json' }
	});

	if (response.statusCode !== 201) {
		logger.error(`Failed to create ${entityType}: ${response.statusCode}`, await response.json());
		throw new Error(`Failed to create ${entityType}, status: ${response.statusCode}`);
	}

	const result = await response.json();
	return { [`${entityType.toLowerCase()}Id`]: result.id };
};
