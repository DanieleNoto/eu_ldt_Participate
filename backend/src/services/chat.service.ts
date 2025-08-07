import Conversation from '../models/entities/conversation.model';
import { loadTree, QANode } from '../utils/qaTree';

export class ChatService {
	private _tree: Record<string, QANode>;

	constructor() {
		this._tree = loadTree();
	}

	/**
	 * Handle chat request: logs a new conversation entry and returns bot response
	 */
	async handleRequest(conversationId: string, nodeId: string | undefined, request: any) {
		const root = this._tree['root'];
		const node = nodeId && this._tree[nodeId] ? this._tree[nodeId] : root;

		// Invoke handler if defined on request context
		if (node.handler && typeof request[node.handler] === 'function') {
			request[node.handler](node.id);
		}

		// Prepare data payload for versioned model
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
		const suggestions = node.children.map(({ id, labelKey }) => ({
			id,
			text: request.i18n.t(labelKey)
		}));
		const isLeaf = node.children.length === 0;

		return { conversationId: convId, answer, suggestions, isLeaf };
	}
}
