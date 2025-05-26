/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodSchema } from 'zod';
import { getRequestContext } from '../../utils/request-context.utils';
import { ValidationError } from '../../utils/errors';

interface Execution {
	req: FastifyRequest<{}>;
	reply: FastifyReply;
	fnc: () => Promise<any>;
	error?: {
		code: string;
		message: string;
	};
}

export abstract class BaseController {
	/**
	 * Sends a standardized success response.
	 */
	protected static sendResponse<T>(reply: FastifyReply, data: T | null, successStatus = 200) {
		if (!data) {
			// reply.status(404).send({ error: 'Resource not found', statusCode: 404 });
			reply.status(204).send();
			return;
		}
		reply.status(successStatus).send(data);
	}

	/**
	 * Sends a standardized error response.
	 */
	protected static sendError(
		reply: FastifyReply,
		error: any,
		statusCode = 500,
		message: string = 'An error occurred'
	) {
		reply.log.error({ error, message, statusCode });
		reply.status(statusCode).send({
			error: `${message}`,
			statusCode,
			details: [error.original?.message || error.message]
		});
	}

	/**
	 * Validates the request body using a Zod schema.
	 */
	protected static validateBody<T>(schema: ZodSchema<T>, req: any, reply: FastifyReply): T | null {
		const parsed = schema.safeParse(req.body);
		if (!parsed.success) {
			this.sendError(reply, parsed.error, 400, 'Invalid request body');
			throw new ValidationError('Body request not valid');
		}

		return {
			...parsed.data,
			...req.params,
			author: getRequestContext()?.author
		};
	}

	/**
	 * Validates the request parameters using a Zod schema.
	 */
	protected static validateParams<T>(schema: ZodSchema<T>, req: any, reply: FastifyReply): T | null {
		const parsed = schema.safeParse(req.params);
		if (!parsed.success) {
			this.sendError(reply, parsed.error, 400, 'Invalid request parameters');
			return null;
		}

		return {
			...parsed.data,
			...req.params
			// author: getRequestContext()?.author
		} as any;
	}

	protected static async execute(execution: Execution) {
		try {
			const results = await execution.fnc();
			BaseController.sendResponse(execution.reply, results);
		} catch (error) {
			BaseController.sendError(
				execution.reply,
				error,
				500,
				!execution.error
					? 'Execution failed'
					: `Execution failed [code: ${execution.error?.code}, message: ${execution.error?.message}]`
			);
		}
	}

	// /**
	//  * Method that must be implemented by derived controllers to provide schema validation.
	//  */
	// protected abstract getSchema(): any;
	//
	// /**
	//  * Method that must be implemented by derived controllers to provide ID schema validation.
	//  */
	// protected abstract getIdSchema(): any;
}
