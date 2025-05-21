import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * Startup a new routes group in a Fastify instance with Zod type provider.
 * Ensures `app.withTypeProvider<ZodTypeProvider>()` is applied once.
 *
 * @param app - Fastify instance
 * @param tag - Fastify routes tag
 */
export const startupRoute = (app: FastifyInstance) => {
	// Apply Zod Type Provider once per route file
	app.withTypeProvider<ZodTypeProvider>();
};
