/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Model } from 'sequelize-typescript';
import { Identifier } from 'sequelize/types/model';
import { AnyZodSchema } from '../../schemas/base/base-crud.schema';
import { ValidationError } from '../../utils/errors';
import { BaseCrudService } from '../../services/base/base-crud.service';
import { BaseController } from './base.controller';
import { BaseReadonlyController } from './base-readonly.controller';

/**
 * Generic CRUD Controller that extends BaseController.
 */
export abstract class BaseCrudController<
	Entity extends Model<Entity>,
	ID extends Identifier
> extends BaseReadonlyController<Entity, ID> {
	/**
	 * Service instance that must implement standard CRUD methods.
	 */
	protected abstract service: BaseCrudService<Entity, ID>;

	/**
	 * Handles creating a new resource.
	 */
	async create(responseSchema: AnyZodSchema, req: FastifyRequest /*<{ Body: Entity }>*/, reply: FastifyReply) {
		try {
			const data = BaseController.validateBody<Entity>(this.getRequestSchema(), req, reply);
			if (!data) {
				throw new ValidationError('Body request not valid');
			}

			const entity = (await this.service.create(data, {})) as any;
			const response = responseSchema.parse(entity);
			BaseController.sendResponse(reply, response, 201);
		} catch (error) {
			BaseController.sendError(
				reply,
				error,
				500,
				`Failed to create resource for model: ${this.service.constructor.name}`
			);
		}
	}

	/**
	 * Handles updating a resource by ID.
	 */
	async update(
		responseSchema: AnyZodSchema,
		req: FastifyRequest /*<{ Params: { id: ID }; Body: Partial<Entity> }>*/,
		reply: FastifyReply
	) {
		const params = BaseController.validateParams<{ id: ID }>(this.getIdSchema(), req, reply);
		if (!params) return;

		const data = BaseController.validateBody<Partial<Entity>>(this.getRequestSchema().partial(), req, reply);
		if (!data) return;

		try {
			const entity = await this.service.update(params.id, data, {});
			if (!entity) return BaseController.sendError(reply, null, 404, 'Resource not found');

			const response = responseSchema.parse(entity);

			BaseController.sendResponse(reply, response);
		} catch (error) {
			BaseController.sendError(
				reply,
				error,
				500,
				`Failed to update resource for model: ${this.service.constructor.name}`
			);
		}
	}

	/**
	 * Handles deleting a resource by ID.
	 */
	async delete(
		querySchema: AnyZodSchema | undefined,
		responseSchema: AnyZodSchema | undefined,
		req: FastifyRequest /*<{ Params: { id: ID } }>*/,
		reply: FastifyReply
	) {
		const params = BaseController.validateParams<{ id: ID }>(this.getIdSchema(), req, reply);
		if (!params) return;

		const query = req.query as any;
		const queryParams = querySchema?.parse(query) as any;

		try {
			const entity = await this.service.delete(params.id, {
				includeDependencies: (queryParams as any)?.includeDependencies === true
			});
			if (!entity) return BaseController.sendError(reply, null, 404, 'Resource not found');

			const response = responseSchema?.parse(entity);
			BaseController.sendResponse(reply, response);
		} catch (error) {
			BaseController.sendError(
				reply,
				error,
				500,
				`Failed to delete resource for model: ${this.service.constructor.name}`
			);
		}
	}
}
