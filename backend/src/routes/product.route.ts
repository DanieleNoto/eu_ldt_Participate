import { FastifyInstance } from 'fastify';
import ProductController from '../controllers/product.controller';
import { ProductIdSchema, ProductRequestSchema, ProductResponseSchemas } from '../schemas/product.schema';
import { registerCrudRoutes } from './base/base-crud.routes';

export default async (app: FastifyInstance) => {
	const resourceName = 'products';
	registerCrudRoutes({
		app,
		resourceName,
		controller: ProductController,
		paramsSchema: ProductIdSchema,
		bodySchema: ProductRequestSchema,
		responseSchema: ProductResponseSchemas
	});
};
