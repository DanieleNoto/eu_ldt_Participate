import { Model } from 'sequelize-typescript';
import { Identifier } from 'sequelize/types/model';
import { BaseCrudController } from '../../controllers/base/base-crud.controller';
import { BaseController } from '../../controllers/base/base.controller';
import { HttpMethod } from '../../enums/http-methods.enum';
import { DeleteQueryParams, ResponseSchemas } from '../../schemas/base/base-crud.schema';
import { registerReadonlyRoutes } from './base-readonly.routes';
import { InstanceRouteConfig, registerRoute } from './base.routes';

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
};
