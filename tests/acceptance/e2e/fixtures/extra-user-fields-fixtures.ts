/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 * Antonio Abramo Carotenuto
 */

import { UserFieldsData } from '../pages/pages/user/account/UserExtraFieldsPage';

// Test data generators for different scenarios
export class ExtraUserFieldsTestDataGenerator {
	static generateValidUserData(uniqueId: string = Date.now().toString()): UserFieldsData {
		return {
			dateOfBirth: '15/03/1990',
			gender: 'male',
			country: 'IT',
			postalCode: `001${uniqueId.slice(-2)}`,
			phoneNumber: `003932580239${uniqueId.slice(-2)}`,
			location: `Test City ${uniqueId}`
		};
	}

	static generateInvalidUserData(): Partial<UserFieldsData> {
		return {
			dateOfBirth: '32/13/1990', // Invalid date
			postalCode: '', // Empty required field
			phoneNumber: 'invalid-phone', // Invalid phone format
			location: '' // Empty required field
		};
	}

	static generateMinimalUserData(): UserFieldsData {
		return {
			dateOfBirth: '01/01/1990',
			gender: 'other',
			country: 'US',
			postalCode: '12345',
			phoneNumber: '1234567890',
			location: 'Test Location'
		};
	}

	static generateInvalidUserDataMaxLength(uniqueId: string = Date.now().toString()): Partial<UserFieldsData> {
		return {
			phoneNumber: `325802391${uniqueId.slice(-2)}` // 11 digits - exceeds max length
		};
	}
}
