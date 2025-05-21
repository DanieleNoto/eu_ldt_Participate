import { DataType } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { BaseReadonlyService } from '../../../../src/services/base/base-readonly.service';
import { OpParams } from '../../../../src/services/base/base-crud.service';

describe('BaseReadonlyService', () => {
	class DummyModel {
		static name = 'Dummy';
		static options: Record<string, unknown> = { scopes: {} };
		static findAndCountAll = jest.fn();
		static findByPk = jest.fn();
		static findOne = jest.fn();
		static getAttributes = jest.fn().mockReturnValue({
			name: { type: new DataType.STRING() },
			date: { type: new DataType.DATE() },
			count: { type: new DataType.INTEGER() }
		});
		static sequelize = { transaction: jest.fn() };
	}

	class DummyService extends BaseReadonlyService<any, string> {
		model = DummyModel as any;
		logInfo = jest.fn();
		logError = jest.fn();
	}

	let service: DummyService;

	beforeEach(() => {
		service = new DummyService();
		jest.clearAllMocks();
	});

	it('should get all entities', async () => {
		const mockResults = { count: 10, rows: [{}, {}] };
		DummyModel.findAndCountAll.mockResolvedValue(mockResults);

		const options = { page: 0, size: 10 };
		const op = new OpParams();
		const result = await service.getAll(options, op);

		expect(result).toEqual(
			expect.objectContaining({
				count: 10,
				rows: [{}, {}],
				metadata: expect.any(Object)
			})
		);
	});

	it('should handle error in getAll', async () => {
		DummyModel.findAndCountAll.mockRejectedValue(new Error('DB error'));

		const options = { page: 0, size: 10 };
		const op = new OpParams();

		await expect(service.getAll(options, op)).rejects.toThrow('DB error');
		expect(service.logError).toHaveBeenCalled();
	});

	it('should get entity by ID', async () => {
		const entity = { id: '1' };
		DummyModel.findByPk.mockResolvedValue(entity);

		const op = new OpParams();
		const result = await service.getById('1', op);

		expect(result).toEqual(entity);
	});

	it('should handle error in getById', async () => {
		DummyModel.findByPk.mockRejectedValue(new Error('ID error'));

		const op = new OpParams();
		await expect(service.getById('1', op)).rejects.toThrow('ID error');
		expect(service.logError).toHaveBeenCalled();
	});

	it('should get entity by props', async () => {
		const entity = { id: '1', name: 'Test' };
		DummyModel.findOne.mockResolvedValue(entity);

		const op = new OpParams();
		const result = await service.getByProps({ name: 'Test' }, op);

		expect(result).toEqual(entity);
	});

	it('should handle error in getByProps', async () => {
		DummyModel.findOne.mockRejectedValue(new Error('Props error'));

		const op = new OpParams();
		await expect(service.getByProps({ name: 'Test' }, op)).rejects.toThrow('Props error');
		expect(service.logError).toHaveBeenCalled();
	});

	it('should get model metadata', () => {
		DummyModel.options = { scopes: { default: { where: {} } } };
		const metadata = service.getModelMetadata();
		expect(metadata).toEqual({ scopes: expect.any(Object) });
	});

	describe('options transformation', () => {
		it('should handle sort options correctly', async () => {
			const mockResults = { count: 5, rows: [{}, {}] };
			DummyModel.findAndCountAll.mockImplementation(queryOptions => {
				expect(queryOptions.limit).toBe(20);
				expect(queryOptions.offset).toBe(20); // page 1 * size 20
				expect(queryOptions.order).toEqual([
					['name', 'ASC'],
					['date', 'DESC']
				]);
				return Promise.resolve(mockResults);
			});

			const options = {
				page: 1,
				size: 20,
				sort: [
					{ field: 'name', direction: 'asc' },
					{ field: 'date', direction: 'desc' }
				]
			};

			const op = new OpParams();
			await service.getAll(options, op);

			expect(DummyModel.findAndCountAll).toHaveBeenCalled();
		});

		it('should handle complex search queries', async () => {
			const mockResults = { count: 5, rows: [{}, {}] };
			DummyModel.findAndCountAll.mockImplementation(queryOptions => {
				expect(queryOptions.where).toBeDefined();
				expect(queryOptions.where.name[Op.iLike]).toBe('%test%');
				expect(queryOptions.where.count[Op.or][0][Op.ne]).toBe(5);
				expect(queryOptions.where.count[Op.or][1][Op.ne]).toBe(10);
				return Promise.resolve(mockResults);
			});

			const options = {
				search: [
					{ field: 'name', query: ['test'], not: false },
					{ field: 'date', query: [new Date()], not: false },
					{ field: 'count', query: [5, 10], not: true }
				]
			};

			const op = new OpParams();
			await service.getAll(options, op);

			expect(DummyModel.findAndCountAll).toHaveBeenCalled();
		});
	});

	describe('date ranges', () => {
		it('should handle date ranges correctly', async () => {
			const mockResults = { count: 5, rows: [{}, {}] };
			const testDate = new Date('2023-05-15T12:30:00');

			DummyModel.findAndCountAll.mockImplementation(queryOptions => {
				const dateRange = queryOptions.where.date[Op.between];

				expect(dateRange[0].getHours()).toBe(0);
				expect(dateRange[0].getMinutes()).toBe(0);
				expect(dateRange[0].getSeconds()).toBe(0);
				expect(dateRange[0].getMilliseconds()).toBe(0);

				expect(dateRange[1].getHours()).toBe(23);
				expect(dateRange[1].getMinutes()).toBe(59);
				expect(dateRange[1].getSeconds()).toBe(59);
				expect(dateRange[1].getMilliseconds()).toBe(999);

				expect(dateRange[0].toDateString()).toBe(dateRange[1].toDateString());

				return Promise.resolve(mockResults);
			});

			const options = {
				search: [{ field: 'date', query: [testDate], not: false }]
			};

			const op = new OpParams();
			await service.getAll(options, op);

			expect(DummyModel.findAndCountAll).toHaveBeenCalled();
		});
	});
});
