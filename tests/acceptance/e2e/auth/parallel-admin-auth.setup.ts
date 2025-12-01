/**
 * SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test as setup } from '@playwright/test';
import { getAllUsers } from '@config/worker-users';
import { LoginPage } from '@pages/pages/auth/LoginPage';
import { HomePage } from '@pages/pages/public/HomePage';
import * as path from 'path';

/**
 * Parallel authentication setup for admin users.
 * This creates storage states for ALL admin users in the pool,
 * so each worker can use their assigned user.
 */

const adminUsers = getAllUsers('admin');

// Create a setup test for each admin user in the pool
for (let userIndex = 0; userIndex < adminUsers.length; userIndex++) {
	setup(`authenticate as admin user ${userIndex}`, async ({ browser }) => {
		const user = adminUsers[userIndex];
		const storagePath = path.resolve(__dirname, `admin-state-${userIndex}.json`);

		console.log(`[Setup] Authenticating admin user ${userIndex}`);

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

			// Verify admin access
			await page.waitForSelector('#trigger-dropdown-account');

			// Verify admin permissions
			const adminBar = page.locator('#admin-bar');
			if (await adminBar.isVisible()) {
				console.log(`[Setup] Admin ${userIndex} verified with admin permissions`);
			} else {
				console.warn(`[Setup] Admin ${userIndex} may not have admin permissions`);
			}

			// Save storage state for this user
			await context.storageState({ path: storagePath });
			console.log(`[Setup] Admin ${userIndex} state saved to: ${storagePath}`);
		} finally {
			await page.close();
			await context.close();
		}
	});
}
