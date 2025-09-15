/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyReply, FastifyRequest } from 'fastify';
import logger from '../../utils/logger';

interface ExecuteOptions {
	req: FastifyRequest;
	reply: FastifyReply;
	fnc: (...args: any[]) => Promise<any>;
}

export abstract class BaseController {
	protected abstract service: any;

	/**
	 * Execute a service function with standardized error handling and logging
	 */
	static async execute({ req, reply, fnc }: ExecuteOptions): Promise<void> {
		try {
			const result = await fnc();

			// Log successful response
			logger.info({
				message: 'Request processed successfully',
				request_id: req.id,
				method: req.method,
				url: req.url,
				status: reply.statusCode || 200
			});

			reply.send(result);
		} catch (error) {
			const errorObj = error as Error;

			// Log error
			logger.error({
				message: 'Request failed',
				request_id: req.id,
				method: req.method,
				url: req.url,
				error: {
					name: errorObj.name,
					message: errorObj.message,
					stack: errorObj.stack
				}
			});

			// Send error response
			reply.status(500).send({
				error: 'Internal Server Error',
				message: errorObj.message
			});
		}
	}
}
