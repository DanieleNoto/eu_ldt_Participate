import { ZodSchema } from 'zod';
import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseController } from '../../../../src/controllers/base/base.controller';
import { ValidationError } from '../../../../src/utils/errors';

// Create a concrete implementation of BaseController for testing
class TestController extends BaseController {}

describe('BaseController', () => {
	let testController: TestController;

	beforeEach(() => {
		testController = new TestController();
	});

	describe('sendResponse', () => {
		it('should send a success response with data', () => {
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn()
			} as unknown as FastifyReply;

			BaseController['sendResponse'](reply, { id: '1', name: 'Test' });

			expect(reply.status).toHaveBeenCalledWith(200);
			expect(reply.send).toHaveBeenCalledWith({ id: '1', name: 'Test' });
		});

		it('should send a 204 response when data is null', () => {
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn()
			} as unknown as FastifyReply;

			BaseController['sendResponse'](reply, null);

			expect(reply.status).toHaveBeenCalledWith(204);
			expect(reply.send).toHaveBeenCalled();
		});

		it('should use custom status code when provided', () => {
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn()
			} as unknown as FastifyReply;

			BaseController['sendResponse'](reply, { id: '1' }, 201);

			expect(reply.status).toHaveBeenCalledWith(201);
			expect(reply.send).toHaveBeenCalledWith({ id: '1' });
		});
	});

	describe('sendError', () => {
		it('should send an error response with default status code', () => {
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				log: { error: jest.fn() }
			} as unknown as FastifyReply;

			const error = new Error('Test error');

			BaseController['sendError'](reply, error);

			expect(reply.log.error).toHaveBeenCalled();
			expect(reply.status).toHaveBeenCalledWith(500);
			expect(reply.send).toHaveBeenCalledWith({
				error: 'An error occurred',
				statusCode: 500,
				details: ['Test error']
			});
		});

		it('should send an error response with custom message and status code', () => {
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				log: { error: jest.fn() }
			} as unknown as FastifyReply;

			const error = new Error('Test error');

			BaseController['sendError'](reply, error, 400, 'Bad request');

			expect(reply.log.error).toHaveBeenCalled();
			expect(reply.status).toHaveBeenCalledWith(400);
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Bad request',
				statusCode: 400,
				details: ['Test error']
			});
		});

		it('should handle nested error messages', () => {
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				log: { error: jest.fn() }
			} as unknown as FastifyReply;

			const error = {
				message: 'Test error',
				original: { message: 'Original error' }
			};

			BaseController['sendError'](reply, error);

			expect(reply.send).toHaveBeenCalledWith({
				error: 'An error occurred',
				statusCode: 500,
				details: ['Original error']
			});
		});
	});

	describe('validateBody', () => {
		it('should validate and return body data with additional context', () => {
			const schema = { safeParse: jest.fn() } as unknown as ZodSchema;
			const req = {
				body: { name: 'Test' },
				params: { id: '1' }
			};
			const reply = {} as FastifyReply;

			schema.safeParse = jest.fn().mockReturnValue({
				success: true,
				data: { name: 'Test' }
			});

			// Mock request context
			jest.mock('../../../../src/utils/request-context.utils', () => ({
				getRequestContext: jest.fn().mockReturnValue({ author: 'user1' })
			}));

			const result = BaseController['validateBody'](schema, req, reply);

			expect(schema.safeParse).toHaveBeenCalledWith(req.body);
			expect(result).toMatchObject({
				name: 'Test',
				id: '1'
			});
		});

		it('should throw ValidationError when body validation fails', () => {
			const schema = { safeParse: jest.fn() } as unknown as ZodSchema;
			const req = { body: { invalid: 'data' } };
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				log: { error: jest.fn() }
			} as unknown as FastifyReply;

			schema.safeParse = jest.fn().mockReturnValue({
				success: false,
				error: new Error('Validation failed')
			});

			expect(() => {
				BaseController['validateBody'](schema, req, reply);
			}).toThrow(ValidationError);

			expect(reply.status).toHaveBeenCalledWith(400);
		});
	});

	describe('validateParams', () => {
		it('should validate and return params', () => {
			const schema = { safeParse: jest.fn() } as unknown as ZodSchema;
			const req = { params: { id: '1' } };
			const reply = {} as FastifyReply;

			schema.safeParse = jest.fn().mockReturnValue({
				success: true,
				data: { id: '1' }
			});

			const result = BaseController['validateParams'](schema, req, reply);

			expect(schema.safeParse).toHaveBeenCalledWith(req.params);
			expect(result).toMatchObject({ id: '1' });
		});

		it('should return null when params validation fails', () => {
			const schema = { safeParse: jest.fn() } as unknown as ZodSchema;
			const req = { params: { invalid: 'id' } };
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				log: { error: jest.fn() }
			} as unknown as FastifyReply;

			schema.safeParse = jest.fn().mockReturnValue({
				success: false,
				error: new Error('Validation failed')
			});

			const result = BaseController['validateParams'](schema, req, reply);

			expect(reply.status).toHaveBeenCalledWith(400);
			expect(result).toBeNull();
		});
	});

	describe('execute', () => {
		it('should execute function and send response', async () => {
			const req = {} as FastifyRequest;
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn()
			} as unknown as FastifyReply;

			const fnc = jest.fn().mockResolvedValue({ id: '1' });

			await BaseController['execute']({ req, reply, fnc });

			expect(fnc).toHaveBeenCalled();
			expect(reply.status).toHaveBeenCalledWith(200);
			expect(reply.send).toHaveBeenCalledWith({ id: '1' });
		});

		it('should handle errors during execution', async () => {
			const req = {} as FastifyRequest;
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				log: { error: jest.fn() }
			} as unknown as FastifyReply;

			const error = new Error('Execution failed');
			const fnc = jest.fn().mockRejectedValue(error);

			await BaseController['execute']({ req, reply, fnc });

			expect(fnc).toHaveBeenCalled();
			expect(reply.status).toHaveBeenCalledWith(500);
			expect(reply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Execution failed',
					statusCode: 500
				})
			);
		});

		it('should include error code and message when provided', async () => {
			const req = {} as FastifyRequest;
			const reply = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn(),
				log: { error: jest.fn() }
			} as unknown as FastifyReply;

			const error = new Error('Something went wrong');
			const fnc = jest.fn().mockRejectedValue(error);

			await BaseController['execute']({
				req,
				reply,
				fnc,
				error: {
					code: 'ERR_1',
					message: 'Custom error message'
				}
			});

			expect(reply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					error: 'Execution failed [code: ERR_1, message: Custom error message]'
				})
			);
		});
	});
});
