// Test coverage for qaTree utility
import * as fs from 'fs';
import { loadTree } from '../../../src/utils/qaTree';

// Mock fs to avoid file system dependencies
jest.mock('fs', () => ({
	readFileSync: jest.fn()
}));

describe('QA Tree Utils', () => {
	const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('should load and parse tree from file', () => {
		const mockTreeData = {
			root: {
				id: 'root',
				questionKey: 'welcome',
				answerKey: 'welcome_answer',
				children: [
					{ id: 'child1', labelKey: 'child1_label' },
					{ id: 'child2', labelKey: 'child2_label' }
				]
			},
			child1: {
				id: 'child1',
				questionKey: 'child1_question',
				answerKey: 'child1_answer',
				children: []
			}
		};

		mockReadFileSync.mockReturnValue(JSON.stringify(mockTreeData));

		const result = loadTree();

		expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('qaTree.json'), 'utf-8');
		expect(result).toEqual(mockTreeData);
	});

	test('should handle tree with different node structures', () => {
		const mockTreeData = {
			root: {
				id: 'root',
				questionKey: 'test',
				answerKey: 'test_answer',
				children: [{ id: 'child', labelKey: 'child_label' }],
				faqs: [{ id: '1', questionKey: 'faq1', answerKey: 'faq1_answer' }],
				additionalSuggestions: [{ id: '1', labelKey: 'suggestion_label' }],
				handlerId: 'testHandler'
			}
		};

		mockReadFileSync.mockReturnValue(JSON.stringify(mockTreeData));

		const result = loadTree();

		expect(result).toEqual(mockTreeData);
	});
});
