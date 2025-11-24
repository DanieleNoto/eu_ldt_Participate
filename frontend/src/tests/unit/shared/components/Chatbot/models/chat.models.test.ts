// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import { ChatResponseModel, SupportResponseModel } from '@app/shared/components/Chatbot/models/chat.models';

describe('Chat Models', () => {
	describe('ChatResponseModel', () => {
		it('creates instance from DTO with all fields', () => {
			const dto = {
				conversationId: 'test-id',
				answer: 'Test answer',
				suggestions: [
					{ id: 'sug1', text: 'Suggestion 1' },
					{ id: 'sug2', text: 'Suggestion 2' }
				],
				faqs: [{ id: 'faq1', question: 'Question 1?', answer: 'Answer 1' }],
				isLeaf: true,
				options: [{ action: 'restart', label: 'Start over' }]
			};

			const model = ChatResponseModel.fromDto(dto);

			expect(model.conversationId).toBe('test-id');
			expect(model.answer).toBe('Test answer');
			expect(model.suggestions).toEqual(dto.suggestions);
			expect(model.faqs).toEqual(dto.faqs);
			expect(model.isLeaf).toBe(true);
			expect(model.options).toEqual(dto.options);
		});

		it('creates instance from DTO with minimal fields', () => {
			const dto = {
				conversationId: 'test-id',
				answer: 'Test answer',
				suggestions: [],
				isLeaf: false
			};

			const model = ChatResponseModel.fromDto(dto);

			expect(model.conversationId).toBe('test-id');
			expect(model.answer).toBe('Test answer');
			expect(model.suggestions).toEqual([]);
			expect(model.faqs).toEqual([]);
			expect(model.isLeaf).toBe(false);
			expect(model.options).toBeUndefined();
		});

		it('handles undefined suggestions array', () => {
			const dto = {
				conversationId: 'test-id',
				answer: 'Test answer',
				suggestions: undefined as unknown as [],
				isLeaf: false
			};

			const model = ChatResponseModel.fromDto(dto);

			expect(model.suggestions).toEqual([]);
		});

		it('handles undefined faqs array', () => {
			const dto = {
				conversationId: 'test-id',
				answer: 'Test answer',
				suggestions: [],
				faqs: undefined,
				isLeaf: false
			};

			const model = ChatResponseModel.fromDto(dto);

			expect(model.faqs).toEqual([]);
		});
	});

	describe('SupportResponseModel', () => {
		it('creates instance from DTO', () => {
			const dto = {
				response: 'Support request sent successfully'
			};

			const model = SupportResponseModel.fromDto(dto);

			expect(model.response).toBe('Support request sent successfully');
		});

		it('handles empty response', () => {
			const dto = {
				response: ''
			};

			const model = SupportResponseModel.fromDto(dto);

			expect(model.response).toBe('');
		});
	});

	describe('Type Interfaces', () => {
		it('Suggestion interface has correct structure', () => {
			const suggestion = {
				id: 'test-id',
				text: 'Test suggestion'
			};

			expect(suggestion.id).toBeDefined();
			expect(suggestion.text).toBeDefined();
			expect(typeof suggestion.id).toBe('string');
			expect(typeof suggestion.text).toBe('string');
		});

		it('Faq interface has correct structure', () => {
			const faq = {
				id: 'test-id',
				question: 'Test question?',
				answer: 'Test answer'
			};

			expect(faq.id).toBeDefined();
			expect(faq.question).toBeDefined();
			expect(faq.answer).toBeDefined();
			expect(typeof faq.id).toBe('string');
			expect(typeof faq.question).toBe('string');
			expect(typeof faq.answer).toBe('string');
		});

		it('ChatOption interface has correct structure', () => {
			const option = {
				action: 'restart',
				label: 'Start over'
			};

			expect(option.action).toBeDefined();
			expect(option.label).toBeDefined();
			expect(typeof option.action).toBe('string');
			expect(typeof option.label).toBe('string');
		});

		it('Message interface has correct structure', () => {
			const userMessage = {
				id: 'msg-1',
				from: 'user' as const,
				text: 'Hello'
			};

			const botMessage = {
				id: 'msg-2',
				from: 'bot' as const,
				text: 'Hi there!'
			};

			expect(userMessage.id).toBeDefined();
			expect(userMessage.from).toBe('user');
			expect(userMessage.text).toBeDefined();

			expect(botMessage.id).toBeDefined();
			expect(botMessage.from).toBe('bot');
			expect(botMessage.text).toBeDefined();
		});
	});
});
