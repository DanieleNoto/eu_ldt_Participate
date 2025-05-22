import { z } from 'zod';
import {
	CreateCRUDResponseSchema,
	DeleteCRUDResponseSchema,
	FetchAllCRUDResponseSchema,
	FetchCRUDResponseSchema,
	IdSchema,
	metadata,
	ResponseSchemas,
	UpdateCRUDResponseSchema
} from './base/base-crud.schema';

export const ProductIdSchema = IdSchema;

export const ProductRequestSchema = z.object({
	name: z.string()
});

export const ProductResponseSchemas: ResponseSchemas = {
	create: CreateCRUDResponseSchema('Product'),
	update: UpdateCRUDResponseSchema('Product'),
	delete: DeleteCRUDResponseSchema('Product'),
	fetch: FetchCRUDResponseSchema('Product').extend({
		id: z.string().uuid(),
		name: z.string()
	}),
	fetchAll: FetchAllCRUDResponseSchema('Product')
		.extend({
			content: z.array(
				z.object({
					id: z.string().uuid(),
					name: z.string()
				})
			)
		})
		.merge(metadata)
};

// Type inference for TypeScript
export type ProductIdType = z.infer<typeof ProductIdSchema>;
export type ProductRequestType = z.infer<typeof ProductRequestSchema>;
