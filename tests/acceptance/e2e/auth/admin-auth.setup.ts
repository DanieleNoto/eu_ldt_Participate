/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Gianfranco Cedro
 * Simone Bianchelli
 */

import { test as setup } from '@playwright/test';
import { setupAuthForTest } from '@utils/auth-helper';
import { DecidimKeycloakAuthHelper } from '../utils/decidim-keycloak-auth';
import { STORAGE_STATE } from '../utils/constants';

/**
 * Global setup for admin authentication.
 * This file is executed before tests to create authentication states.
 */

setup('authenticate as admin', async ({ browser }) => {
	if (process.env.USE_KEYCLOAK === 'true') {
		const context = await browser.newContext();
		const page = await context.newPage();
		const adminEmail = process.env.TEST_KEYCLOAK_ADMIN_EMAIL;
		const adminPassword = process.env.TEST_KEYCLOAK_ADMIN_PASSWORD;
		const authHelper = new DecidimKeycloakAuthHelper();
		await authHelper.injectSessionIntoPage(page, adminEmail, adminPassword, true, '/account');
		await context.storageState({ path: STORAGE_STATE.KEYCLOAK_ADMIN });
		await page.close();
		await context.close();
	} else {
		await setupAuthForTest(browser, 'ADMIN');
	}
});
