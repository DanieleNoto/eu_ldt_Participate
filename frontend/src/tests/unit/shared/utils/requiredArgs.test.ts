/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import requiredArgs from '@app/utils/lib/requiredArgs';

// Helper function to generate an IArguments object
function getArguments(..._args: any[]): IArguments {
	return arguments;
}

describe('requiredArgs', () => {
	test('should throw error if required arguments are not provided', () => {
		const args = getArguments(1); // IArguments with 1 element
		expect(() => {
			requiredArgs(2, args);
		}).toThrow(TypeError);
	});

	test('should not throw if enough arguments are provided', () => {
		const args = getArguments(1, 2); // IArguments with 2 elements
		expect(() => {
			requiredArgs(2, args);
		}).not.toThrow();
	});
});
