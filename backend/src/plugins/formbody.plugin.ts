// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import formbody from '@fastify/formbody';
import fp from 'fastify-plugin';

export default fp(async function (fastify, opts) {
	fastify.register(formbody);
});
