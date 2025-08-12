import { z } from 'zod';
import { CrudOperations } from '../../enums/crud-operations.enum';
import { StatusEnum } from '../../enums/status.enum';
import { HttpMethod } from '../../enums/http-methods.enum';
import { FileType } from '../../enums/file-type.enum';

const SEPARATOR = '::';

export const CloneRequestSchema = z.object({
	attributesToChange: z.map(z.string(), z.any()),
	componentsToClone: z.map(z.string(), z.boolean())
});

const createResponseSchema = (
	model: string,
	operation: CrudOperations | HttpMethod | string,
	executed: boolean = true,
	reason?: string
) => {
	const message = executed
		? `${model}: ${operation} executed successfully`
		: `Error on ${operation} for ${model}: [${reason}]`;

	return z.object({
		success: z.boolean().default(executed),
		message: z.string().default(message)
	});
};

export const ErrorResponseSchema = (model: string, operation: CrudOperations, reason: string) => {
	return createResponseSchema(model, operation, false, reason);
};

export const CreateCRUDResponseSchema = (model: string) => {
	return createResponseSchema(model, CrudOperations.CREATE).extend({
		id: z.string().uuid(),
		createdAt: z.coerce.date().default(() => new Date())
	});
};

export const UpdateCRUDResponseSchema = (model: string) => {
	return createResponseSchema(model, CrudOperations.UPDATE).extend({
		id: z.string().uuid(),
		updatedAt: z.coerce.date().default(() => new Date())
	});
};

export const DeleteCRUDResponseSchema = (model: string) => {
	return createResponseSchema(model, CrudOperations.DELETE).extend({
		id: z.string().uuid()
	});
};

export const FetchCRUDResponseSchema = (model: string) => {
	return z.object({});
};

export const FetchAllCRUDResponseSchema = (model: string) => {
	return z.object({
		content: z.array(FetchCRUDResponseSchema(model))
	});
};

export const CloneCRUDResponseSchema = (model: string) => {
	return createResponseSchema(model, CrudOperations.CLONE);
};

export const RevertCRUDResponseSchema = (model: string) => {
	return createResponseSchema(model, CrudOperations.REVERT);
};

export const ExportCRUDResponseSchema = (model: string) => {
	return createResponseSchema(model, CrudOperations.EXPORT).extend({
		id: z.string().uuid(),
		createdAt: z.coerce.date().default(() => new Date())
	});
};

export const IdSchema = z.object({
	id: z.string().uuid('Invalid UUID')
});

// Generic schema type to represent any Zod schema object (replacement for deprecated AnyZodObject)
export type AnyZodSchema = z.ZodTypeAny;

export interface RequestSchemas {
	create?: AnyZodSchema;
	update?: AnyZodSchema;
	delete?: AnyZodSchema;
	fetch?: AnyZodSchema;
	fetchAll?: AnyZodSchema;
	clone?: AnyZodSchema;
}

export interface ResponseSchemas {
	fetch?: AnyZodSchema;
	fetchAll?: AnyZodSchema;
	create?: AnyZodSchema;
	update?: AnyZodSchema;
	delete?: AnyZodSchema;
	clone?: AnyZodSchema;
	export?: AnyZodSchema;
	revert?: AnyZodSchema;
}

export const auditVersionSchema = z.object({
	status: z
		.enum([StatusEnum.DRAFT, StatusEnum.ACTIVE, StatusEnum.COMPLETED, StatusEnum.DELETED])
		.default(StatusEnum.DRAFT),
	version: z.number(),
	author: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date()
});

export const metadata = z.object({
	metadata: z.object({
		total: z.number(),
		page: z.number(),
		size: z.number(),
		sort: z.array(
			z.object({
				field: z.string(),
				direction: z.enum(['DESC', 'ASC'])
			})
		)
	})
});

export const DeleteQueryParams = z.object({
	// includeDependencies: z.union([z.boolean().optional().default(false), z.string().optional().default('false')])
});

export const IncludeQueryParams = z.object({
	include: z
		.union([z.array(z.string()), z.string().transform(str => (str.indexOf(',') ? str.split(',') : [str]))])
		.optional()
});

export const ExportQueryParams = IncludeQueryParams.extend({
	format: z.enum([FileType.PDF, FileType.JSON, FileType.CSV, FileType.XLSX]).default(FileType.JSON)
});

export const pageSearchAndFilterQueryParams = z.object({
	page: z.coerce
		.number()
		.nullable()
		.default(0)
		.describe('<b>Page number</b>: The <i>current</i> page number. Defaults to `0`'),
	size: z.coerce.number().nullable().default(10).describe('<b>Page size</b>. Defaults to `10`'),

	search: z
		.preprocess(
			value => (typeof value === 'string' ? [value] : value),
			z.union([
				z
					.array(z.string())
					.nullable()
					.default([])
					.transform(search => {
						if (!search) return [];
						const searchObject: Record<string, string[]> = {};
						search.forEach(entry => {
							const [field, ...values] = entry.split(SEPARATOR);
							if (field && values.length) {
								if (!searchObject[field]) {
									searchObject[field] = values;
								} else {
									searchObject[field].push(...values);
								}
							}
						});

						return Object.entries(searchObject).map(([field, query]: [string, string[]]) => {
							return field.startsWith('!')
								? { field: field.substring(1), query, not: true }
								: { field, query, not: false };
						});
					}),

				z.array(
					z.object({
						field: z.string(),
						query: z.array(z.string()).nullable().default([]),
						not: z.boolean().nullable().default(false)
					})
				)
			])
		)
		.nullable()
		.describe(
			'<b>Search options:</b>' +
				'<ul>' +
				'  <li>Example: <code>name' +
				SEPARATOR +
				'Tomas</code>, or [{ field: "name", query: ["Tomas"] }]</li>' +
				'  <li>or <code>!name' +
				SEPARATOR +
				'Tomas</code>, or [{ field: "name", query: ["Tomas"], not: true }]</li>' +
				'</ul>'
		),

	sort: z
		.preprocess(
			value => (typeof value === 'string' ? [value] : value),
			z.union([
				z
					.array(z.string())
					.nullable()
					.default([])
					.transform(sort => {
						if (!sort) return [];
						const sortObject: Record<string, string> = {};
						sort.forEach(entry => {
							const [field, direction] = entry.split(SEPARATOR);
							if (field && direction) {
								sortObject[field] = direction.toUpperCase();
							}
						});
						return Object.entries(sortObject).map(([field, direction]) => {
							if (!['ASC', 'DESC'].includes(direction)) {
								throw new Error(`Invalid sort direction '${direction}'. Use ASC or DESC.`);
							}
							return { field, direction };
						});
					}),

				z.array(
					z.object({
						field: z.string(),
						direction: z.enum(['ASC', 'DESC'])
					})
				)
			])
		)
		.nullable()
		.describe(
			'<b>Sorting options:</b>' +
				'<ul>' +
				'  <li>Example: <code>name' +
				SEPARATOR +
				'ASC</code>, <code>age' +
				SEPARATOR +
				'DESC</code>, or [{ field: "id", direction: "ASC" }]</li>' +
				'</ul>'
		)
});
