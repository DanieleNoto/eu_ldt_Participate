import logger from '../utils/logger';
import { chatActionRegister } from './chat.registry';

export const startChatBuiltins = async () => {
	chatActionRegister('logNode', ({ nodeId, conversationId }: { nodeId: string; conversationId: string }) => {
		logger.info(`[handler:logNode] conv=${conversationId} node=${nodeId}`);
	});
};
