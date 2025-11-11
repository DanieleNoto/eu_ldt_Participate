import { FastifyInstance, FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { HttpMethod } from '../../enums/http-methods.enum';

interface RegisterRouteOptions {
	app: FastifyInstance;
	resourceName: string;
	controller: object;
	method: HttpMethod;
	path?: string;
	bodySchema?: object;
	response?: Record<number, object>;
	controllerMethod: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
}

export const registerRoute = (options: RegisterRouteOptions) => {
	const { app, resourceName, method, path = '', bodySchema, response, controllerMethod } = options;

	const fullPath = `/${resourceName}${path}`;

	const routeOptions: RouteOptions = {
		method: method.toLowerCase(),
		url: fullPath,
		handler: controllerMethod
	};

	if (bodySchema || response) {
		routeOptions.schema = {};

		if (bodySchema) {
			routeOptions.schema.body = bodySchema;
		}

		if (response) {
			routeOptions.schema.response = response;
		}
	}

	app.route(routeOptions);
};
