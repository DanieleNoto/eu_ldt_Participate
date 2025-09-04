import { FastifyRequest } from 'fastify';
import { ChatService } from '../../../src/services/chat.service';
import Conversation from '../../../src/models/entities/conversation.model';
import { loadTree } from '../../../src/utils/qaTree';
import { execute } from '../../../src/handlers/chat.registry';

// Mock dependencies
jest.mock('../../../src/models/entities/conversation.model');
jest.mock('../../../src/utils/qaTree');
jest.mock('../../../src/handlers/chat.registry');

const mockConversation = Conversation as jest.MockedClass<typeof Conversation>;
const mockLoadTree = loadTree as jest.MockedFunction<typeof loadTree>;
const mockExecute = execute as jest.MockedFunction<typeof execute>;

describe('ChatService', () => {
	let chatService: ChatService;
	let mockRequest: Partial<FastifyRequest>;
	let mockTree: any;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock i18n translation function
		mockRequest = {
			i18n: {
				t: jest.fn((key: string) => {
					const translations: Record<string, string> = {
						'root.question': 'Welcome! How can I help you?',
						'root.answer': 'I am here to assist you with your questions.',
						'node1.question': 'Tell me about services',
						'node1.answer': 'Here are our available services:',
						'child1.label': 'Service A',
						'child2.label': 'Service B',
						'faq1.question': 'What is Service A?',
						'faq1.answer': 'Service A is our primary offering.',
						'additional1.label': 'Other topics'
					};
					return translations[key] || key;
				}),
				changeLanguage: jest.fn()
			} as any
		};

		// Mock QA Tree structure
		mockTree = {
			root: {
				id: 'root',
				questionKey: 'root.question',
				answerKey: 'root.answer',
				children: [
					{ id: 'node1', labelKey: 'child1.label' },
					{ id: 'node2', labelKey: 'child2.label' }
				]
			},
			node1: {
				id: 'node1',
				questionKey: 'node1.question',
				answerKey: 'node1.answer',
				children: [],
				faqs: [
					{
						id: 'faq1',
						questionKey: 'faq1.question',
						answerKey: 'faq1.answer'
					}
				],
				additionalSuggestions: [{ id: 'other', labelKey: 'additional1.label' }]
			},
			node2: {
				id: 'node2',
				questionKey: 'node2.question',
				answerKey: 'node2.answer',
				children: [],
				handlerId: 'testHandler',
				handlerParams: { test: 'param' }
			},
			leafNode: {
				id: 'leafNode',
				questionKey: 'leaf.question',
				answerKey: 'leaf.answer',
				children: []
			}
		};

		mockLoadTree.mockReturnValue(mockTree);

		// Mock Conversation.create
		mockConversation.create = jest.fn().mockResolvedValue({
			conversationId: 'test-conv-id',
			nodeId: 'test-node',
			message: 'test-message'
		} as any);

		chatService = new ChatService();
	});

	describe('handleRequest()', () => {
		it('should handle root node request without nodeId', async () => {
			const result = await chatService.handleRequest(
				'test-conv-id',
				undefined,
				'en',
				mockRequest as FastifyRequest
			);

			expect(result).toEqual({
				conversationId: 'test-conv-id',
				answer: 'I am here to assist you with your questions.',
				suggestions: [
					{ id: 'node1', text: 'Service A' },
					{ id: 'node2', text: 'Service B' }
				],
				faqs: [],
				isLeaf: false
			});

			expect(mockConversation.create).toHaveBeenCalledWith({
				conversationId: 'test-conv-id',
				nodeId: 'root',
				message: 'root.question'
			});
		});

		it('should handle specific node request with nodeId', async () => {
			const result = await chatService.handleRequest(
				'test-conv-id',
				'node1',
				'en',
				mockRequest as FastifyRequest
			);

			expect(result).toEqual({
				conversationId: 'test-conv-id',
				answer: 'Here are our available services:',
				suggestions: [{ id: 'other', text: 'Other topics' }],
				faqs: [
					{
						id: 'faq1',
						question: 'What is Service A?',
						answer: 'Service A is our primary offering.'
					}
				],
				isLeaf: false
			});

			expect(mockConversation.create).toHaveBeenCalledWith({
				conversationId: 'test-conv-id',
				nodeId: 'node1',
				message: 'node1.question'
			});
		});

		it('should execute handler when handlerId is present', async () => {
			await chatService.handleRequest('test-conv-id', 'node2', 'en', mockRequest as FastifyRequest);

			expect(mockExecute).toHaveBeenCalledWith('testHandler', {
				nodeId: 'node2',
				conversationId: 'test-conv-id',
				params: { test: 'param' },
				request: mockRequest
			});
		});

		it('should identify leaf nodes correctly', async () => {
			const result = await chatService.handleRequest(
				'test-conv-id',
				'leafNode',
				'en',
				mockRequest as FastifyRequest
			);

			expect(result.isLeaf).toBe(true);
			expect(result.suggestions).toEqual([]);
			expect(result.faqs).toEqual([]);
		});

		it('should handle non-existent nodeId by falling back to root', async () => {
			const result = await chatService.handleRequest(
				'test-conv-id',
				'non-existent-node',
				'en',
				mockRequest as FastifyRequest
			);

			expect(result).toEqual({
				conversationId: 'test-conv-id',
				answer: 'I am here to assist you with your questions.',
				suggestions: [
					{ id: 'node1', text: 'Service A' },
					{ id: 'node2', text: 'Service B' }
				],
				faqs: [],
				isLeaf: false
			});

			expect(mockConversation.create).toHaveBeenCalledWith({
				conversationId: 'test-conv-id',
				nodeId: 'root',
				message: 'root.question'
			});
		});

		it('should use children suggestions when no FAQs and additionalSuggestions', async () => {
			// Modify the tree for this test
			mockTree.node1.faqs = undefined;
			mockTree.node1.additionalSuggestions = undefined;
			mockTree.node1.children = [
				{ id: 'child1', labelKey: 'child1.label' },
				{ id: 'child2', labelKey: 'child2.label' }
			];

			// Add translations for the new children
			const mockT = mockRequest.i18n!.t as jest.MockedFunction<any>;
			mockT.mockImplementation((key: string) => {
				const translations: Record<string, string> = {
					'root.question': 'Welcome! How can I help you?',
					'root.answer': 'I am here to assist you with your questions.',
					'node1.question': 'Tell me about services',
					'node1.answer': 'Here are our available services:',
					'child1.label': 'Child 1 Service',
					'child2.label': 'Child 2 Service'
				};
				return translations[key] || key;
			});

			const result = await chatService.handleRequest(
				'test-conv-id',
				'node1',
				'en',
				mockRequest as FastifyRequest
			);

			expect(result.suggestions).toEqual([
				{ id: 'child1', text: 'Child 1 Service' },
				{ id: 'child2', text: 'Child 2 Service' }
			]);
		});

		it('should handle node without answerKey by using questionKey', async () => {
			// Modify tree to test fallback behavior
			mockTree.testNode = {
				id: 'testNode',
				questionKey: 'test.question',
				children: []
			};

			const result = await chatService.handleRequest(
				'test-conv-id',
				'testNode',
				'en',
				mockRequest as FastifyRequest
			);

			expect(result.answer).toBe('test.question');
		});

		it('should handle database creation failure', async () => {
			mockConversation.create = jest.fn().mockRejectedValue(new Error('Database error'));

			await expect(
				chatService.handleRequest('test-conv-id', 'root', 'en', mockRequest as FastifyRequest)
			).rejects.toThrow('Database error');
		});

		it('should handle handler execution failure by propagating error', async () => {
			mockExecute.mockRejectedValue(new Error('Handler error'));

			await expect(
				chatService.handleRequest('test-conv-id', 'node2', 'en', mockRequest as FastifyRequest)
			).rejects.toThrow('Handler error');

			expect(mockExecute).toHaveBeenCalled();
		});

		it('should handle empty FAQs array', async () => {
			mockTree.node1.faqs = [];

			const result = await chatService.handleRequest(
				'test-conv-id',
				'node1',
				'en',
				mockRequest as FastifyRequest
			);

			expect(result.faqs).toEqual([]);
		});

		it('should handle missing translation keys', async () => {
			// Mock i18n to return the key itself for missing translations
			mockRequest.i18n!.t = jest.fn((key: string) => key) as any;

			const result = await chatService.handleRequest(
				'test-conv-id',
				'node1',
				'en',
				mockRequest as FastifyRequest
			);

			expect(result.answer).toBe('node1.answer');
			expect(mockRequest.i18n!.t).toHaveBeenCalledWith('node1.answer');
		});
	});
});
