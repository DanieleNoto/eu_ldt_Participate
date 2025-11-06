// Test coverage for zod plugin
import { FastifyInstance } from 'fastify';
import zodPlugin from '../../../src/plugins/zod.plugin';
import { createSerializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

// Mock dependencies
jest.mock('fastify-type-provider-zod', () => ({
	createSerializerCompiler: jest.fn().mockReturnValue(jest.fn()),
	validatorCompiler: jest.fn()
}));

describe('Zod Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	const mockCreateSerializerCompiler = createSerializerCompiler as jest.MockedFunction<
		typeof createSerializerCompiler
	>;
	const mockValidatorCompiler = validatorCompiler as jest.MockedFunction<typeof validatorCompiler>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			setValidatorCompiler: jest.fn(),
			setSerializerCompiler: jest.fn()
		} as any;
	});

	test('should set validator compiler', async () => {
		await zodPlugin(mockFastify, {});

		expect(mockFastify.setValidatorCompiler).toHaveBeenCalledWith(mockValidatorCompiler);
	});

	test('should create custom serializer compiler with replacer', async () => {
		await zodPlugin(mockFastify, {});

		expect(mockCreateSerializerCompiler).toHaveBeenCalledWith({ replacer: expect.any(Function) });
	});

	test('should set custom serializer compiler', async () => {
		const mockCustomSerializer = jest.fn();
		mockCreateSerializerCompiler.mockReturnValue(mockCustomSerializer);

		await zodPlugin(mockFastify, {});

		expect(mockFastify.setSerializerCompiler).toHaveBeenCalledWith(mockCustomSerializer);
	});

	test('replacer function should return value unchanged', async () => {
		await zodPlugin(mockFastify, {});

		const replacerCall = mockCreateSerializerCompiler.mock.calls[0][0];
		if (!replacerCall?.replacer) {
			throw new Error('Replacer not found');
		}
		const replacer = replacerCall.replacer;

		// Test the replacer function
		const testValue = { test: 'data' };
		const result = replacer.call({}, 'testKey', testValue);

		expect(result).toBe(testValue);
	});

	test('replacer function should handle different value types', async () => {
		await zodPlugin(mockFastify, {});

		const replacerCall = mockCreateSerializerCompiler.mock.calls[0][0];
		if (!replacerCall?.replacer) {
			throw new Error('Replacer not found');
		}
		const replacer = replacerCall.replacer;

		// Test with string
		expect(replacer.call({}, 'key', 'string')).toBe('string');

		// Test with number
		expect(replacer.call({}, 'key', 123)).toBe(123);

		// Test with null
		expect(replacer.call({}, 'key', null)).toBe(null);

		// Test with undefined
		expect(replacer.call({}, 'key', undefined)).toBe(undefined);

		// Test with array
		const array = [1, 2, 3];
		expect(replacer.call({}, 'key', array)).toBe(array);
	});
});
