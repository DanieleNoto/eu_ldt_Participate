// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import errorHandler from '../../../src/middlewares/error-handler.middleware';

describe('errorHandler', () => {
	let reply: Partial<FastifyReply>;
	let request: Partial<FastifyRequest>;

	beforeEach(() => {
		// reset mocks on reply
		reply = {
			status: jest.fn(function (this: any) {
				return this;
			}),
			code: jest.fn(function (this: any) {
				return this;
			}),
			send: jest.fn(function (this: any) {
				return this;
			})
		};
		request = {} as any;
	});

	it('sends 400 with validation details when error.validation is present', () => {
		const validationDetails = [{ path: ['body', 'foo'], message: 'Required' }];
		const err = {
			message: 'Bad request',
			validation: validationDetails
		} as unknown as FastifyError;

		errorHandler(err, request as FastifyRequest, reply as FastifyReply);

		expect(reply.status).toHaveBeenCalledWith(400);
		expect(reply.send).toHaveBeenCalledWith({
			error: 'Validation Error',
			statusCode: 400,
			message: 'Bad request',
			validation: validationDetails
		});
	});

	it('sends parsed default error when no validation property', () => {
		const err = {
			name: 'NotFound',
			message: 'Resource missing',
			statusCode: 404
		} as FastifyError;

		errorHandler(err, request as FastifyRequest, reply as FastifyReply);

		// Should use reply.code(...) then send(...)
		expect(reply.code).toHaveBeenCalledWith(404);
		expect(reply.send).toHaveBeenCalledWith({
			statusCode: 404,
			error: 'NotFound',
			message: 'Resource missing'
		});
	});

	it('falls back to 500 and message when error.statusCode/name missing', () => {
		const err = {
			message: 'Something broke'
		} as FastifyError;

		errorHandler(err, request as FastifyRequest, reply as FastifyReply);

		expect(reply.code).toHaveBeenCalledWith(500);
		expect(reply.send).toHaveBeenCalledWith({
			statusCode: 500,
			error: 'Something broke',
			message: 'Something broke'
		});
	});
});
