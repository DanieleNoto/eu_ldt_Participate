import { FastifyInstance } from 'fastify';
import { HttpMethod } from '../../../../src/enums/http-methods.enum';
import { RouteSchema, resolveUrl, buildApiUrl, callSimpleRoute } from '../routes.utils';

/**
 * Execute a route call for standard CRUD operations
 * @param app - The Fastify instance to use for the request
 * @param routeSchema - The route schema containing the route details
 * @returns The response from the route call
 */
export const executeCrudRoute = async (app: FastifyInstance, routeSchema: RouteSchema) => {
	const { method, pathParams } = routeSchema;
	const modifiedRouteSchema = { ...routeSchema };

	// Determine the URL based on route type and method
	if (pathParams.id && (method === HttpMethod.GET || method === HttpMethod.PUT || method === HttpMethod.DELETE)) {
		modifiedRouteSchema.baseUrl = `${routeSchema.baseUrl}/:id`;
	}

	return callSimpleRoute(app, modifiedRouteSchema);
};
