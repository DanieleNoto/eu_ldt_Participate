import { FastifyInstance } from 'fastify';
import HealthController from '../controllers/health.controller';
import { HttpMethod } from '../enums/http-methods.enum';
import {
	HealthResponseSchema,
	ServiceStatusesResponseSchema,
	KubernetesHealthResponseSchema
} from '../schemas/health.schema';
import { registerRoute } from './base/base.routes';

export default (app: FastifyInstance) => {
	const resourceName = 'health';

	registerRoute({
		app,
		resourceName,
		controller: HealthController,
		method: HttpMethod.GET,
		response: {
			200: HealthResponseSchema
		},
		controllerMethod: HealthController.health.bind(HealthController)
	});

	registerRoute({
		app,
		resourceName,
		controller: HealthController,
		method: HttpMethod.GET,
		path: '/ready',
		response: {
			200: HealthResponseSchema
		},
		controllerMethod: HealthController.ready.bind(HealthController)
	});

	registerRoute({
		app,
		resourceName,
		controller: HealthController,
		method: HttpMethod.GET,
		path: '/live',
		response: {
			200: HealthResponseSchema
		},
		controllerMethod: HealthController.live.bind(HealthController)
	});

	registerRoute({
		app,
		resourceName,
		controller: HealthController,
		method: HttpMethod.GET,
		path: '/services',
		response: {
			200: ServiceStatusesResponseSchema
		},
		controllerMethod: HealthController.serviceStatuses.bind(HealthController)
	});

	registerRoute({
		app,
		resourceName,
		controller: HealthController,
		method: HttpMethod.GET,
		path: '/kubernetes',
		response: {
			200: KubernetesHealthResponseSchema
		},
		controllerMethod: HealthController.kubernetes.bind(HealthController)
	});
};
