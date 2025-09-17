import { test as setup } from '@playwright/test';
import { setupAuthForTest } from '@utils/auth-helper';

/**
 * Global setup for admin authentication.
 * This file is executed before tests to create authentication states.
 */

// Setup authentication for administrator
setup('authenticate as admin', async ({ browser }) => {
	await setupAuthForTest(browser, 'ADMIN');
});
