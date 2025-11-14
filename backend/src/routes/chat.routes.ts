import { FastifyInstance } from 'fastify';
import { ChatRequestSchema, ChatResponseSchema } from '../schemas/chat.schema';
import ChatController from '../controllers/chat.controller';

const chatRoutes = async (app: FastifyInstance) => {
	app.route({
		method: 'POST',
		url: '/chat/',
		schema: {
			body: ChatRequestSchema,
			response: { 200: ChatResponseSchema }
		},
		handler: ChatController.chat.bind(ChatController)
	});
};

export default chatRoutes;
