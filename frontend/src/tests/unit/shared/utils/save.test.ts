import { createCSV, saveCSV, saveZIP } from '@app/utils/lib/save';
import * as FileSaver from 'file-saver';

jest.mock('file-saver', () => ({
	saveAs: jest.fn()
}));

const mockedSaveAs = FileSaver.saveAs as unknown as jest.Mock;

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions, @typescript-eslint/no-explicit-any
function readBlobAsText(blob: any) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsText(blob);
	});
}

describe('save.ts', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('saveCSV should call saveAs with correct parameters', () => {
		const file = { text: 'csv,data' };
		saveCSV(file, 'testFile');
		expect(mockedSaveAs).toHaveBeenCalledWith(file.text, 'testFile.csv');
	});

	test('saveZIP should call saveAs with correct parameters', () => {
		const file = { text: 'zip,data' };
		saveZIP(file, 'archive');
		expect(mockedSaveAs).toHaveBeenCalledWith(file.text, 'archive.zip');
	});

	test('createCSV should generate CSV content and call saveAs', async () => {
		const items = [
			{ col1: 'value1', col2: 'value2' },
			{ col1: 'value3', col2: 'value4' }
		];
		createCSV(items, undefined, 'data');

		// Retrieve the Blob passed to saveAs and test its content
		const blob = mockedSaveAs.mock.calls[0][0] as Blob;
		const text = await readBlobAsText(blob);
		expect(text).toContain('col1;col2');
		expect(text).toContain('value1;value2');
		expect(text).toContain('value3;value4');
	});
});
