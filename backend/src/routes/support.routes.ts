// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import { FastifyInstance } from 'fastify';
import SupportController from '../controllers/support.controller';
import { SupportRequestSchema, SupportResponseSchema } from '../schemas/chat.schema';

const supportRoutes = (app: FastifyInstance) => {
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

export default supportRoutes;
