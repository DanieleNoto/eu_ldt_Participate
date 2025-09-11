import { test as setup } from '@playwright/test';
import { setupAuthForTest } from '@utils/auth-helper';

/**
 * Global setup for user authentication.
 * This file is executed before tests to create authentication states.
 */

// Setup authentication for user to delete account
setup('authenticate as user to delete', async ({ browser }) => {
	await setupAuthForTest(browser, 'ACCOUNT_DELETION_USER');
});
