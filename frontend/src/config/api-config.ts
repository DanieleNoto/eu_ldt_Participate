// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
import { ApiConfigConstructor } from '@app/core/api-client/models/api-config.model';

export enum BackendApiName {
	FETCH_TODOS = 'fetchTodos',
	CHAT_MESSAGE = 'chatMessage',
	SUPPORT_SEND = 'supportSend'
}

export const API_CONFIG: ApiConfigConstructor[] = [
	{
		name: BackendApiName.CHAT_MESSAGE,
		url: '/api/v1/chat/',
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		}
	},
	{
		name: BackendApiName.SUPPORT_SEND,
		url: '/api/v1/support/send',
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		}
	}
];
