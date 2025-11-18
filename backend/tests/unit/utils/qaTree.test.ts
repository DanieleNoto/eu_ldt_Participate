// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
// Test coverage for qaTree utility
import * as fs from 'fs';

// Mock fs to avoid file system dependencies - must be before import
jest.mock('fs', () => ({
	readFileSync: jest.fn(),
	existsSync: jest.fn().mockReturnValue(true)
}));

import { loadTree } from '../../../src/utils/qaTree';

describe('QA Tree Utils', () => {
	const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
	const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

	beforeEach(() => {
		jest.clearAllMocks();
		// Ensure existsSync returns true for path checks
		mockExistsSync.mockReturnValue(true);
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
