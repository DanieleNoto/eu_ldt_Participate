import { FastifyInstance } from 'fastify';
import SupportController from '../controllers/support.controller';
import { SupportRequestSchema, SupportResponseSchema } from '../schemas/chat.schema';

export default (app: FastifyInstance) => {
	app.route({
		method: 'POST',
		url: '/support/send',
		schema: {
			body: SupportRequestSchema,
			response: { 200: SupportResponseSchema }
		},
		handler: async (request, reply) => {
			return await SupportController.send(request, reply);
		}
	});
};
