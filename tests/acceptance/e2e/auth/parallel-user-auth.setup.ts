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
 * Parallel authentication setup for regular users.
 * This creates storage states for ALL users in the pool,
 * so each worker can use their assigned user.
 */

const regularUsers = getAllUsers('user');

// Create a setup test for each user in the pool
for (let userIndex = 0; userIndex < regularUsers.length; userIndex++) {
	setup(`authenticate as regular user ${userIndex}`, async ({ browser }) => {
		const user = regularUsers[userIndex];
		const storagePath = path.resolve(__dirname, `user-state-${userIndex}.json`);

		console.log(`[Setup] Authenticating user ${userIndex}`);

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
			console.log(`[Setup] User ${userIndex} authenticated successfully`);

			// Save storage state for this user
			await context.storageState({ path: storagePath });
			console.log(`[Setup] User ${userIndex} state saved to: ${storagePath}`);
		} finally {
			await page.close();
			await context.close();
		}
	});
}
