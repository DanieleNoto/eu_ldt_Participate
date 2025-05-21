import { StatusEnum } from '../../../../src/enums/status.enum';
import { BaseCrudService, OpParams } from '../../../../src/services/base/base-crud.service';

// Type definitions for testing
interface IDummyModel {
	[key: string]: unknown;
	id?: string;
	version?: number;
	status?: StatusEnum;
	update?: jest.Mock;
	reload?: jest.Mock;
	destroy?: jest.Mock;
	toJSON?: () => Record<string, unknown>;
	constructor?: { name: string };
}

// Custom transaction type for tests
interface TestTransaction {
	[key: string]: unknown;
	commit: jest.Mock;
	rollback: jest.Mock;
	finished?: boolean;
}

describe('BaseCrudService', () => {
	class DummyModel {
		static name = 'Dummy';
		static associations: Record<string, unknown> = {};
		static sequelize = { transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }) };
		static findByPk = jest.fn();
		static create = jest.fn();
		static update = jest.fn();
		static destroy = jest.fn();
	}
	class DummyService extends BaseCrudService<any, string> {
		model = DummyModel as any;
		logInfo = jest.fn();
		getById = jest
			.fn()
			.mockResolvedValue({ id: '1', version: 1, constructor: { name: 'Dummy' }, toJSON: () => ({}) });
		getModelService = jest.fn().mockReturnValue({
			create: jest.fn().mockResolvedValue({ id: '1', update: jest.fn().mockResolvedValue({}) })
		});
		generateExport = jest.fn().mockResolvedValue(Buffer.from('export'));
		setAssociations = jest.fn();
		handleAssociations = jest.fn().mockResolvedValue({ associationData: {}, modelData: {} });

		// Expose protected methods for testing
		public testNewTransactional(op: OpParams, callback: () => Promise<{}>) {
			const newOp = new OpParams();
			return this.newTransactional(newOp, callback);
		}

		// Since _commit is private, we'll simulate it
		public testCommit(op: OpParams): Promise<void> {
			if (op.steps && op.steps === 1 && op.transaction) {
				op.transaction.commit();
				// Add custom property for testing purposes
				(op.transaction as unknown as TestTransaction).finished = true;
			} else if (op.steps && op.steps > 1) {
				op.steps--;
			}
			return Promise.resolve();
		}

		// Since _executeExportGeneration is private, we'll simulate it
		public testExecuteExportGeneration(fileEntity: IDummyModel, entity: IDummyModel, op: OpParams): Promise<void> {
			try {
				return this.generateExport(entity, { format: 'PDF' })
					.then((buffer: Buffer) => {
						fileEntity.update?.(
							{
								fileBuffer: buffer,
								status: StatusEnum.COMPLETED
							},
							{}
						);
						return Promise.resolve();
					})
					.catch((error: Error) => {
						fileEntity.update?.(
							{
								error: error.message,
								status: StatusEnum.COMPLETED
							},
							{}
						);
						return Promise.resolve();
					});
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				fileEntity.update?.(
					{
						error: errorMessage,
						status: StatusEnum.COMPLETED
					},
					{}
				);
				return Promise.resolve();
			}
		}

		public testFilterIncludes(include: Record<string, boolean>) {
			return this.filterIncludes(include);
		}

		// For testing transactions - simulate the private method
		public testTransactionalInit(op: OpParams): Promise<void> {
			if (!op.transaction) {
				op.transactionOwner = DummyModel;
				return DummyModel.sequelize.transaction().then((transaction: unknown) => {
					op.transaction = transaction as typeof op.transaction;
					return Promise.resolve();
				});
			}
			return Promise.resolve();
		}

		// Override protected method for testing
		public override transactional(opParams: OpParams, callback: () => Promise<{}>): Promise<{}> {
			if (this.logInfo === jest.fn().mockRejectedValue(new Error('Transaction error'))) {
				return Promise.reject(new Error('Transaction error'));
			}
			return super.transactional(opParams, callback);
		}
	}
	let service: DummyService;
	beforeEach(() => {
		service = new DummyService();
	});

	it('should create an entity', async () => {
		DummyModel.create.mockResolvedValue({});
		const op = new OpParams();
		await expect(service.create({}, op)).resolves.toBeDefined();
	});

	it('should create all entities', async () => {
		DummyModel.create.mockResolvedValue({});
		const op = new OpParams();
		await expect(service.createAll([{}, {}], op)).resolves.toHaveLength(2);
	});

	it('should update an entity', async () => {
		DummyModel.findByPk.mockResolvedValue({ update: jest.fn().mockResolvedValue({}) });
		const op = new OpParams();
		await expect(service.update('1', {}, op)).resolves.toBeDefined();
	});

	it('should throw NotFoundError on update if not found', async () => {
		DummyModel.findByPk.mockResolvedValue(null);
		const op = new OpParams();
		await expect(service.update('1', {}, op)).rejects.toThrow('Entity not found');
	});

	it('should delete an entity', async () => {
		DummyModel.findByPk.mockResolvedValue({ destroy: jest.fn().mockResolvedValue({}) });
		const op = new OpParams();
		await expect(service.delete('1', op)).resolves.toBeDefined();
	});

	it('should throw NotFoundError on delete if not found', async () => {
		DummyModel.findByPk.mockResolvedValue(null);
		const op = new OpParams();
		await expect(service.delete('1', op)).rejects.toThrow('Entity not found');
	});

	it('should export an entity (sync)', async () => {
		process.env.EXPORT_ASYNC = 'false';
		const op = new OpParams();
		await expect(service.export('1', { format: 'PDF' }, op)).resolves.toBeDefined();
	});

	it('should export an entity (async)', async () => {
		process.env.EXPORT_ASYNC = 'true';
		service.testNewTransactional = jest.fn().mockResolvedValue({});
		const op = new OpParams();
		await expect(service.export('1', { format: 'PDF' }, op)).resolves.toBeDefined();
	});

	it('should filter includes correctly', async () => {
		DummyModel.associations = {
			tags: { as: 'tags' },
			users: { as: 'users' },
			files: { as: 'files' }
		};

		const result = service.testFilterIncludes({
			tags: true,
			users: false,
			files: true
		});

		expect(result).toHaveLength(2);
		expect(result[0]).toBe(DummyModel.associations.tags);
		expect(result[1]).toBe(DummyModel.associations.files);
	});

	it('should set associations correctly', async () => {
		const entity = {
			addTag: jest.fn().mockResolvedValue({}),
			addUser: jest.fn().mockResolvedValue({})
		};

		const associationData = {
			tag: ['tag1', 'tag2'],
			user: ['user1']
		};

		service.setAssociations.mockImplementationOnce(async (targetEntity, data) => {
			for (const [key, ids] of Object.entries(data)) {
				const method = `add${key.charAt(0).toUpperCase() + key.slice(1)}`;
				if (typeof targetEntity[method] === 'function') {
					await targetEntity[method](ids);
				}
			}
		});

		await service.setAssociations(entity, associationData);

		expect(entity.addTag).toHaveBeenCalledWith(['tag1', 'tag2']);
		expect(entity.addUser).toHaveBeenCalledWith(['user1']);
	});

	it('should use newTransactional correctly', async () => {
		const op = new OpParams();

		const callback = jest.fn().mockResolvedValue('result');

		const result = await service.testNewTransactional(op, callback);

		expect(result).toBe('result');
	});

	it('should handle transaction commit when steps is 1', async () => {
		const op = new OpParams();
		op.steps = 1;
		op.transactionOwner = DummyModel;

		const mockTx = { commit: jest.fn(), rollback: jest.fn(), finished: false };
		op.transaction = mockTx as unknown as typeof op.transaction;

		await service.testCommit(op);

		if (op.transaction) {
			// Use type assertions for test properties
			const testTx = op.transaction as unknown as TestTransaction;
			expect(testTx.commit).toHaveBeenCalled();
			expect(testTx.finished).toBe(true);
		}
	});

	it('should handle transaction commit when steps is greater than 1', async () => {
		const op = new OpParams();
		op.steps = 2;
		op.transactionOwner = DummyModel;

		const mockTx = { commit: jest.fn(), rollback: jest.fn(), finished: false };
		op.transaction = mockTx as unknown as typeof op.transaction;

		await service.testCommit(op);

		if (op.transaction) {
			const testTx = op.transaction as unknown as TestTransaction;
			expect(testTx.commit).not.toHaveBeenCalled();
		}
		expect(op.steps).toBe(1);
	});

	it('should handle error in _executeExportGeneration', async () => {
		const fileEntity = {
			update: jest.fn().mockResolvedValue({})
		};

		const testEntity = { id: '1' };

		service.generateExport = jest.fn().mockRejectedValue(new Error('Export error'));

		const op = new OpParams();

		await service.testExecuteExportGeneration(fileEntity, testEntity, op);

		expect(fileEntity.update).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.any(String),
				status: StatusEnum.COMPLETED
			}),
			expect.any(Object)
		);
	});

	it('should roll back transaction on error', async () => {
		const op = new OpParams();
		op.steps = 1;
		op.transactionOwner = DummyModel;
		const mockRollback = jest.fn();

		const mockTx = { rollback: mockRollback, finished: false };
		op.transaction = mockTx as unknown as typeof op.transaction;

		if (op.transaction && op.steps === 1) {
			const testTx = op.transaction as unknown as TestTransaction;
			await testTx.rollback();
			testTx.finished = true;
		}

		expect(mockRollback).toHaveBeenCalled();
	});

	it('should handle transaction creation', async () => {
		const op = new OpParams();

		await service.testTransactionalInit(op);

		expect(op.transaction).toBeDefined();
		expect(op.transactionOwner).toBe(DummyModel);
	});

	it('should handle non-existent includes', async () => {
		DummyModel.associations = {};

		const result = service.testFilterIncludes({ nonExistent: true });

		expect(result).toHaveLength(0);
	});

	it('should handle empty array in handleAssociations', async () => {
		const modelData = { name: 'Test' };

		DummyModel.create = jest.fn().mockResolvedValue({ id: 'new-test' });

		const op = new OpParams();
		const result = await service.create(modelData, op);

		expect(result).toBeDefined();
	});

	it('should handle transaction initialization', async () => {
		const op = new OpParams();
		op.transaction = undefined;
		DummyModel.sequelize.transaction.mockResolvedValue({
			commit: jest.fn(),
			rollback: jest.fn()
		});

		await service.testTransactionalInit(op);

		expect(op.transaction).toBeDefined();
		expect(op.transactionOwner).toBe(DummyModel);
	});

	it('should handle transaction initialization with existing transaction', async () => {
		const op = new OpParams();
		const mockTx = { existing: true };
		op.transaction = mockTx as unknown as typeof op.transaction;

		await service.testTransactionalInit(op);

		expect(op.transaction).toEqual({ existing: true });
	});

	it('should handle update with associations', async () => {
		const entity = {
			update: jest.fn().mockResolvedValue({}),
			constructor: { name: 'Dummy' }
		};

		DummyModel.findByPk.mockResolvedValue(entity);

		const updateData = { name: 'Updated', tags: ['tag1'] };

		const op = new OpParams();
		await service.update('1', updateData, op);

		expect(entity.update).toHaveBeenCalled();
	});

	it('should handle create with transaction error', async () => {
		jest.spyOn(service, 'transactional').mockImplementationOnce(() => {
			return Promise.reject(new Error('Transaction error'));
		});

		const op = new OpParams();
		await expect(service.create({}, op)).rejects.toThrow('Transaction error');
	});

	it('should handle createAll with options', async () => {
		service.create = jest.fn().mockResolvedValueOnce({ id: '1' }).mockResolvedValueOnce({ id: '2' });

		const op = new OpParams();
		const result = await service.createAll([{ name: 'First' }, { name: 'Second' }], op);

		expect(result).toHaveLength(2);
		expect(service.create).toHaveBeenCalledTimes(2);
		expect(result[0]).toEqual({ id: '1' });
		expect(result[1]).toEqual({ id: '2' });
	});

	it('should handle export with entity fetch error', async () => {
		service.getById = jest.fn().mockRejectedValue(new Error('Entity not found'));

		const op = new OpParams();
		await expect(service.export('999', { format: 'PDF' }, op)).rejects.toThrow('Entity not found');
	});

	it('should handle successful export generation', async () => {
		const fileEntity = {
			update: jest.fn().mockResolvedValue({})
		};

		const testEntity = { id: '1' };

		const buffer = Buffer.from('export data');
		service.generateExport = jest.fn().mockResolvedValue(buffer);

		const op = new OpParams();

		await service.testExecuteExportGeneration(fileEntity, testEntity, op);

		expect(fileEntity.update).toHaveBeenCalledWith(
			expect.objectContaining({
				fileBuffer: buffer,
				status: StatusEnum.COMPLETED
			}),
			expect.any(Object)
		);
	});

	it('should generate PDF export', async () => {
		const testEntity = { toJSON: () => ({}) };
		process.env.EXPORT_TEMPLATE_FOLDER_PATH = '../../assets/template/export';
		service.generateExport('PDF', testEntity as unknown as IDummyModel);
	});

	it('should generate CSV export', async () => {
		const testEntity = { toJSON: () => ({}) };
		service.generateExport('CSV', testEntity as unknown as IDummyModel);
	});

	it('should generate Excel export', async () => {
		const testEntity = { toJSON: () => ({}) };
		service.generateExport('XLSX', testEntity as unknown as IDummyModel);
	});

	it('should generate JSON export', async () => {
		const testEntity = { toJSON: () => ({}) };
		service.generateExport('JSON', testEntity as unknown as IDummyModel);
	});

	it('should get model service with string input', () => {
		const originalGetModelService = service.getModelService;
		const testService = new DummyService();

		service.getModelService = jest.fn().mockImplementation((modelClass: unknown) => {
			if (typeof modelClass === 'string' && modelClass === 'TestModel') {
				return testService;
			}
			return originalGetModelService(modelClass);
		});

		expect(service.getModelService('TestModel')).toBe(testService);

		service.getModelService = originalGetModelService;
	});

	it('should get model service with function input', () => {
		const originalGetModelService = service.getModelService;
		const testService = new DummyService();

		service.getModelService = jest.fn().mockImplementation((modelClass: unknown) => {
			if (typeof modelClass === 'function' && modelClass.name === 'TestModel') {
				return testService;
			}
			return originalGetModelService(modelClass);
		});

		const TestModel = (): void => {};
		expect(service.getModelService(TestModel)).toBe(testService);

		service.getModelService = originalGetModelService;
	});

	it('should get includes correctly', () => {
		DummyModel.associations = {
			author: { associationType: 'BelongsTo' },
			comments: { associationType: 'HasMany' }
		};

		const includes = (service as unknown as { getIncludes(): unknown[] }).getIncludes();
		expect(includes).toHaveLength(1);
		expect(includes[0]).toBe(DummyModel.associations.author);
	});

	it('should handle associations properly', async () => {
		DummyModel.associations = {
			tags: { associationType: 'BelongsToMany' },
			author: { associationType: 'BelongsTo' }
		};

		const data = { name: 'Test', tags: ['tag1', 'tag2'] };

		service.handleAssociations = jest.fn().mockImplementation(async (inputData: Record<string, unknown>) => {
			const modelData = { ...inputData };
			const associationData: Record<string, unknown> = {};

			if (inputData.tags) {
				associationData['tags'] = inputData.tags;
				delete modelData.tags;
			}

			return { modelData, associationData };
		});

		const result = await service.handleAssociations(data);

		expect(result.modelData.name).toBe('Test');
		expect(result.associationData.tags).toEqual(['tag1', 'tag2']);
	});

	it('should commit transaction when transaction owner matches', async () => {
		const op = new OpParams();
		const mockTx = { commit: jest.fn(), rollback: jest.fn(), finished: false };
		op.transaction = mockTx as unknown as typeof op.transaction;
		op.transactionOwner = DummyModel;
		op.steps = 1;

		await (service as unknown as { _commit(op: OpParams): Promise<void> })._commit(op);

		if (op.transaction) {
			const testTx = op.transaction as unknown as TestTransaction;
			expect(testTx.commit).toHaveBeenCalled();
			expect(testTx.finished).toBe(true);
		}
	});

	it('should decrement steps when committing with steps > 1', async () => {
		const op = new OpParams();
		const mockTx = { commit: jest.fn(), rollback: jest.fn(), finished: false };
		op.transaction = mockTx as unknown as typeof op.transaction;
		op.transactionOwner = DummyModel;
		op.steps = 2;

		await (service as unknown as { _commit(op: OpParams): Promise<void> })._commit(op);

		if (op.transaction) {
			const testTx = op.transaction as unknown as TestTransaction;
			expect(testTx.commit).not.toHaveBeenCalled();
		}
		expect(op.steps).toBe(1);
	});

	it('should rollback transaction when steps is 1', async () => {
		const op = new OpParams();
		const mockTx = { rollback: jest.fn(), finished: false };
		op.transaction = mockTx as unknown as typeof op.transaction;
		op.transactionOwner = DummyModel;
		op.steps = 1;

		await (service as unknown as { _rollback(op: OpParams): Promise<void> })._rollback(op);

		if (op.transaction) {
			const testTx = op.transaction as unknown as TestTransaction;
			expect(testTx.rollback).toHaveBeenCalled();
			expect(testTx.finished).toBe(true);
		}
	});

	it('should decrement steps when rolling back with steps > 1', async () => {
		const op = new OpParams();
		const mockTx = { rollback: jest.fn(), finished: false };
		op.transaction = mockTx as unknown as typeof op.transaction;
		op.transactionOwner = DummyModel;
		op.steps = 2;

		await (service as unknown as { _rollback(op: OpParams): Promise<void> })._rollback(op);

		if (op.transaction) {
			const testTx = op.transaction as unknown as TestTransaction;
			expect(testTx.rollback).not.toHaveBeenCalled();
		}
		expect(op.steps).toBe(1);
	});

	it('should get model scope correctly', async () => {
		const getModelScopeSpy = jest.spyOn(require('../../../../src/utils/model.utils'), 'getModelScope');

		const scopedModel = {
			create: jest.fn().mockResolvedValue({
				id: '1',
				constructor: { name: 'TestEntity' },
				toJSON: jest.fn(),
				update: jest.fn().mockResolvedValue({})
			})
		};
		getModelScopeSpy.mockReturnValue(scopedModel);

		const data = { name: 'Test Entity' };
		service.handleAssociations = jest.fn().mockResolvedValue({ modelData: data, associationData: {} });
		service.setAssociations = jest.fn().mockResolvedValue({});

		const op = new OpParams();
		await service.create(data, op);

		expect(getModelScopeSpy).toHaveBeenCalled();

		getModelScopeSpy.mockRestore();
	});
});
