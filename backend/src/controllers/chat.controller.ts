import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { ChatRequestSchema, ChatResponseSchema } from '../schemas/chat.schema';
import { ChatService } from '../services/chat.service';
import { BaseController } from './base/base.controller';

class ChatController extends BaseController {
	private _chatService = new ChatService();

	async chat(request: FastifyRequest, reply: FastifyReply) {
		const { conversationId, nodeId } = ChatRequestSchema.parse(request.body);
		const convId = conversationId ?? uuidv4();

		const {
			conversationId: cid,
			answer,
			suggestions,
			faqs,
			isLeaf
		} = await this._chatService.handleRequest(convId, nodeId, request);

		const response = {
			conversationId: cid,
			answer,
			suggestions,
			faqs,
			isLeaf,
			options: isLeaf
				? [
						{ action: 'restart', label: request.i18n.t('restart') },
						{ action: 'support', label: request.i18n.t('support') }
					]
				: undefined
		};

		ChatResponseSchema.parse(response);
		return reply.send(response);
	}
}

export default new ChatController();
