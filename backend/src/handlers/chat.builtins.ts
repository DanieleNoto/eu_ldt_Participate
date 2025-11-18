// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import logger from '../utils/logger';
import { chatActionRegister } from './chat.registry';

export const startChatBuiltins = async () => {
	chatActionRegister('logNode', ({ nodeId, conversationId }: { nodeId: string; conversationId: string }) => {
		logger.info(`[handler:logNode] conv=${conversationId} node=${nodeId}`);
	});
};
