// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { FastifyRequest } from 'fastify';

export interface HandlerContext {
	nodeId: string;
	conversationId: string;
	params?: unknown;
	request: FastifyRequest;
}

type HandlerFn = (ctx: HandlerContext) => Promise<void> | void;

const REGISTRY = new Map<string, HandlerFn>();

export const chatActionRegister = (id: string, fn: HandlerFn) => {
	REGISTRY.set(id, fn);
};

export const execute = (id: string, ctx: HandlerContext) => {
	const fn = REGISTRY.get(id);
	if (!fn) throw new Error(`Handler "${id}" not managed correctly`);
	return fn(ctx);
};
