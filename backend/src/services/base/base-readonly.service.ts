/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModelAttributeColumnOptions, ModelStatic, Op } from 'sequelize';
import { AbstractDataType, AbstractDataTypeConstructor } from 'sequelize/types/data-types';
import { Identifier } from 'sequelize/types/model';
import { DataType, Model } from 'sequelize-typescript';
import { cloneDeep } from 'lodash';
import { findForScope, getModelScope } from '../../utils/model.utils';
import { Search, Sort } from '../../schemas/base/base.schema';
import { BaseService } from './base.service';
import { OpParams } from './base-crud.service';

/**
 * Generic Base CRUD Service.
 * Handles common database operations.
 */
export abstract class BaseReadonlyService<Entity extends Model, ID extends Identifier> extends BaseService {
	/**
	 * Abstract methods for data access that must be implemented.
	 */
	protected abstract model: ModelStatic<Entity>;

	/**
	 * Retrieves all entities.
	 */
	async getAll(options: {}, opParams: OpParams): Promise<Entity[]> {
		try {
			this.logInfo({ message: 'Fetching all entities' });
			const results = await getModelScope(this.model, opParams.scope).findAndCountAll(
				{
					...transformToSequelizeOptions(this.model, options)
				},
				{ transaction: opParams.transaction }
			);

			results['metadata'] = {
				...options,
				total: results.count
			};

			return results;
		} catch (error) {
			this.logError({ message: 'Error fetching entities', cause: error });
			throw error;
		}
	}

	/**
	 * Retrieves an entity by ID.
	 */
	async getById(id: ID, opParams: OpParams): Promise<Entity> {
		try {
			this.logInfo({ message: `Fetching entity by ID: ${id}` });

			return (await this.model.findByPk(id, {
				include: opParams.include,
				transaction: opParams.transaction
			})) as Entity;
		} catch (error) {
			this.logError({ message: `Error fetching entity with ID: ${id}`, cause: error });
			throw error;
		}
	}

	async getByIds(ids: string[], opParams: OpParams): Promise<Entity[]> {
		this.logInfo({ message: 'Fetching entities by ids' });
		const entities: Entity[] = await this.model.findAll({
			where: {
				id: {
					[Op.in]: ids
				}
			},
			transaction: opParams.transaction
		} as any);

		return entities;
	}

	/**
	 * Retrieves an entity by ID.
	 */
	async getByProps(props: any, opParams: OpParams): Promise<Entity> {
		try {
			this.logInfo({ message: `Fetching entity by properties: ${props}` });
			return await getModelScope(this.model, 'full').findOne({
				where: props,
				transaction: opParams.transaction
			});
		} catch (error) {
			this.logError({ message: `Error fetching entity with ID: ${props}`, cause: error });
			throw error;
		}
	}

	public getModelMetadata() {
		return {
			scopes: Object.entries(this.model.options.scopes ?? {})
				.map(([name, scope]: [string, any]) => {
					const modelScope = getModelScope(this.model, { method: [name, ''] });
					const description = modelScope?._scope?.description;

					if (description) {
						return {
							name,
							description
						};
					}
				})
				.filter(val => !!val)
		};
	}
}

const transformToSequelizeOptions = (model: any, options: any) => {
	const sequelizeOptions: any = {};

	sequelizeOptions.limit = options.size || 10;
	sequelizeOptions.offset = (options.page || 0) * sequelizeOptions.limit;

	if (options.sort?.length) {
		sequelizeOptions.order = options.sort.map((sortRule: Sort) => [
			sortRule.field,
			sortRule.direction.toUpperCase()
		]);
	}

	if (options.search?.length) {
		sequelizeOptions.where = {};
		options.search.forEach((searchRule: Search) => {
			const type = propertyType(model, searchRule.field);

			if (searchRule.query.length > 1) {
				sequelizeOptions.where[searchRule.field] = {
					[Op.or]: searchRule.query.map(value => defineOp(type, value, searchRule.not))
				};
			} else {
				sequelizeOptions.where[searchRule.field] = defineOp(type, searchRule.query[0], searchRule.not);
			}
		});
	}

	return sequelizeOptions;
};

const propertyType = (model: any, property: string): string | AbstractDataTypeConstructor | AbstractDataType => {
	const attributes = model.getAttributes() as Record<string, ModelAttributeColumnOptions>;
	const attribute = attributes[property];

	return attribute.type;
};

const defineOp = (type: any, value: any, not: boolean = false) => {
	if (type instanceof DataType.STRING) {
		return { [not ? Op.notILike : Op.iLike]: `%${value}%` };
	} else if (type instanceof DataType.DATE) {
		return { [not ? Op.notBetween : Op.between]: createDayRange(value) };
	} else {
		return { [not ? Op.ne : Op.eq]: value };
	}
};

const createDayRange = (date: Date): [Date, Date] => {
	// Create start date (same day at 00:00:00)
	const startDate = new Date(date);
	startDate.setHours(0, 0, 0, 0);

	// Create end date (same day at 23:59:59.999)
	const endDate = new Date(date);
	endDate.setHours(23, 59, 59, 999);

	return [startDate, endDate];
};
