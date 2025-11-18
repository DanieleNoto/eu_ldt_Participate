// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
// Test coverage for error classes
import { NotFoundError, ValidationError } from '../../../src/utils/errors';

describe('Error Classes', () => {
	describe('NotFoundError', () => {
		test('should create a NotFoundError instance with correct message and name', () => {
			const message = 'Resource not found';
			const error = new NotFoundError(message);

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(NotFoundError);
			expect(error.message).toBe(message);
			expect(error.name).toBe('NotFoundError');
		});

		test('should inherit from Error correctly', () => {
			const error = new NotFoundError('Test error');

			expect(error.stack).toBeDefined();
			expect(typeof error.toString).toBe('function');
		});
	});

	describe('ValidationError', () => {
		test('should create a ValidationError instance with correct message and name', () => {
			const message = 'Validation failed';
			const error = new ValidationError(message);

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(ValidationError);
			expect(error.message).toBe(message);
			expect(error.name).toBe('ValidationError');
		});

		test('should handle empty message', () => {
			const error = new ValidationError('');

			expect(error.message).toBe('');
			expect(error.name).toBe('ValidationError');
		});

		test('should handle special characters in message', () => {
			const message = 'Invalid input: "special chars" & symbols!';
			const error = new ValidationError(message);

			expect(error.message).toBe(message);
			expect(error.name).toBe('ValidationError');
		});
	});
});
