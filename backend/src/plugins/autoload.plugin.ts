/* eslint-disable prefer-arrow/prefer-arrow-functions */
import autoload from '@fastify/autoload';
import fp from 'fastify-plugin';
const path = require('path');

export default fp(async function (fastify, opts) {
	fastify.register(autoload, {
		dir: path.join(__dirname, '..', 'routes'),
		options: Object.assign({ prefix: process.env.CONTEXT_URL }, opts)
	});
});
