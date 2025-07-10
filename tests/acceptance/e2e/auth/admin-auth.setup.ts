import { test as setup } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';

/**
 * Global setup for user authentication.
 * This file is executed before tests to create authentication states.
 */

// Setup authentication for administrator
setup('authenticate as admin', async ({ page }) => {
	await ensureLoggedIn(page, 'ADMIN');
});
