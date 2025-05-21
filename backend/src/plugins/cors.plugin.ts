/* eslint-disable prefer-arrow/prefer-arrow-functions */
import cors from '@fastify/cors';
import fp from 'fastify-plugin';

export default fp(async function (fastify, opts) {
	fastify.register(cors);
});
