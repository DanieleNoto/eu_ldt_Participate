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
