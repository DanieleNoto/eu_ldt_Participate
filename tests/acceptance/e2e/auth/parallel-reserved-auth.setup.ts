/**
 * SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test as setup } from '@playwright/test';
import { LoginPage } from '@pages/pages/auth/LoginPage';
import { HomePage } from '@pages/pages/public/HomePage';
import * as path from 'path';

/**
 * Authentication setup for RESERVED/FIXED users.
 *
 * These users are NOT part of the parallel pool and are reserved
 * for specific tests that require a particular user account.
 *
 * Reserved users:
 * - TEST_ADMIN_EMAIL → admin-state-reserved.json
 * - TEST_USER_EMAIL → user-state-reserved.json
 */

const reservedUsers = [
	{
		email: process.env.TEST_ADMIN_EMAIL || '',
		password: process.env.TEST_ADMIN_PASSWORD || '',
		role: 'admin' as const,
		storageName: 'admin-state-reserved.json'
	},
	{
		email: process.env.TEST_USER_EMAIL || '',
		password: process.env.TEST_USER_PASSWORD || '',
		role: 'user' as const,
		storageName: 'user-state-reserved.json'
	}
];

for (const user of reservedUsers) {
	setup(`authenticate reserved ${user.role}`, async ({ browser }) => {
		const storagePath = path.resolve(__dirname, user.storageName);

		console.log(`[Setup] Authenticating reserved ${user.role}`);

		const context = await browser.newContext({
			baseURL: process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app'
		});
		const page = await context.newPage();

		try {
			const homePage = new HomePage(page);
			const loginPage = new LoginPage(page);

			// Navigate to login page
			await homePage.goToHomePage();
			await loginPage.navigateToLogin();

			// Perform login
			await loginPage.login(user.email, user.password);

			// Verify logged in
			await page.waitForSelector('#trigger-dropdown-account');

			if (user.role === 'admin') {
				const adminBar = page.locator('#admin-bar');
				if (await adminBar.isVisible()) {
					console.log(`[Setup] Reserved admin verified with admin permissions`);
				}
			}

			// Save storage state
			await context.storageState({ path: storagePath });
			console.log(`[Setup] Reserved ${user.role} state saved to: ${storagePath}`);
		} finally {
			await page.close();
			await context.close();
		}
	});
}
