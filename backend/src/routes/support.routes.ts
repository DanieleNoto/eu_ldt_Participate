import { FastifyInstance } from 'fastify';
import SupportController from '../controllers/support.controller';
import { SupportRequestSchema, SupportResponseSchema } from '../schemas/chat.schema';
import { HttpMethod } from '../enums/http-methods.enum';
import { registerRoute } from './base/base.routes';

export default (app: FastifyInstance) => {
	const resourceName = 'support';
	registerRoute({
		app,
		resourceName,
		controller: SupportController,
		method: HttpMethod.POST,
		path: '/send',
		bodySchema: SupportRequestSchema,
		response: { 200: SupportResponseSchema },
		controllerMethod: SupportController.send.bind(SupportController)
	});
};
