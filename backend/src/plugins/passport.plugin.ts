/* eslint-disable prefer-arrow/prefer-arrow-functions */
import fp from 'fastify-plugin';
import fastifyPassport from '@fastify/passport';

// TODO [HIGH][20250205][piespedica]: Check how to manage auth with API GW and without
export default fp(async function (fastify, opts) {
	// fastify.register(fastifyPassport.initialize());
	// fastify.register(fastifyPassport.secureSession());
});
