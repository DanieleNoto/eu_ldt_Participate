import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import ChatController from '../../../src/controllers/chat.controller';
import { ChatService } from '../../../src/services/chat.service';

// Mock dependencies
jest.mock('../../../src/services/chat.service');
jest.mock('uuid');

const mockChatService = ChatService as jest.MockedClass<typeof ChatService>;
const mockUuid = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('ChatController', () => {
	let mockRequest: Partial<FastifyRequest>;
	let mockReply: Partial<FastifyReply>;
	let mockChatServiceInstance: jest.Mocked<ChatService>;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock i18n translation function
		mockRequest = {
			body: {},
			i18n: {
				t: jest.fn((key: string) => {
					const translations: Record<string, string> = {
						restart: 'Start over',
						support: 'Contact support'
					};
					return translations[key] || key;
				})
			} as any
		};

		mockReply = {
			send: jest.fn().mockReturnThis()
		};

		// Create a mock instance of ChatService
		mockChatServiceInstance = {
			handleRequest: jest.fn()
		} as any;

		// Mock the ChatService constructor to return our mock instance
		mockChatService.mockImplementation(() => mockChatServiceInstance);

		// Override the service instance directly on the controller instance
		(ChatController as any)._chatService = mockChatServiceInstance;

		// Mock UUID generation
		(mockUuid as jest.MockedFunction<typeof uuidv4>).mockReturnValue('123e4567-e89b-12d3-a456-426614174000' as any);
	});

	describe('chat()', () => {
		it('should handle chat request with existing conversationId', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 'node-1'
			};

			const serviceResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'Hello! How can I help you?',
				suggestions: [{ id: 'sug1', text: 'Option 1' }],
				faqs: [],
				isLeaf: false
			};

			mockRequest.body = requestBody;
			mockChatServiceInstance.handleRequest.mockResolvedValue(serviceResponse);

			await ChatController.chat(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockChatServiceInstance.handleRequest).toHaveBeenCalledWith(
				'123e4567-e89b-12d3-a456-426614174000',
				'node-1',
				mockRequest,
				'en'
			);

			expect(mockReply.send).toHaveBeenCalledWith({
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'Hello! How can I help you?',
				suggestions: [{ id: 'sug1', text: 'Option 1' }],
				faqs: [],
				isLeaf: false,
				options: undefined
			});
		});

		it('should generate new conversationId when not provided', async () => {
			const requestBody = {
				nodeId: 'node-1'
			};

			const serviceResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'Welcome! How can I assist you?',
				suggestions: [{ id: 'sug1', text: 'Getting started' }],
				faqs: [],
				isLeaf: false
			};

			mockRequest.body = requestBody;
			mockChatServiceInstance.handleRequest.mockResolvedValue(serviceResponse);

			await ChatController.chat(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockUuid).toHaveBeenCalled();
			expect(mockChatServiceInstance.handleRequest).toHaveBeenCalledWith(
				'123e4567-e89b-12d3-a456-426614174000',
				'node-1',
				mockRequest,
				'en'
			);

			expect(mockReply.send).toHaveBeenCalledWith({
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'Welcome! How can I assist you?',
				suggestions: [{ id: 'sug1', text: 'Getting started' }],
				faqs: [],
				isLeaf: false,
				options: undefined
			});
		});

		it('should include restart and support options when isLeaf is true', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 'leaf-node'
			};

			const serviceResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'This is the end of our conversation.',
				suggestions: [],
				faqs: [],
				isLeaf: true
			};

			mockRequest.body = requestBody;
			mockChatServiceInstance.handleRequest.mockResolvedValue(serviceResponse);

			await ChatController.chat(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockReply.send).toHaveBeenCalledWith({
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'This is the end of our conversation.',
				suggestions: [],
				faqs: [],
				isLeaf: true,
				options: [
					{ action: 'restart', label: 'Start over' },
					{ action: 'support', label: 'Contact support' }
				]
			});
		});

		it('should handle request with FAQs', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 'faq-node'
			};

			const serviceResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'Here are some frequently asked questions:',
				suggestions: [],
				faqs: [
					{
						id: 'faq1',
						question: 'How do I reset my password?',
						answer: 'Click on the forgot password link.'
					}
				],
				isLeaf: false
			};

			mockRequest.body = requestBody;
			mockChatServiceInstance.handleRequest.mockResolvedValue(serviceResponse);

			await ChatController.chat(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockReply.send).toHaveBeenCalledWith({
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'Here are some frequently asked questions:',
				suggestions: [],
				faqs: [
					{
						id: 'faq1',
						question: 'How do I reset my password?',
						answer: 'Click on the forgot password link.'
					}
				],
				isLeaf: false,
				options: undefined
			});
		});

		it('should handle request without nodeId', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000'
			};

			const serviceResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'Welcome to our chatbot!',
				suggestions: [
					{ id: 'topic1', text: 'Topic 1' },
					{ id: 'topic2', text: 'Topic 2' }
				],
				faqs: [],
				isLeaf: false
			};

			mockRequest.body = requestBody;
			mockChatServiceInstance.handleRequest.mockResolvedValue(serviceResponse);

			await ChatController.chat(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockChatServiceInstance.handleRequest).toHaveBeenCalledWith(
				'123e4567-e89b-12d3-a456-426614174000',
				undefined,
				mockRequest,
				'en'
			);

			expect(mockReply.send).toHaveBeenCalledWith({
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'Welcome to our chatbot!',
				suggestions: [
					{ id: 'topic1', text: 'Topic 1' },
					{ id: 'topic2', text: 'Topic 2' }
				],
				faqs: [],
				isLeaf: false,
				options: undefined
			});
		});

		it('should handle chat request with custom language', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 'node-1',
				language: 'es'
			};

			const serviceResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: '¡Hola! ¿Cómo puedo ayudarte?',
				suggestions: [{ id: 'sug1', text: 'Opción 1' }],
				faqs: [],
				isLeaf: false
			};

			mockRequest.body = requestBody;
			mockChatServiceInstance.handleRequest.mockResolvedValue(serviceResponse);

			await ChatController.chat(mockRequest as FastifyRequest, mockReply as FastifyReply);

			expect(mockChatServiceInstance.handleRequest).toHaveBeenCalledWith(
				'123e4567-e89b-12d3-a456-426614174000',
				'node-1',
				mockRequest,
				'es'
			);

			expect(mockReply.send).toHaveBeenCalledWith({
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: '¡Hola! ¿Cómo puedo ayudarte?',
				suggestions: [{ id: 'sug1', text: 'Opción 1' }],
				faqs: [],
				isLeaf: false,
				options: undefined
			});
		});

		it('should handle service errors gracefully', async () => {
			const requestBody = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 'error-node'
			};

			mockRequest.body = requestBody;
			mockChatServiceInstance.handleRequest.mockRejectedValue(new Error('Service error'));

			await expect(ChatController.chat(mockRequest as FastifyRequest, mockReply as FastifyReply)).rejects.toThrow(
				'Service error'
			);

			expect(mockChatServiceInstance.handleRequest).toHaveBeenCalledWith(
				'123e4567-e89b-12d3-a456-426614174000',
				'error-node',
				mockRequest,
				'en'
			);
		});
	});
});
