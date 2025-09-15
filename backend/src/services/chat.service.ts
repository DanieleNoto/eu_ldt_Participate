import { FastifyRequest } from 'fastify';
import { execute } from '../handlers/chat.registry';
import Conversation from '../models/entities/conversation.model';
import { loadTree, QATree } from '../utils/qaTree';

export class ChatService {
	private readonly _tree: QATree;

	constructor() {
		this._tree = loadTree();
	}

	/**
	 * Handle chat request: logs a new conversation entry and returns bot response
	 */
	async handleRequest(
		conversationId: string,
		nodeId: string | undefined,
		request: FastifyRequest,
		language: string = 'en'
	) {
		const root = this._tree['root'];
		const node = nodeId && this._tree[nodeId] ? this._tree[nodeId] : root;

		// Set the language for this request
		if (request.i18n && typeof request.i18n.changeLanguage === 'function') {
			request.i18n.changeLanguage(language);
		}

		// Invoke handler if defined on request context
		if (node.handlerId) {
			await execute(node.handlerId, {
				nodeId: node.id,
				conversationId,
				params: node.handlerParams,
				request
			});
		}

		const payload = {
			conversationId,
			nodeId: node.id,
			message: node.questionKey
		};

		// Build and save to satisfy Model typing
		const entry = await Conversation.create(payload);
		const convId = entry.conversationId;

		// Generate response
		const answer = request.i18n.t(node.answerKey || node.questionKey);

		// Build suggestions from children or additionalSuggestions
		let suggestions = node.children.map(({ id, labelKey }: { id: string; labelKey: string }) => ({
			id,
			text: request.i18n.t(labelKey)
		}));

		// If we have FAQs and additionalSuggestions, use the additionalSuggestions for topic switching
		if (node.faqs && node.faqs.length > 0 && node.additionalSuggestions) {
			suggestions = node.additionalSuggestions.map(({ id, labelKey }: { id: string; labelKey: string }) => ({
				id,
				text: request.i18n.t(labelKey)
			}));
		}

		// Add FAQs if available
		const faqs = node.faqs
			? node.faqs.map(faq => ({
					id: faq.id,
					question: request.i18n.t(faq.questionKey),
					answer: request.i18n.t(faq.answerKey)
				}))
			: [];

		const isLeaf = node.children.length === 0 && !node.faqs?.length;

		return { conversationId: convId, answer, suggestions, faqs, isLeaf };
	}
}
