// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import autoload from '@fastify/autoload';
import fp from 'fastify-plugin';
const path = require('path');

export default fp(async function (fastify, opts) {
	const routesDir = path.join(__dirname, '..', 'routes');
	fastify.log.info(`Autoload plugin: Loading routes from directory: ${routesDir}`);
	fastify.log.info(`Autoload plugin: CONTEXT_URL prefix: ${process.env.CONTEXT_URL}`);

	fastify.register(autoload, {
		dir: routesDir,
		options: Object.assign({ prefix: process.env.CONTEXT_URL }, opts)
	});
});
