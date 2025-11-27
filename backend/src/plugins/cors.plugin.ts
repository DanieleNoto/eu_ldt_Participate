// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import cors from '@fastify/cors';
import fp from 'fastify-plugin';

const origins = process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
	: ['http://localhost:5001', 'http://localhost:3000'];

export default fp(async function (fastify, opts) {
	fastify.register(cors, {
		origin: origins,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
	});
});
