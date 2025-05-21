import { FastifyInstance, FastifyReply, FastifyRequest, FastifySchema, RouteOptions } from 'fastify';
import { z } from 'zod';
import { BaseController } from '../../controllers/base/base.controller';
import { HttpMethod } from '../../enums/http-methods.enum';
import { ErrorResponseSchema } from '../../schemas/base/base.schema';
import { startupRoute } from '../../utils/startup-routes';
import { ResponseSchemas } from '../../schemas/base/base-crud.schema';

export interface InstanceRouteConfig<C extends BaseController> extends FastifySchema {
	app: FastifyInstance;
	parentPath?: string;
	resourceName: string;
	controller: C;
	paramsSchema?: z.AnyZodObject;
	querySchema?: z.AnyZodObject;
	bodySchema?: z.AnyZodObject;
	responseSchema?: ResponseSchemas;
	requireBody?: boolean;
	requireParams?: boolean;
	requireQueries?: boolean;
	description?: string;
}

export interface RouteConfig<C extends BaseController> extends InstanceRouteConfig<C> {
	method: HttpMethod;
	description?: string;
	path?: string;
	response?: Record<string, unknown>;
	controllerMethod: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
	returnPartialBody?: boolean;
}

const defaultError = {
	400: ErrorResponseSchema, // Bad request (validation error)
	404: ErrorResponseSchema, // Resource not found
	500: ErrorResponseSchema // Internal server error
};

export const registerRoute = <C extends BaseController>(routeConfig: RouteConfig<C>) => {
	// Logs the route registration
	startupRoute(routeConfig.app);

	// Merging delle options
	const options = {
		schema: {
			description: routeConfig.description || getDescription(routeConfig),
			tags: [routeConfig.resourceName],
			// headers: defaultHeadersSchema,
			response: {
				...defaultError,
				...routeConfig.response
			}
		} as FastifySchema
	};

	//if (![HttpMethod.GET].includes(routeConfig.method) && routeConfig.bodySchema) {
	if (![HttpMethod.GET, HttpMethod.DELETE].includes(routeConfig.method) || routeConfig.requireBody) {
		options.schema.body = routeConfig.returnPartialBody
			? routeConfig.bodySchema?.partial()
			: routeConfig.bodySchema;
	}

	if (routeConfig.requireParams) {
		options.schema.params = routeConfig.paramsSchema;
	}

	if (routeConfig.requireQueries) {
		options.schema.querystring = routeConfig.querySchema;
	}

	const route = {
		method: routeConfig.method,
		url: `${routeConfig.parentPath || ''}/${routeConfig.resourceName}${routeConfig.path || ''}`,
		schema: options.schema,
		handler: routeConfig.controllerMethod,
		routeConfig
	} as RouteOptions;

	routeConfig.app.route(route);
};

const getDescription = <C extends BaseController>(routeConfig: RouteConfig<C>) => {
	const actions = {
		get: routeConfig.paramsSchema ? 'Retrieve a' : 'Retrieve all',
		post: 'Create a new',
		put: 'Update a',
		patch: 'Partial update a',
		delete: 'Delete a'
	};
	return `${actions[routeConfig.method.toLowerCase() as keyof typeof actions] || 'Handle'} ${routeConfig.resourceName}`;
};
