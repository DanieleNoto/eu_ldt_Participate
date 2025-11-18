// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import {
	ChatRequestSchema,
	ChatResponseSchema,
	SupportRequestSchema,
	SupportResponseSchema,
	SuggestionSchema,
	FaqSchema
} from '../../../src/schemas/chat.schema';

describe('Chat Schemas', () => {
	describe('ChatRequestSchema', () => {
		it('should validate valid chat request with both fields', () => {
			const validRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 'node-123'
			};

			const result = ChatRequestSchema.parse(validRequest);
			expect(result).toEqual({
				...validRequest,
				language: 'en'
			});
		});

		it('should validate chat request with only conversationId', () => {
			const validRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000'
			};

			const result = ChatRequestSchema.parse(validRequest);
			expect(result).toEqual({
				...validRequest,
				language: 'en'
			});
		});

		it('should validate chat request with only nodeId', () => {
			const validRequest = {
				nodeId: 'node-123'
			};

			const result = ChatRequestSchema.parse(validRequest);
			expect(result).toEqual({
				...validRequest,
				language: 'en'
			});
		});

		it('should validate empty chat request', () => {
			const validRequest = {};

			const result = ChatRequestSchema.parse(validRequest);
			expect(result).toEqual({
				language: 'en'
			});
		});

		it('should validate chat request with custom language', () => {
			const validRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 'node-123',
				language: 'fr'
			};

			const result = ChatRequestSchema.parse(validRequest);
			expect(result).toEqual(validRequest);
		});

		it('should use default language when not provided', () => {
			const validRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 'node-123'
			};

			const result = ChatRequestSchema.parse(validRequest);
			expect(result.language).toBe('en');
		});

		it('should reject invalid language format', () => {
			const invalidRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 'node-123',
				language: 'x'
			};

			expect(() => ChatRequestSchema.parse(invalidRequest)).toThrow();
		});

		it('should reject invalid UUID for conversationId', () => {
			const invalidRequest = {
				conversationId: 'invalid-uuid',
				nodeId: 'node-123'
			};

			expect(() => ChatRequestSchema.parse(invalidRequest)).toThrow();
		});

		it('should reject non-string nodeId', () => {
			const invalidRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				nodeId: 123
			};

			expect(() => ChatRequestSchema.parse(invalidRequest)).toThrow();
		});
	});

	describe('SuggestionSchema', () => {
		it('should validate valid suggestion', () => {
			const validSuggestion = {
				id: 'suggestion-1',
				text: 'Click here for help'
			};

			const result = SuggestionSchema.parse(validSuggestion);
			expect(result).toEqual(validSuggestion);
		});

		it('should reject suggestion without id', () => {
			const invalidSuggestion = {
				text: 'Click here for help'
			};

			expect(() => SuggestionSchema.parse(invalidSuggestion)).toThrow();
		});

		it('should reject suggestion without text', () => {
			const invalidSuggestion = {
				id: 'suggestion-1'
			};

			expect(() => SuggestionSchema.parse(invalidSuggestion)).toThrow();
		});
	});

	describe('FaqSchema', () => {
		it('should validate valid FAQ', () => {
			const validFaq = {
				id: 'faq-1',
				question: 'How do I reset my password?',
				answer: 'Click on the forgot password link'
			};

			const result = FaqSchema.parse(validFaq);
			expect(result).toEqual(validFaq);
		});

		it('should reject FAQ without required fields', () => {
			const invalidFaq = {
				id: 'faq-1'
			};

			expect(() => FaqSchema.parse(invalidFaq)).toThrow();
		});
	});

	describe('ChatResponseSchema', () => {
		it('should validate complete chat response', () => {
			const validResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'How can I help you?',
				suggestions: [
					{ id: 'sug1', text: 'Option 1' },
					{ id: 'sug2', text: 'Option 2' }
				],
				faqs: [
					{
						id: 'faq1',
						question: 'What is this?',
						answer: 'This is a test'
					}
				],
				isLeaf: false,
				options: [
					{ action: 'restart', label: 'Start over' },
					{ action: 'support', label: 'Contact support' }
				]
			};

			const result = ChatResponseSchema.parse(validResponse);
			expect(result).toEqual(validResponse);
		});

		it('should validate minimal chat response', () => {
			const validResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'Hello',
				suggestions: [],
				isLeaf: true
			};

			const result = ChatResponseSchema.parse(validResponse);
			expect(result).toEqual(validResponse);
		});

		it('should reject invalid conversationId UUID', () => {
			const invalidResponse = {
				conversationId: 'invalid-uuid',
				answer: 'Hello',
				suggestions: [],
				isLeaf: true
			};

			expect(() => ChatResponseSchema.parse(invalidResponse)).toThrow();
		});

		it('should reject missing required fields', () => {
			const invalidResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				suggestions: [],
				isLeaf: true
			};

			expect(() => ChatResponseSchema.parse(invalidResponse)).toThrow();
		});

		it('should validate response with empty suggestions array', () => {
			const validResponse = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				answer: 'No suggestions available',
				suggestions: [],
				isLeaf: true
			};

			const result = ChatResponseSchema.parse(validResponse);
			expect(result).toEqual(validResponse);
		});
	});

	describe('SupportRequestSchema', () => {
		it('should validate valid support request', () => {
			const validRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				message: 'I need help with my account'
			};

			const result = SupportRequestSchema.parse(validRequest);
			expect(result).toEqual(validRequest);
		});

		it('should reject empty message', () => {
			const invalidRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				message: ''
			};

			expect(() => SupportRequestSchema.parse(invalidRequest)).toThrow();
		});

		it('should reject invalid UUID', () => {
			const invalidRequest = {
				conversationId: 'invalid-uuid',
				message: 'Help needed'
			};

			expect(() => SupportRequestSchema.parse(invalidRequest)).toThrow();
		});

		it('should reject missing fields', () => {
			const invalidRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000'
			};

			expect(() => SupportRequestSchema.parse(invalidRequest)).toThrow();
		});

		it('should validate long message', () => {
			const validRequest = {
				conversationId: '123e4567-e89b-12d3-a456-426614174000',
				message:
					'This is a very long support message that contains a lot of detailed information about the issue I am experiencing. It should still be valid as long as it is not empty.'
			};

			const result = SupportRequestSchema.parse(validRequest);
			expect(result).toEqual(validRequest);
		});
	});

	describe('SupportResponseSchema', () => {
		it('should validate valid support response', () => {
			const validResponse = {
				response: 'sent'
			};

			const result = SupportResponseSchema.parse(validResponse);
			expect(result).toEqual(validResponse);
		});

		it('should validate custom response message', () => {
			const validResponse = {
				response: 'Your message has been sent successfully'
			};

			const result = SupportResponseSchema.parse(validResponse);
			expect(result).toEqual(validResponse);
		});

		it('should reject missing response field', () => {
			const invalidResponse = {};

			expect(() => SupportResponseSchema.parse(invalidResponse)).toThrow();
		});

		it('should reject non-string response', () => {
			const invalidResponse = {
				response: 123
			};

			expect(() => SupportResponseSchema.parse(invalidResponse)).toThrow();
		});
	});
});
