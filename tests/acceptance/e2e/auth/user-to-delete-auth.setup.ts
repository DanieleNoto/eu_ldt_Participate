import { test as setup } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';

/**
 * Global setup for user authentication.
 * This file is executed before tests to create authentication states.
 */

// Setup authentication for normal user
setup('authenticate as user to delete', async ({ page }) => {
	await ensureLoggedIn(page, 'ACCOUNT_DELETION_USER');
});
