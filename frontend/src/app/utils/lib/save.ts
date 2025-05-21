import { saveAs } from 'file-saver';

/**
 * Saves the provided file as a CSV.
 *
 * @param file - An object with a 'text' property containing CSV content.
 * @param fileName - Optional custom file name (without extension). Defaults to "report".
 */
export const saveCSV = (file: { text: string }, fileName?: string): void => {
	const name = fileName ?? 'report';
	saveAs(file.text, `${name}.csv`);
};

/**
 * Saves the provided file as a ZIP.
 *
 * @param file - An object with a 'text' property containing ZIP content.
 * @param fileName - Optional custom file name (without extension). Defaults to "report".
 */
export const saveZIP = (file: { text: string }, fileName?: string): void => {
	const name = fileName ?? 'report';
	saveAs(file.text, `${name}.zip`);
};

/**
 * Creates a CSV file from an array of objects and triggers its download.
 *
 * @param items - An array of objects to be converted into CSV format.
 * @param formatter - An optional object mapping keys to functions that format the corresponding value.
 * @param fileName - Optional custom file name (without extension). Defaults to "report".
 */
export const createCSV = (
	items: Array<Record<string, unknown>>,
	formatter?: Record<string, (value: unknown) => string>,
	fileName?: string
): void => {
	let csv = '';

	// Loop through each object in the array
	for (let row = 0; row < items.length; row++) {
		const keys = Object.keys(items[row]);
		const keysAmount = keys.length;
		let keysCounter = 0;

		// Generate headings for the first row
		if (row === 0) {
			// Use a for-in loop with a guard to ensure only own properties are iterated
			for (const key in items[row]) {
				if (Object.prototype.hasOwnProperty.call(items[row], key)) {
					// Append header with a semicolon separator, except after the last key
					csv += key + (keysCounter + 1 < keysAmount ? ';' : '\r\n');
					keysCounter++;
				}
			}
			keysCounter = 0;
		}

		// Process each object's values
		for (const key in items[row]) {
			if (Object.prototype.hasOwnProperty.call(items[row], key)) {
				if (formatter && formatter[key]) {
					csv += formatter[key](items[row][key]) + (keysCounter + 1 < keysAmount ? ';' : '\r\n');
				} else {
					csv += items[row][key] + (keysCounter + 1 < keysAmount ? ';' : '\r\n');
				}
				keysCounter++;
			}
		}
	}

	const name = fileName ?? 'report';
	const blob = new Blob([csv], { type: 'text/csv' });
	saveAs(blob, `${name}.csv`);
};
