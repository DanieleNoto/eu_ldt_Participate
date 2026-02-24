/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

export const TEST_USERS = {
	NORMAL_USER: {
		email: process.env.TEST_USER_EMAIL || 'user@example.org',
		password: process.env.TEST_USER_PASSWORD || 'decidim123456789',
		role: 'user' as const,
		name: 'John Doe',
		username: 'john_doe_3',
		birth: '11/06/2025',
		gender: 'Male',
		country: 'Bangladesh',
		postalCode: '40133',
		phoneNumber: '233233233',
		location: 'Bologna'
	},
	USER_TO_DELETE: {
		email: process.env.TEST_USER_TO_DELETE_EMAIL || 'user2@example.org',
		password: process.env.TEST_USER_TO_DELETE_PASSWORD || 'decidim123456789',
		role: 'user' as const,
		name: 'John Doe',
		username: 'john_doe_4',
		birth: '11/06/2025',
		gender: 'Male',
		country: 'Bangladesh',
		postalCode: '40133',
		phoneNumber: '233233233',
		location: 'Bologna'
	},
	ADMIN_USER: {
		email: process.env.TEST_ADMIN_EMAIL || 'admin@example.org',
		password: process.env.TEST_ADMIN_PASSWORD || 'decidim123456789',
		role: 'admin' as const,
		firstName: 'Admin',
		lastName: 'User'
	},
	USER_WITHOUT_MESSAGES: {
		email: process.env.TEST_USER4_EMAIL || 'participatory_process_1_valuator@example.org',
		password: process.env.TEST_USER4_PASSWORD || 'decidim123456789'
	}
} as const;

export const ENVIRONMENTS = {
	LOCAL: {
		baseURL: 'http://localhost:3000',
		apiURL: 'http://localhost:3001/api'
	},
	STAGING: {
		baseURL: process.env.STAGING_URL || 'https://staging.example.com',
		apiURL: process.env.STAGING_API_URL || 'https://api-staging.example.com'
	},
	PRODUCTION: {
		baseURL: process.env.PROD_URL || 'https://production.example.com',
		apiURL: process.env.PROD_API_URL || 'https://api.example.com'
	}
} as const;
