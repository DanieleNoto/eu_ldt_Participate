/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { closeTestServer, createTestServer, cleanTestDatabase } from '../../helper/createTestServer';
import { HttpMethod } from '../../../../src/enums/http-methods.enum';
import logger from '../../../../src/utils/logger';
import { testRoute, callSimpleRoute } from '../routes.utils';
import { RouteConfigTest } from './registered-routes';
import { executeCrudRoute } from './crud-utils.routes';

let app: FastifyInstance;

export const setupTestServer = async () => {
	app = await createTestServer();
};

export const teardownTestServer = async () => {
	await closeTestServer();
};

export const runCrudTests = (routeConfigs: RouteConfigTest[], options: { isAssociative?: boolean } = {}) => {
	const { isAssociative = false } = options;
	const executeRoute = isAssociative ? callSimpleRoute : executeCrudRoute;

	routeConfigs.forEach((routeConfig: RouteConfigTest) => {
		const { modelName, baseUrl, requestSchema, responseSchemas, requireDatabase } = routeConfig;

		describe(`${modelName} CRUD Operations`, () => {
			let entityId: string;
			let pathParams: Record<string, string> = {};
			let bodyParams: any = {};

			beforeAll(async () => {
				// Reset database state before each model test suite
				// await cleanTestDatabase();

				pathParams = routeConfig.createParams ? await routeConfig.createParams(app) : {};
				bodyParams = routeConfig.createBodyParams ? await routeConfig.createBodyParams(app) : {};
			});

			if (responseSchemas?.create) {
				describe('CREATE', () => {
					test(`should create a new ${modelName}`, async () => {
						const createResponse = await testRoute(
							app,
							{
								method: HttpMethod.POST,
								baseUrl,
								pathParams,
								bodyParams,
								requestSchema,
								responseSchema: responseSchemas.create,
								isAssociative
							},
							executeRoute
						);
						expect(createResponse.id).toBeDefined();

						if (isAssociative) {
							// For associative routes, id is an array of objects
							expect(Array.isArray(createResponse.id)).toBe(true);
							expect(createResponse.id.length).toBeGreaterThan(0);
							// Store the first association ID for subsequent operations
							entityId = createResponse.id[0].id;
						} else {
							entityId = createResponse.id;
						}
						logger.info(`Created ${modelName} with ID: ${entityId}`);
					});
				});

				describe('CREATE [failing]', () => {
					test(`should create a new ${modelName}`, async () => {
						const createResponse = await testRoute(
							app,
							{
								method: HttpMethod.POST,
								baseUrl,
								pathParams,
								responseSchema: z.object({
									statusCode: z.number(),
									error: z.string()
								}),
								isAssociative
							},
							executeRoute
						);
						expect(createResponse.statusCode).not.toBe(201);
						logger.info(`Created [failing] ${modelName} response: ${createResponse}`);
					});
				});
			}

			if (responseSchemas?.fetch) {
				describe('READ', () => {
					test(`should get ${modelName} by ID`, async () => {
						expect(entityId).toBeTruthy();

						const fetchResponse = await testRoute(
							app,
							{
								method: HttpMethod.GET,
								baseUrl,
								pathParams: { ...pathParams, id: entityId },
								bodyParams: {},
								requestSchema,
								responseSchema: responseSchemas.fetch,
								isAssociative
							},
							executeRoute
						);

						// FETCH specific tests
						expect(fetchResponse).toBeDefined();
						if (isAssociative) {
							expect(fetchResponse.id).toBeDefined();
						} else {
							expect(fetchResponse.id).toBe(entityId);
						}
					});
				});

				describe('READ [failing]', () => {
					test(`should not get ${modelName} by ID`, async () => {
						expect(entityId).toBeTruthy();

						const fetchResponse = await testRoute(
							app,
							{
								method: HttpMethod.GET,
								baseUrl,
								pathParams: { ...pathParams, id: 'invalid-id' },
								bodyParams: {},
								requestSchema,
								responseSchema: z.object({
									statusCode: z.number(),
									error: z.string()
								}),
								isAssociative
							},
							executeRoute
						);

						// FETCH specific tests
						expect(fetchResponse.statusCode).not.toBe(200);
					});
				});
			}

			if (responseSchemas?.fetchAll) {
				describe('READ ALL', () => {
					test(`should list all ${modelName}s`, async () => {
						if (requireDatabase) expect(entityId).toBeTruthy();

						// Execute call and verify generic tests
						const fetchAllResponse = await testRoute(
							app,
							{
								method: HttpMethod.GET,
								baseUrl,
								pathParams,
								bodyParams: {},
								requestSchema,
								responseSchema: responseSchemas.fetchAll,
								isAssociative
							},
							executeRoute
						);

						// FETCH ALL specific tests
						expect(fetchAllResponse.content).toBeDefined();
						expect(Array.isArray(fetchAllResponse.content)).toBe(true);

						// Our entity should be in the list
						if (requireDatabase) {
							const foundEntity = fetchAllResponse.content.find((item: any) => item.id === entityId);
							expect(foundEntity).toBeDefined();
						}
					});
				});
			}

			if (responseSchemas?.update) {
				describe('UPDATE', () => {
					test(`should update ${modelName}`, async () => {
						expect(entityId).toBeTruthy();

						const updateResponse = await testRoute(
							app,
							{
								method: HttpMethod.PUT,
								baseUrl,
								pathParams: { ...pathParams, id: entityId },
								bodyParams,
								requestSchema,
								responseSchema: responseSchemas.update,
								isAssociative
							},
							executeRoute
						);

						// UPDATE specific tests
						if (isAssociative) {
							// For associative routes, the id should be an array
							expect(Array.isArray(updateResponse.id)).toBe(true);
							expect(updateResponse.id.length).toBeGreaterThan(0);
						} else {
							// For regular routes, the id should match the entity id
							expect(updateResponse.id).toBe(entityId);
						}
					});
				});
			}
			if (responseSchemas?.delete) {
				describe('DELETE', () => {
					test(`should delete ${modelName}`, async () => {
						expect(entityId).toBeTruthy();

						const deleteResponse = await testRoute(
							app,
							{
								method: HttpMethod.DELETE,
								baseUrl,
								pathParams: { ...pathParams, id: entityId },
								bodyParams,
								requestSchema,
								responseSchema: responseSchemas.delete,
								isAssociative
							},
							executeRoute
						);

						// DELETE specific tests
						if (isAssociative) {
							expect(Array.isArray(deleteResponse.id)).toBe(true);
							expect(deleteResponse.id.length).toBeGreaterThan(0);
						} else {
							expect(deleteResponse.id).toEqual(entityId);
						}
					});

					test(`should not delete ${modelName}`, async () => {
						expect(entityId).toBeTruthy();

						const deleteResponse = await testRoute(
							app,
							{
								method: HttpMethod.DELETE,
								baseUrl,
								pathParams: { ...pathParams, id: entityId },
								bodyParams,
								requestSchema,
								responseSchema: z.object({
									statusCode: z.number(),
									error: z.string(),
									details: z.array(z.string())
								}),
								isAssociative
							},
							executeRoute
						);

						// DELETE specific tests
						if (isAssociative) {
							// nothing to do
						} else {
							expect(deleteResponse.statusCode).toEqual(500);
						}

						/*
							{
							  "statusCode": 500,
							  "error": "Failed to delete resource for model: ScenarioService",
							  "details": [
								"Entity already deleted"
							  ]
							}
						* */
					});
				});
			}
		});
	});
};
