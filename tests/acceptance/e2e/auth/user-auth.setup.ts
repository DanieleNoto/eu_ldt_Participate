import { test as setup } from '@playwright/test';
import { setupAuthForTest } from '@utils/auth-helper';

/**
 * Global setup for user authentication.
 * This file is executed before tests to create authentication states.
 */

// Setup authentication for normal user
setup('authenticate as user', async ({ browser }) => {
	await setupAuthForTest(browser, 'USER');
});
