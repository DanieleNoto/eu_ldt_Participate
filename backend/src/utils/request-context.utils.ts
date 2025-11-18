// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { requestContext, RequestContextData } from '@fastify/request-context';

export const getRequestContext: () => RequestContextData = (): RequestContextData =>
	requestContext.getStore() as RequestContextData;
