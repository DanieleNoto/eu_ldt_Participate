// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const errorResponseSchema = z.object({
	statusCode: z.number(),
	error: z.string(),
	message: z.string()
});

const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
	if (error.validation) {
		return reply.status(400).send({
			error: 'Validation Error',
			statusCode: 400,
			message: error.message,
			validation: error.validation
		});
	}

	const responseData = {
		statusCode: error.statusCode ?? 500,
		error: error.name ?? error.message ?? 'Internal Server Error',
		message: error.message
	};

	// Validazione della risposta d'errore con lo schema
	const parsedData = errorResponseSchema.parse(responseData);

	return reply.code(parsedData.statusCode).send(parsedData);
};

export default errorHandler;
