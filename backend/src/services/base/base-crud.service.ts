/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import { Transaction } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { Identifier, ScopeOptions, WhereAttributeHash } from 'sequelize/types/model';
import logger from '../../utils/logger';
import { NotFoundError } from '../../utils/errors';
import { getModelScope } from '../../utils/model.utils';
import FileExport from '../../models/entities/file-export.model';
import { StatusEnum } from '../../enums/status.enum';
import { FileType } from '../../enums/file-type.enum';
import { exportToPDF } from '../../utils/export/pdf.export.utils';
import { exportToCSV } from '../../utils/export/csv.export.utils';
import { exportToJSON } from '../../utils/export/json.export.utils';
import { exportToExcel } from '../../utils/export/excel.export.utils';
import { BaseReadonlyService } from './base-readonly.service';

/**
 * Generic Base CRUD Service.
 * Handles common database operations.
 */
export abstract class BaseCrudService<Entity extends Model, ID extends Identifier> extends BaseReadonlyService<
	Entity,
	ID
> {
	protected static serviceRegistry: Map<string, BaseCrudService<any, any>> = new Map();

	public constructor() {
		super();
		// call init after constructor
		setTimeout(() => this._init(), 0);
	}

	/**
	 * Creates a new entity.
	 */
	async create(data: Partial<Entity>, opParams: OpParams): Promise<Entity> {
		return (await this.transactional(opParams, async () => {
			this.logInfo({ message: 'Creating new entity', data });
			const { associationData, modelData } = await this.handleAssociations(data);
			const entity = await getModelScope(this.model, 'withAssociations').create(modelData, {
				transaction: opParams.transaction
			});
			await this.setAssociations(entity, associationData);
			return entity;
		})) as Entity;
	}

	/**
	 * Creates all new entity.
	 */
	async createAll(datas: Partial<Entity>[], opParams: OpParams): Promise<Entity[]> {
		return (await this.transactional(opParams, async () => {
			const results: Entity[] = [];
			for (const data of datas) {
				const entity = await this.create(data, opParams);
				results.push(entity);
			}

			return results;
		})) as Entity[];
	}

	/**
	 * Updates an entity by ID.
	 */
	async update(id: ID, data: Partial<Entity>, opParams: OpParams): Promise<Entity | null> {
		return (await this.transactional(opParams, async () => {
			this.logInfo({ message: `Updating entity with ID: ${id}`, data });
			const entity = await this.model.findByPk(id, { transaction: opParams.transaction });
			if (!entity) throw new NotFoundError('Entity not found');
			await entity.update(data, { transaction: opParams.transaction });
			return entity;
		})) as Entity;
	}

	/**
	 * Deletes an entity by ID.
	 */
	async delete(id: ID, opParams: OpParams): Promise<Entity> {
		return (await this.transactional(opParams, async () => {
			this.logInfo({ message: `Deleting entity with ID: ${id}` });
			// for delete dependencies, need to define scope 'fullDelete' on model
			const entity = await (
				opParams.includeDependencies ? getModelScope(this.model, 'fullDelete') : this.model
			).findByPk(id, { transaction: opParams.transaction });

			if (!entity) throw new NotFoundError('Entity not found');

			await entity.destroy({ transaction: opParams.transaction });
			return entity;
		})) as Entity;
	}

	/**
	 * Export an entity by ID.
	 */
	async export(id: ID, data: any, opParams: OpParams): Promise<FileExport> {
		return (await this.transactional(opParams, async (): Promise<FileExport> => {
			this.logInfo({ message: `Exporting entity with ID: ${id}` });
			const entity: Entity = await this.getById(id, opParams);

			if (!entity) throw new NotFoundError('Entity not found');

			// create export record
			const fileEntity = (await this.getModelService(FileExport)?.create(
				{
					entityId: entity.id,
					entityName: entity.constructor.name,
					fileType: data.format,
					entityVersion: entity.version,
					status: StatusEnum.DRAFT
				} as FileExport,
				opParams
			)) as FileExport;

			if (process.env.EXPORT_ASYNC === 'true') {
				this.newTransactional(opParams, async () => {
					return this._executeExportGeneration(fileEntity, entity, opParams);
				})
					.then((response): FileExport => {
						logger.debug('export generation done');
						return response as FileExport;
					})
					.catch(reason => {
						logger.error(reason.message);
						return {} as FileExport;
					});

				return fileEntity;
			} else {
				return await this._executeExportGeneration(fileEntity, entity, opParams);
			}
		})) as FileExport;
	}

	protected async generateExport(fileType: FileType, data: Entity): Promise<Buffer> {
		const jsonData = data.toJSON();

		const filePath = path.join(
			__dirname,
			(process.env.EXPORT_TEMPLATE_FOLDER_PATH ?? `../../assets/template/export/`) +
				`${this.model.name.toLowerCase()}`,
			`${this.model.name.toLowerCase()}.${fileType.toLowerCase()}.template-export.html`
		);

		switch (fileType) {
			case FileType.PDF:
				return await exportToPDF(jsonData, filePath);
			case FileType.CSV:
				return await exportToCSV(jsonData, filePath);
			case FileType.XLSX:
				return await exportToExcel(jsonData, filePath);
			default:
				return exportToJSON(jsonData);
		}
	}

	protected getModelService = (modelClass: any): BaseCrudService<Model, any> | undefined => {
		let modelName;
		switch (typeof modelClass) {
			case 'string':
				modelName = modelClass;
				break;
			case 'function':
				modelName = modelClass.name;
				break;
			default:
				modelName = modelClass.constructor.name;
		}
		return BaseCrudService.serviceRegistry.get(modelName);
	};

	/**
	 * return only associations with BelongsTo for creation
	 * @protected
	 */
	protected getIncludes() {
		return Object.entries(this.model.associations)
			.filter(([, association]) => association.associationType === 'BelongsTo')
			.map(([, association]) => association);
	}

	protected filterIncludes(items: Record<string, boolean>): any[] {
		return Object.entries(this.model.associations)
			.filter(([, association]) => items[association?.as])
			.map(([, association]) => association);
	}

	/**
	 *  Separate associations many-to-many from data
	 * @param data
	 * @protected
	 */
	protected async handleAssociations(data: any) {
		const manyToManyAssociations = Object.entries(this.model.associations).filter(
			([, association]) => association.associationType === 'BelongsToMany'
		);

		const { associationData, modelData } = this.separateAssociationData(data, manyToManyAssociations);
		return { associationData, modelData };
	}

	protected separateAssociationData(data: any, associations: any[]) {
		const modelData = { ...data };
		const associationData: Record<string, string[]> = {};

		associations.forEach(([key]) => {
			if (data[key]) {
				associationData[key] = data[key];
				delete modelData[key];
			}
		});

		return { associationData, modelData };
	}

	protected async setAssociations(entity: any, associationData: Record<string, string[]>) {
		for (const [key, ids] of Object.entries(associationData)) {
			const addMethod = `add${key.charAt(0).toUpperCase() + key.slice(1)}`;
			if (typeof entity[addMethod] === 'function') {
				await entity[addMethod](ids);
			}
		}
	}

	protected async newTransactional(opParams: OpParams, callback: () => Promise<{}>): Promise<{}> {
		opParams.transaction = undefined;
		return await this.transactional(opParams, callback);
	}

	protected async transactional(opParams: OpParams, callback: () => Promise<{}>): Promise<{}> {
		// step is a work-around to don't finished transaction by owner before all operations done
		if (!opParams.transaction) {
			opParams.steps = 1;
			opParams.transactionOwner = this.model;
			opParams.transaction = (await this.model.sequelize?.transaction()) as FinishableTransaction;
			opParams.transaction.finished = false;
		} else if (opParams.transactionOwner === this.model) {
			opParams.steps = (opParams?.steps || 0) + 1;
		}

		try {
			return await callback();
		} catch (error) {
			await this._rollback(opParams);
			throw error;
		} finally {
			await this._commit(opParams);
		}
	}

	private async _commit(opParams: OpParams): Promise<void> {
		if (!(opParams.transaction as any)?.finished && opParams.transactionOwner === this.model) {
			if (opParams.steps === 1) {
				await opParams.transaction?.commit();
				(opParams.transaction as any).finished = true;
			} else {
				opParams.steps = (opParams?.steps || 2) - 1;
			}
		}
	}

	private async _rollback(opParams: OpParams): Promise<void> {
		if (!(opParams.transaction as any)?.finished /*&& opParams.transactionOwner === this.model*/) {
			if (opParams.steps === 1) {
				await opParams.transaction?.rollback();
				(opParams.transaction as any).finished = true;
			} else {
				opParams.steps = (opParams?.steps || 2) - 1;
			}
		}
	}

	private _init(): void {
		const modelName = this.model.name;
		BaseCrudService.serviceRegistry.set(modelName, this);
	}

	private async _executeExportGeneration(
		fileEntity: FileExport,
		entity: Entity,
		opParams: OpParams
	): Promise<FileExport> {
		try {
			this.logInfo({ message: `Exporting entity with ID: ${entity.id}` });
			const fileBuffer = await this.generateExport(fileEntity.fileType, entity);

			// set buffer and status to completed
			return await fileEntity?.update(
				{
					fileBuffer,
					status: StatusEnum.COMPLETED
				},
				{ transaction: opParams.transaction }
			);
		} catch (error) {
			await fileEntity?.update(
				{
					error: (error || 'generic error, during export generation execution').toString(),
					status: StatusEnum.COMPLETED
				},
				{ transaction: opParams.transaction }
			);
			throw error;
		}
	}
}

export class OpParams {
	force?: boolean;
	includeDependencies?: boolean;
	transactionOwner?: any;
	steps?: number;
	transaction?: FinishableTransaction;
	scope?: string | ScopeOptions | readonly (string | ScopeOptions)[] | WhereAttributeHash;
	include?: string[];
}

interface FinishableTransaction extends Transaction {
	finished: boolean;
}
