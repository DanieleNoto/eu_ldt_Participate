/* eslint-disable @typescript-eslint/no-explicit-any */

import { BlobWithHeaders } from '@app/core/api-client/useApiRequest';
import { FileExportType } from '@app/shared/models/fileExportTypeEnum';

/**
 * Return a unique id for HTML element
 * @returns string
 */

export const id = () => {
	return 'id-' + Math.random().toString(36).substring(2, 11);
};

export const nop = (): void => {};

/**
 * Transforms an object into an array of objects with 'field' and 'query' properties.
 * Each entry in the input object that has a non-empty value is converted to an object
 * with the key as the 'field' property and the value wrapped in an array as the 'query' property.
 * Used for table filters passed by query params to api
 *
 * @param {Record<string, any>} input - The object to transform
 * @returns {any[]} An array of objects with 'field' and 'query' properties
 *
 * @example
 * // returns [{ field: 'name', query: ['John'] }, { field: 'age', query: [30] }]
 * transformObjectToArray({ name: 'John', age: 30, address: '' });
 */
export const transformObjectToArray = (input: Record<string, any>): any[] => {
	const result: any[] = [];
	Object.entries(input).forEach(([key, value]) => {
		if (value && value.toString().trim() !== '') {
			result.push({
				field: key,
				query: [value]
			});
		}
	});
	return result;
};

/**
 * Handles the download of a file by creating an anchor element, setting its href to a blob URL,
 * and triggering a click event on it. After the download, it revokes the blob URL.
 *
 * @param {BlobWithHeaders} blobWithHeaders - The blob object containing the file data and headers.
 * @param {string} newFileId - The ID of the file to be downloaded.
 * @param {FileExportType} exportType - The type of file being downloaded (e.g., CSV, PDF).
 */
export const handleDownloadAnchor = (
	blobWithHeaders: BlobWithHeaders,
	newFileId: string,
	exportType: FileExportType,
	prefixName: string = 'file'
) => {
	const url = window.URL.createObjectURL(blobWithHeaders.blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${prefixName}-${newFileId}.${exportType?.toLowerCase()}`;
	a.click();
	window.URL.revokeObjectURL(url);
	// closeModal('sectionExportModal');
};
