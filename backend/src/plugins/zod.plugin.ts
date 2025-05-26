/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import fp from 'fastify-plugin';
import { createSerializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

export default fp(async function (fastify, opts) {
	// Create a custom serializer compiler
	const customSerializerCompiler = createSerializerCompiler({ replacer });

	// Add schema validator and serializer
	fastify.setValidatorCompiler(validatorCompiler);
	fastify.setSerializerCompiler(customSerializerCompiler);
});

const replacer = function (this: any, key: string, value: any) {
	return value;
};
