/* eslint-disable prefer-arrow/prefer-arrow-functions */
import cors from '@fastify/cors';
import fp from 'fastify-plugin';

export default fp(async function (fastify, opts) {
	fastify.register(cors, {
		origin: ['http://localhost:5001', 'http://localhost:3000'],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
	});
});
