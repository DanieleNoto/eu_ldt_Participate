/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance } from 'fastify';
import { ZodSchema } from 'zod';
import { ResponseSchemas } from '../../../../src/schemas/base/base-crud.schema';
import { ProductRequestSchema, ProductResponseSchemas } from '../../../../src/schemas/product.schema';

export interface RouteConfigTest {
	modelName: string;
	baseUrl: string;
	requestSchema?: ZodSchema;
	responseSchemas?: ResponseSchemas;
	createParams?: (app: FastifyInstance) => Promise<Record<string, string>>;
	createBodyParams?: (app: FastifyInstance) => any;
	requireDatabase?: boolean;
}

export const routeSchemas: RouteConfigTest[] = [
	{
		modelName: 'Product',
		baseUrl: '/products',
		requestSchema: ProductRequestSchema,
		responseSchemas: ProductResponseSchemas
	}
];
