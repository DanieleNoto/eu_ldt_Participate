/* eslint-disable @typescript-eslint/no-explicit-any */
import { id, nop, transformObjectToArray, handleDownloadAnchor } from '@app/utils/functions';

describe('id', () => {
	it('should return a unique string starting with "id-"', () => {
		const result = id();
		expect(result).toMatch(/^id-[a-z0-9]{9}$/);
		const another = id();
		expect(result).not.toBe(another);
	});
});

describe('nop', () => {
	it('should do nothing and return undefined', () => {
		expect(nop()).toBeUndefined();
	});
});

describe('transformObjectToArray', () => {
	it('should transform object with non-empty values', () => {
		const input = { name: 'John', age: 30, address: '' };
		const output = transformObjectToArray(input);
		expect(output).toEqual([
			{ field: 'name', query: ['John'] },
			{ field: 'age', query: [30] }
		]);
	});

	it('should return empty array for all empty values', () => {
		expect(transformObjectToArray({ a: '', b: null, c: undefined })).toEqual([]);
	});

	it('should trim string values and ignore if empty after trim', () => {
		expect(transformObjectToArray({ foo: '   ', bar: 'baz' })).toEqual([{ field: 'bar', query: ['baz'] }]);
	});

	it('should handle numbers and booleans', () => {
		expect(transformObjectToArray({ a: 0, b: false, c: true, d: 42 })).toEqual([
			{ field: 'c', query: [true] },
			{ field: 'd', query: [42] }
		]);
	});
});

describe('handleDownloadAnchor', () => {
	const originalCreateObjectURL = window.URL.createObjectURL;
	const originalRevokeObjectURL = window.URL.revokeObjectURL;
	const originalCreateElement = document.createElement;

	beforeEach(() => {
		window.URL.createObjectURL = jest.fn(() => 'blob:url');
		window.URL.revokeObjectURL = jest.fn();
		document.createElement = jest.fn(() => {
			return {
				set href(val: string) {
					(this as any)._href = val;
				},
				get href() {
					return (this as any)._href;
				},
				set download(val: string) {
					(this as any)._download = val;
				},
				get download() {
					return (this as any)._download;
				},
				click: jest.fn()
			} as unknown as HTMLAnchorElement;
		}) as unknown as typeof document.createElement;
	});

	afterEach(() => {
		window.URL.createObjectURL = originalCreateObjectURL;
		window.URL.revokeObjectURL = originalRevokeObjectURL;
		document.createElement = originalCreateElement;
	});

	it('should create an anchor, set href and download, click it, and revoke URL', () => {
		const blob = new Blob(['test']);
		const blobWithHeaders = { blob, headers: {} } as any;
		handleDownloadAnchor(blobWithHeaders, '123', 'PDF' as any);

		expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
		const anchor = (document.createElement as jest.Mock).mock.results[0].value;
		expect(anchor.href).toBe('blob:url');
		expect(anchor.download).toBe('file-123.pdf');
		expect(anchor.click).toHaveBeenCalled();
		expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
	});
});
