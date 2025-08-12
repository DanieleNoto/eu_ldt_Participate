/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Model } from 'sequelize-typescript';
import { Identifier } from 'sequelize/types/model';
import { AnyZodSchema } from '../../schemas/base/base-crud.schema';
import { BaseReadonlyService } from '../../services/base/base-readonly.service';
import { BaseController } from './base.controller';

/**
 * Generic CRUD Controller that extends BaseController.
 */
export abstract class BaseReadonlyController<
	Entity extends Model<Entity>,
	ID extends Identifier
> extends BaseController {
	/**
	 * Service instance that must implement standard CRUD methods.
	 */
	protected abstract service: BaseReadonlyService<Entity, ID>;

	/**
	 * Handles retrieving all resources.
	 */
	async getAll(
		querySchema: AnyZodSchema | undefined,
		responseSchema: AnyZodSchema | undefined,
		req: FastifyRequest,
		reply: FastifyReply
	) {
		try {
			const query = req.query as any;
			const queryParams = querySchema?.parse(query) || {};

			const results: any = await this.service.getAll(queryParams, {});
			const response = responseSchema?.parse({
				content: results.rows,
				metadata: results.metadata
			});

			BaseController.sendResponse(reply, response);
		} catch (error) {
			BaseController.sendError(
				reply,
				error,
				500,
				`Failed to fetch resources for model: ${this.service.constructor.name}`
			);
		}
	}

	/**
	 * Handles retrieving a resource by ID.
	 */
	async getById(
		querySchema: AnyZodSchema | null,
		responseSchema: AnyZodSchema | undefined,
		req: FastifyRequest /*<{ Params: { id: ID } }>*/,
		reply: FastifyReply
	) {
		try {
			const params = BaseController.validateParams<{ id: ID }>(this.getIdSchema(), req, reply);
			if (!params) return;

			const query = req.query as any;
			const queryParams = querySchema?.parse(query) as any;

			const result = await this.service.getById(params.id, {
				include: queryParams?.include
			});

			const response = responseSchema?.parse(result);
			if (!result) return BaseController.sendError(reply, null, 404, 'Resource not found');
			BaseController.sendResponse(reply, response);
		} catch (error) {
			BaseController.sendError(
				reply,
				error,
				500,
				`Failed to fetch resource for model: ${this.service.constructor.name}`
			);
		}
	}

	public getModelMetadata() {
		return this.service.getModelMetadata();
	}

	/**
	 * Method that must be implemented by derived controllers to provide ID schema validation.
	 */
	protected abstract getIdSchema(): any;

	/**
	 * Method that must be implemented by derived controllers to provide schema validation for reqeust.
	 */
	protected abstract getRequestSchema(): any;
}
