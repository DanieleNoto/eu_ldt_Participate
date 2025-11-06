import { FastifyRequest, FastifyReply } from 'fastify';
import SupportController from '../../../src/controllers/support.controller';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('SupportController', () => {
	let mockRequest: Partial<FastifyRequest>;
	let mockReply: Partial<FastifyReply>;
	let mockTransporter: any;

	beforeEach(() => {
		jest.clearAllMocks();

		// Create mock transporter
		mockTransporter = {
			verify: jest.fn().mockResolvedValue(true),
			sendMail: jest.fn().mockResolvedValue({
				messageId: 'test-message-id',
				response: 'Email sent successfully'
			})
		};

		// Mock nodemailer.createTransport
		mockedNodemailer.createTransport = jest.fn().mockReturnValue(mockTransporter);

		mockRequest = {
			body: {}
		};

		mockReply = {
			send: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis()
		};
	});

	describe('send()', () => {
		it('should handle support request successfully', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				message: 'I need help with my account'
			};

			mockRequest.body = requestBody;

			await SupportController.send(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockReply.send).toHaveBeenCalledWith({
				response: 'sent'
			});
		});

		it('should handle support request with long message', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				message:
					'This is a very long support message that contains detailed information about the issue I am experiencing with the application. It includes multiple sentences and specific details about what went wrong.'
			};

			mockRequest.body = requestBody;

			await SupportController.send(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockReply.send).toHaveBeenCalledWith({
				response: 'sent'
			});
		});

		it('should handle support request with special characters', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				message: 'Help with émojis 🤔 and special chars: àáâãäå æç èéêë'
			};

			mockRequest.body = requestBody;

			await SupportController.send(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockReply.send).toHaveBeenCalledWith({
				response: 'sent'
			});
		});

		it('should handle different conversation IDs', async () => {
			const requestBody = {
				conversationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
				message: 'Different conversation ID test'
			};

			mockRequest.body = requestBody;

			await SupportController.send(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockReply.send).toHaveBeenCalledWith({
				response: 'sent'
			});
		});

		it('should validate request body structure', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				message: 'Valid support message'
			};

			mockRequest.body = requestBody;

			await SupportController.send(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockReply.send).toHaveBeenCalledWith({
				response: 'sent'
			});
		});
	});
});
