import { z } from 'zod';
import { CrudOperations } from '../../../src/enums/crud-operations.enum';
import { HttpMethod } from '../../../src/enums/http-methods.enum';
import { FileType } from '../../../src/enums/file-type.enum';
import {
	ErrorResponseSchema,
	CreateCRUDResponseSchema,
	UpdateCRUDResponseSchema,
	DeleteCRUDResponseSchema,
	FetchCRUDResponseSchema,
	FetchAllCRUDResponseSchema,
	CloneCRUDResponseSchema,
	ExportCRUDResponseSchema,
	IdSchema,
	IncludeQueryParams,
	ExportQueryParams,
	pageSearchAndFilterQueryParams,
	CloneRequestSchema
} from '../../../src/schemas/base/base-crud.schema';

describe('base-crud.schema.ts', () => {
	const validUuid = '550e8400-e29b-41d4-a716-446655440000';
	const testModel = 'Test';

	// Test the ErrorResponseSchema
	describe('ErrorResponseSchema', () => {
		it('should create an error response schema with the correct message', () => {
			const errorReason = 'Something went wrong';
			const schema = ErrorResponseSchema(testModel, CrudOperations.CREATE, errorReason);
			const result = schema.parse({});

			expect(result.success).toBe(false);
			expect(result.message).toBe(`Error on ${CrudOperations.CREATE} for ${testModel}: [${errorReason}]`);
		});
	});

	// Test all CRUD response schemas
	describe('CRUD Response Schemas', () => {
		it('should create a valid CreateCRUDResponseSchema', () => {
			const schema = CreateCRUDResponseSchema(testModel);
			// Use zod safeParse to check that the schema is valid before parsing
			const check = schema.safeParse({ id: validUuid });
			expect(check.success).toBe(true);

			const result = schema.parse({ id: validUuid });

			expect(result.success).toBe(true);
			expect(result.id).toBe(validUuid);
			expect(result.message).toBe(`${testModel}: ${CrudOperations.CREATE} executed successfully`);
			expect(result.createdAt).toBeInstanceOf(Date);
		});

		it('should create a valid UpdateCRUDResponseSchema', () => {
			const schema = UpdateCRUDResponseSchema(testModel);
			const result = schema.parse({ id: validUuid });

			expect(result.success).toBe(true);
			expect(result.id).toBe(validUuid);
			expect(result.message).toBe(`${testModel}: ${CrudOperations.UPDATE} executed successfully`);
			expect(result.updatedAt).toBeInstanceOf(Date);
		});

		it('should create a valid DeleteCRUDResponseSchema', () => {
			const schema = DeleteCRUDResponseSchema(testModel);
			const result = schema.parse({ id: validUuid });

			expect(result.success).toBe(true);
			expect(result.id).toBe(validUuid);
			expect(result.message).toBe(`${testModel}: ${CrudOperations.DELETE} executed successfully`);
		});

		it('should create a valid FetchCRUDResponseSchema', () => {
			const schema = FetchCRUDResponseSchema(testModel);
			const result = schema.parse({});

			// With Zod we can check what the schema shape is
			expect(Object.keys(schema.shape)).toEqual([]);
			expect(result).toEqual({});
		});

		it('should create a valid FetchAllCRUDResponseSchema', () => {
			const schema = FetchAllCRUDResponseSchema(testModel);
			const result = schema.parse({ content: [] });

			// Check schema shape with Zod
			expect(Object.keys(schema.shape)).toEqual(['content']);
			expect(result.content).toEqual([]);
		});

		it('should create a valid CloneCRUDResponseSchema', () => {
			const schema = CloneCRUDResponseSchema(testModel);
			const result = schema.parse({});

			expect(result.success).toBe(true);
			expect(result.message).toBe(`${testModel}: ${CrudOperations.CLONE} executed successfully`);
		});

		it('should create a valid ExportCRUDResponseSchema', () => {
			const schema = ExportCRUDResponseSchema(testModel);
			const result = schema.parse({ id: validUuid });

			expect(result.success).toBe(true);
			expect(result.id).toBe(validUuid);
			expect(result.message).toBe(`${testModel}: ${CrudOperations.EXPORT} executed successfully`);
			expect(result.createdAt).toBeInstanceOf(Date);
		});
	});

	// Test IdSchema
	describe('IdSchema', () => {
		it('should validate a valid UUID', () => {
			// Use Zod to validate directly
			const validationResult = z.string().uuid().safeParse(validUuid);
			expect(validationResult.success).toBe(true);

			const result = IdSchema.parse({ id: validUuid });
			expect(result.id).toBe(validUuid);
		});

		it('should reject an invalid UUID', () => {
			const invalidUuid = 'not-a-uuid';

			// Use Zod to validate directly
			const validationResult = z.string().uuid().safeParse(invalidUuid);
			expect(validationResult.success).toBe(false);

			expect(() => IdSchema.parse({ id: invalidUuid })).toThrow();
		});
	});

	// Test IncludeQueryParams
	describe('IncludeQueryParams', () => {
		it('should handle string include parameter with comma', () => {
			const includeValue = 'field1,field2,field3';
			const expectedTransformed = ['field1', 'field2', 'field3'];

			// Create a transformation schema similar to what's in IncludeQueryParams
			const transformSchema = z.string().transform(str => (str.indexOf(',') ? str.split(',') : [str]));

			// Test the transformation directly
			const transformed = transformSchema.parse(includeValue);
			expect(transformed).toEqual(expectedTransformed);

			// Test the full schema
			const result = IncludeQueryParams.parse({ include: includeValue });
			expect(result.include).toEqual(expectedTransformed);
		});

		it('should handle string include parameter without comma', () => {
			const includeValue = 'field1';
			const result = IncludeQueryParams.parse({ include: includeValue });
			expect(result.include).toEqual([includeValue]);
		});

		it('should handle array include parameter', () => {
			const includeValue = ['field1', 'field2'];
			const result = IncludeQueryParams.parse({ include: includeValue });
			expect(result.include).toEqual(includeValue);
		});

		it('should handle missing include parameter', () => {
			const result = IncludeQueryParams.parse({});
			expect(result.include).toBeUndefined();
		});
	});

	// Test ExportQueryParams
	describe('ExportQueryParams', () => {
		it('should use default format when not provided', () => {
			const schema = ExportQueryParams;

			// Use Zod to extract default from schema
			type ExportQueryParamsType = z.infer<typeof schema>;
			const defaultFormat = schema.shape.format._def.defaultValue();
			expect(defaultFormat).toBe(FileType.JSON);

			const result = schema.parse({});
			expect(result.format).toBe(FileType.JSON);
		});

		it('should accept valid format', () => {
			const schema = ExportQueryParams;
			const result = schema.parse({ format: FileType.CSV });
			expect(result.format).toBe(FileType.CSV);
		});

		it('should inherit include behavior from IncludeQueryParams', () => {
			const includeValue = 'field1,field2';
			const expectedTransformed = ['field1', 'field2'];

			const result = ExportQueryParams.parse({
				include: includeValue,
				format: FileType.XLSX
			});

			expect(result.include).toEqual(expectedTransformed);
			expect(result.format).toBe(FileType.XLSX);
		});
	});

	// Test pageSearchAndFilterQueryParams
	describe('pageSearchAndFilterQueryParams', () => {
		it('should set default values for page and size', () => {
			const schema = pageSearchAndFilterQueryParams;

			// Use Zod to extract defaults from schema
			const defaultPage = schema.shape.page._def.defaultValue();
			const defaultSize = schema.shape.size._def.defaultValue();

			expect(defaultPage).toBe(0);
			expect(defaultSize).toBe(10);

			const result = schema.parse({});
			expect(result.page).toBe(defaultPage);
			expect(result.size).toBe(defaultSize);
			expect(result.search).toEqual([]);
			expect(result.sort).toEqual([]);
		});

		// Test search parameter
		describe('search parameter', () => {
			const SEPARATOR = '::'; // Match the separator used in base-crud.schema.ts

			it('should handle single string search parameter', () => {
				const field = 'name';
				const value = 'John';
				const searchParam = `${field}${SEPARATOR}${value}`;

				const result = pageSearchAndFilterQueryParams.parse({
					search: searchParam
				});

				expect(result.search).toEqual([{ field, query: [value], not: false }]);
			});

			it('should handle multiple string search parameters for the same field', () => {
				const field = 'name';
				const values = ['John', 'Doe'];
				const searchParams = values.map(value => `${field}${SEPARATOR}${value}`);

				const result = pageSearchAndFilterQueryParams.parse({
					search: searchParams
				});

				expect(result.search).toEqual([{ field, query: values, not: false }]);
			});

			it('should handle negated search with "!" prefix', () => {
				const field = 'name';
				const value = 'John';
				const searchParam = `!${field}${SEPARATOR}${value}`;

				const result = pageSearchAndFilterQueryParams.parse({
					search: searchParam
				});

				expect(result.search).toEqual([{ field, query: [value], not: true }]);
			});

			it('should handle empty or invalid search format', () => {
				const result = pageSearchAndFilterQueryParams.parse({
					search: 'invalidformat'
				});
				expect(result.search).toEqual([]);
			});

			it('should handle null search parameter', () => {
				const result = pageSearchAndFilterQueryParams.parse({
					search: null
				});
				expect(result.search).toEqual(null);
			});

			it('should handle direct object search input', () => {
				const searchObject = { field: 'name', query: ['John'], not: true };

				const result = pageSearchAndFilterQueryParams.parse({
					search: [searchObject]
				});

				expect(result.search).toEqual([searchObject]);
			});
		});

		// Test sort parameter
		describe('sort parameter', () => {
			const SEPARATOR = '::'; // Match the separator used in base-crud.schema.ts

			it('should handle single string sort parameter', () => {
				const field = 'name';
				const direction = 'ASC';
				const sortParam = `${field}${SEPARATOR}${direction}`;

				const result = pageSearchAndFilterQueryParams.parse({
					sort: sortParam
				});

				expect(result.sort).toEqual([{ field, direction }]);
			});

			it('should handle multiple string sort parameters', () => {
				const sortParams = [`name${SEPARATOR}ASC`, `age${SEPARATOR}DESC`];

				const result = pageSearchAndFilterQueryParams.parse({
					sort: sortParams
				});

				expect(result.sort).toEqual([
					{ field: 'name', direction: 'ASC' },
					{ field: 'age', direction: 'DESC' }
				]);
			});

			it('should throw error for invalid sort direction', () => {
				const field = 'name';
				const invalidDirection = 'INVALID';
				const sortParam = `${field}${SEPARATOR}${invalidDirection}`;

				expect(() =>
					pageSearchAndFilterQueryParams.parse({
						sort: sortParam
					})
				).toThrow(`Invalid sort direction '${invalidDirection}'. Use ASC or DESC.`);
			});

			it('should handle empty or invalid sort format', () => {
				const result = pageSearchAndFilterQueryParams.parse({
					sort: 'invalidformat'
				});
				expect(result.sort).toEqual([]);
			});

			it('should handle null sort parameter', () => {
				const result = pageSearchAndFilterQueryParams.parse({
					sort: null
				});
				expect(result.sort).toEqual(null);
			});

			it('should handle direct object sort input', () => {
				const sortObject = { field: 'name', direction: 'ASC' as const };

				const result = pageSearchAndFilterQueryParams.parse({
					sort: [sortObject]
				});

				expect(result.sort).toEqual([sortObject]);
			});
		});
	});

	// Test CloneRequestSchema
	describe('CloneRequestSchema', () => {
		it('should validate a valid clone request', () => {
			// Create data using schema shape
			const attributesToChange = new Map([['name', 'New Name']]);
			const componentsToClone = new Map([
				['component1', true],
				['component2', false]
			]);

			const data = {
				attributesToChange,
				componentsToClone
			};

			const validationResult = CloneRequestSchema.safeParse(data);
			expect(validationResult.success).toBe(true);

			const result = CloneRequestSchema.parse(data);
			expect(result).toEqual(data);
		});

		it('should reject when required fields are missing', () => {
			const partial1 = { attributesToChange: new Map([['name', 'New Name']]) };
			const partial2 = { componentsToClone: new Map([['component1', true]]) };

			const check1 = CloneRequestSchema.safeParse({});
			const check2 = CloneRequestSchema.safeParse(partial1);
			const check3 = CloneRequestSchema.safeParse(partial2);

			expect(check1.success).toBe(false);
			expect(check2.success).toBe(false);
			expect(check3.success).toBe(false);

			expect(() => CloneRequestSchema.parse({})).toThrow();
			expect(() => CloneRequestSchema.parse(partial1)).toThrow();
			expect(() => CloneRequestSchema.parse(partial2)).toThrow();
		});
	});
});
