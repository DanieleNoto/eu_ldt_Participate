import { BaseModel } from '@app/core/api-client/models/base.model';

export interface Suggestion {
	id: string;
	text: string;
}

export interface Faq {
	id: string;
	question: string;
	answer: string;
}

export interface ChatOption {
	action: string;
	label: string;
}

export class ChatResponseModel extends BaseModel {
	conversationId!: string;
	answer!: string;
	suggestions!: Suggestion[];
	faqs?: Faq[];
	isLeaf!: boolean;
	options?: ChatOption[];

	static fromDto(dto: {
		conversationId: string;
		answer: string;
		suggestions: Suggestion[];
		faqs?: Faq[];
		isLeaf: boolean;
		options?: ChatOption[];
	}): ChatResponseModel {
		const model = new ChatResponseModel();
		model.conversationId = dto.conversationId;
		model.answer = dto.answer;
		model.suggestions = dto.suggestions || [];
		model.faqs = dto.faqs || [];
		model.isLeaf = dto.isLeaf;
		model.options = dto.options;
		return model;
	}
}

export class SupportResponseModel extends BaseModel {
	response!: string;

	static fromDto(dto: { response: string }): SupportResponseModel {
		const model = new SupportResponseModel();
		model.response = dto.response;
		return model;
	}
}

export interface Message {
	id: string;
	from: 'bot' | 'user';
	text: string;
}

export interface ChatRequestModel {
	conversationId?: string;
	nodeId?: string;
	language?: string;
}
