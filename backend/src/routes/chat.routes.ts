import { FastifyInstance } from 'fastify';
import { ChatRequestSchema, ChatResponseSchema } from 'src/schemas/chat.schema';
import ChatController from '../controllers/chat.controller';
import { HttpMethod } from '../enums/http-methods.enum';
import { registerRoute } from './base/base.routes';

export default (app: FastifyInstance) => {
	const resourceName = 'chat';

	registerRoute({
		app,
		resourceName,
		controller: ChatController,
		method: HttpMethod.POST,
		path: '/',
		bodySchema: ChatRequestSchema,
		response: {
			200: ChatResponseSchema
		},
		controllerMethod: ChatController.chat.bind(ChatController)
	});
};
