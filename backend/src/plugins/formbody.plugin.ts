/* eslint-disable prefer-arrow/prefer-arrow-functions */
import formbody from '@fastify/formbody';
import fp from 'fastify-plugin';

export default fp(async function (fastify, opts) {
	fastify.register(formbody);
});
