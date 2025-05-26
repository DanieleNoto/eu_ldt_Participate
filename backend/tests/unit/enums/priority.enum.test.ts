import { PriorityEnum } from '../../../src/enums/priority.enum';

describe('PriorityEnum', () => {
	it('should have the correct string values', () => {
		expect(PriorityEnum.LOW).toBe('LOW');
		expect(PriorityEnum.MEDIUM).toBe('MEDIUM');
		expect(PriorityEnum.HIGH).toBe('HIGH');
	});

	it('should include exactly these three values', () => {
		const values = Object.values(PriorityEnum);
		expect(values).toEqual(['LOW', 'MEDIUM', 'HIGH']);
		expect(values).toHaveLength(3);
	});
});
