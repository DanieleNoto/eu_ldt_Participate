/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 * Gianfranco Cedro
 */

import { test as setup } from '@playwright/test';
import { setupAuthForTest } from '@utils/auth-helper';
import { DecidimKeycloakAuthHelper } from '../utils/decidim-keycloak-auth';
import { STORAGE_STATE } from '../utils/constants';

/**
 * Global setup for user authentication.
 * This file is executed before tests to create authentication states.
 */

setup('authenticate as user', async ({ browser }) => {
	if (process.env.USE_KEYCLOAK === 'true') {
		const context = await browser.newContext();
		const page = await context.newPage();
		const userEmail = process.env.TEST_KEYCLOAK_USER_EMAIL;
		const userPassword = process.env.TEST_KEYCLOAK_USER_PASSWORD;
		const authHelper = new DecidimKeycloakAuthHelper();
		await authHelper.injectSessionIntoPage(page, userEmail, userPassword, true, '/account');
		await context.storageState({ path: STORAGE_STATE.KEYCLOAK_USER });
		await page.close();
		await context.close();
	} else {
		await setupAuthForTest(browser, 'USER');
	}
});
