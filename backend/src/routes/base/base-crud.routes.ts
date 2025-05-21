import { Model } from 'sequelize-typescript';
import { Identifier } from 'sequelize/types/model';
import { HttpMethod } from '../../enums/http-methods.enum';
import { BaseCrudController } from '../../controllers/base/base-crud.controller';
import { BaseController } from '../../controllers/base/base.controller';
import { DeleteQueryParams, ExportQueryParams, ResponseSchemas } from '../../schemas/base/base-crud.schema';
import { InstanceRouteConfig, registerRoute } from './base.routes';
import { registerReadonlyRoutes } from './base-readonly.routes';

export interface InstanceCrudRouteConfig<C extends BaseController> extends InstanceRouteConfig<C> {
	responseSchema: ResponseSchemas;
}

export const registerCrudRoutes = <
	Entity extends Model,
	ID extends Identifier,
	C extends BaseCrudController<Entity, ID>
>(
	instanceRouteConfig: InstanceCrudRouteConfig<C>
) => {
	registerReadonlyRoutes(instanceRouteConfig);

	/**
	 * POST: Create a new resource
	 * Example: POST /products
	 */
	if (instanceRouteConfig.responseSchema.create) {
		registerRoute({
			...instanceRouteConfig,
			method: HttpMethod.POST,
			response: {
				201: instanceRouteConfig.responseSchema.create
			},
			controllerMethod: instanceRouteConfig.controller.create.bind(
				instanceRouteConfig.controller,
				instanceRouteConfig.responseSchema.create
			)
		});
	}

	/**
	 * PUT: Update a resource by ID
	 * Example: PUT /products/:id
	 */
	if (instanceRouteConfig.responseSchema.update) {
		registerRoute({
			...instanceRouteConfig,
			method: HttpMethod.PUT,
			path: '/:id',
			bodySchema: instanceRouteConfig.bodySchema?.partial(),
			requireParams: true,
			response: {
				200: instanceRouteConfig.responseSchema.update
			},
			controllerMethod: instanceRouteConfig.controller.update.bind(
				instanceRouteConfig.controller,
				instanceRouteConfig.responseSchema.update
			)
		});
	}

	/**
	 * DELETE: Remove a resource by ID
	 * Example: DELETE /products/:id
	 */
	if (instanceRouteConfig.responseSchema.delete) {
		registerRoute({
			...instanceRouteConfig,
			method: HttpMethod.DELETE,
			path: '/:id',
			requireParams: true,
			requireQueries: true,
			querySchema: DeleteQueryParams,
			response: {
				200: instanceRouteConfig.responseSchema.delete
			},
			controllerMethod: instanceRouteConfig.controller.delete.bind(
				instanceRouteConfig.controller,
				DeleteQueryParams,
				instanceRouteConfig.responseSchema.delete
			)
		});
	}

	/**
	 * PATCH: Clone a resource by ID
	 * Example: PATCH /products/:id/clone
	 */
	// if (instanceRouteConfig.responseSchema.clone) {
	// 	registerRoute({
	// 		...instanceRouteConfig,
	// 		method: HttpMethod.PATCH,
	// 		path: '/:id/clone',
	// 		requireParams: true,
	// 		response: {
	// 			200: instanceRouteConfig.responseSchema.clone
	// 		},
	// 		controllerMethod: instanceRouteConfig.controller.clone.bind(
	// 			instanceRouteConfig.controller,
	// 			instanceRouteConfig.responseSchema.clone
	// 		)
	// 	});
	// }

	/**
	 * POST: Export a resource by ID
	 * Example: POST /products/:id/export
	 */
	if (instanceRouteConfig.responseSchema.export) {
		registerRoute({
			...instanceRouteConfig,
			method: HttpMethod.GET,
			path: '/:id/export',
			requireParams: true,
			requireQueries: true,
			querySchema: ExportQueryParams,
			response: {
				201: instanceRouteConfig.responseSchema.export
			},
			controllerMethod: instanceRouteConfig.controller.export.bind(
				instanceRouteConfig.controller,
				ExportQueryParams,
				instanceRouteConfig.responseSchema.export
			)
		});
	}
};
