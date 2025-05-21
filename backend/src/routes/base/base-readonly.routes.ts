import { Model } from 'sequelize-typescript';
import { Identifier } from 'sequelize/types/model';
import { BaseReadonlyController } from '../../controllers/base/base-readonly.controller';
import { HttpMethod } from '../../enums/http-methods.enum';
import { BaseController } from '../../controllers/base/base.controller';
import {
	IncludeQueryParams,
	pageSearchAndFilterQueryParams,
	ResponseSchemas
} from '../../schemas/base/base-crud.schema';
import { InstanceRouteConfig, registerRoute } from './base.routes';

export interface InstanceReadonlyRouteConfig<C extends BaseController> extends InstanceRouteConfig<C> {
	responseSchema: ResponseSchemas;
}

/**
 *
 * 	app!: FastifyInstance;
 * 	resourceName!: string;
 * 	controller!: any;
 * 	paramsSchema?: z.AnyZodObject;
 * 	bodySchema?: z.AnyZodObject;
 * 	responseSchema?: z.AnyZodObject = SuccessMessageSchema;
 */
export const registerReadonlyRoutes = <
	Entity extends Model<Entity>,
	ID extends Identifier,
	C extends BaseReadonlyController<Entity, ID>
>(
	instanceRouteConfig: InstanceReadonlyRouteConfig<C>
) => {
	const modelMetadata = instanceRouteConfig.controller.getModelMetadata();

	/**
	 * GET: Retrieve all resources
	 * Example: GET /products
	 */
	if (instanceRouteConfig.responseSchema.fetchAll) {
		let description = (modelMetadata.scopes ?? {}).map(scope => scope.description).join('<br/>');

		if (description) {
			description = '<b>Additional search options:</b> <br/>' + description;
		}

		registerRoute({
			...instanceRouteConfig,
			method: HttpMethod.GET,
			requireQueries: true,
			querySchema: pageSearchAndFilterQueryParams,
			response: {
				200: instanceRouteConfig.responseSchema.fetchAll
			},
			controllerMethod: instanceRouteConfig.controller.getAll.bind(
				instanceRouteConfig.controller,
				pageSearchAndFilterQueryParams,
				instanceRouteConfig.responseSchema.fetchAll
			),
			description
		});
	}

	/**
	 * GET: Retrieve a single resource by ID
	 * Example: GET /products/:id
	 */
	if (instanceRouteConfig.responseSchema.fetch) {
		registerRoute({
			...instanceRouteConfig,
			method: HttpMethod.GET,
			path: '/:id',
			requireParams: true,
			requireQueries: true,
			querySchema: IncludeQueryParams,
			response: {
				200: instanceRouteConfig.responseSchema.fetch
			},
			controllerMethod: instanceRouteConfig.controller.getById.bind(
				instanceRouteConfig.controller,
				IncludeQueryParams,
				instanceRouteConfig.responseSchema.fetch
			)
		});
	}
};
