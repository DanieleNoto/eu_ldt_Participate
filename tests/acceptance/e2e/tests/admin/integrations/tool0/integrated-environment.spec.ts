/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 */

import { test, expect, BrowserContext, Page } from '@playwright/test';
import { AdminHomePage } from '../../../../pages/pages/admin/AdminHomePage';
import { IntegratedEnvironmentPage } from '../../../../pages/pages/admin/integrations/IntegratedEnvironmentPage';
import { TEST_USERS } from '@config/test-users';
import { DecidimKeycloakAuthHelper } from '../../../../utils/decidim-keycloak-auth';

/**
 * Verify Tool0 Integration components in the admin dashboard
 * This test suite verifies that the Tool0 integration is properly displayed in the admin interface
 * Prerequisites:
 * The City Administrator has an active account on the platform and is logged in.
 */

test.describe('@useKeycloak Tool0 Integrated Environment', () => {
	let context: BrowserContext;
	let page: Page;
	let adminHomePage: AdminHomePage;
	let integratedEnvironmentPage: IntegratedEnvironmentPage;

	test.beforeEach(async ({ browser }) => {
		// Create a new browser context and page
		context = await browser.newContext({ locale: 'en-US' });
		page = await context.newPage();

		// Initialize page objects
		adminHomePage = new AdminHomePage(page);
		integratedEnvironmentPage = new IntegratedEnvironmentPage(page);

		// Navigate to admin dashboard and ensure header visible
		await adminHomePage.goToAdminDashboard();
		console.log('Admin dashboard loaded');
	});

	test.afterEach(async () => {
		if (context) {
			await context.close().catch(e => console.log('Admin session disposal issue:', String(e)));
		}
	});

	test.describe('Main Flow', () => {
		test('should verify tool0 integration is present in admin dashboard - with logout and session verification', async ({
			browser
		}) => {
			await test.step('1. System: Displays the EU LDT Toolbox Participate header toolbar', async () => {
				// Verify all LDT Admin Header components are present
				const verifications = [
					{ name: 'LDT Admin Header', result: await integratedEnvironmentPage.verifyLDTAdminHeaderPresent() },
					{ name: 'LDT Logo', result: await integratedEnvironmentPage.verifyLDTLogoPresent() },
					{ name: 'Tools button', result: await integratedEnvironmentPage.verifyToolsButtonPresent() },
					{ name: 'Help button', result: await integratedEnvironmentPage.verifyHelpButtonPresent() },
					{ name: 'User button', result: await integratedEnvironmentPage.verifyUserButtonPresent() }
				];

				for (const verification of verifications) {
					expect(verification.result).toBe(true);
					console.log(`${verification.name} is present and visible`);
				}

				console.log('All toolbar components are present');
			});

			await test.step('2. System: Displays available tools in the Tools dropdown menu', async () => {
				// Click on Tools button to open dropdown
				await integratedEnvironmentPage.clickToolsButton();
				console.log('Clicked Tools button');

				// Get tool groups from API
				const toolGroups = await integratedEnvironmentPage.getToolGroupsFromAPI();
				console.log(`Found ${toolGroups.length} tool groups: ${toolGroups.join(', ')}`);

				// Verify tools match between API and UI
				console.log('Verifying tools match between API and UI');
				const matchVerification = await integratedEnvironmentPage.verifyToolsMatchAPIandUI();

				await expect([...matchVerification.uiTools].sort()).toEqual([...matchVerification.apiTools].sort());

				// Verify all tools are visible in UI
				console.log('Verifying all tools are visible in UI');
				const visibilityCheck = await integratedEnvironmentPage.verifyAllToolsVisible();
				expect(visibilityCheck.allVisible).toBe(true);

				// Verify all tools open in new tab
				console.log('Verifying tools open in new tab');
				const newTabVerification = await integratedEnvironmentPage.verifyToolsOpenInNewTab();
				expect(newTabVerification.allOpenInNewTab).toBe(true);

				// Verify tool accessibility via HTTP
				console.log('Verifying tool accessibility');
				const toolsVerification = await integratedEnvironmentPage.verifyToolsAccessible();
				expect(toolsVerification.accessible).toBe(true);
				expect(toolsVerification.loaded).toBe(true);

				console.log('Result: All tools are accessible, functional and match API data');
			});

			await test.step('3. User: Verifies logout successful', async () => {
				// Click on User button and logout
				await integratedEnvironmentPage.logout();
				console.log('Logout action completed');

				// Verify redirect to Decidim auth page via URL and visible Participate link
				await page.waitForURL(/ldttoolbox\.app\/?$/);
				await page.getByRole('link', { name: 'Participate', exact: true }).waitFor({ state: 'visible' });

				console.log('User successfully logged out - redirected to Decidim auth page');
			});

			await test.step('4. Verify session is expired on new browser instance', async () => {
				console.log('Creating new browser context to verify session expiration...');

				const newContext = await browser.newContext({ locale: 'en-US' });
				const newPage = await newContext.newPage();
				const newIntEnvPage = new IntegratedEnvironmentPage(newPage);

				try {
					console.log('Attempting to access admin dashboard without session...');
					await newPage.goto('/admin/', { waitUntil: 'domcontentloaded' });
					const currentUrl = newPage.url();
					console.log(`Current URL after accessing admin: ${currentUrl}`);

					const isOnLoginPage =
						currentUrl.includes('/sign_in') ||
						currentUrl.includes('/login') ||
						currentUrl.includes('/auth') ||
						currentUrl.includes('/realms');

					expect(isOnLoginPage).toBe(true);
					console.log('✓ Session expired - User redirected to login page');

					console.log('Performing admin login on new browser instance using Keycloak auth helper...');
					const authHelper = new DecidimKeycloakAuthHelper();
					const adminEmail = process.env.TEST_KEYCLOAK_ADMIN_EMAIL || TEST_USERS.ADMIN_USER.email;
					const adminPassword = process.env.TEST_KEYCLOAK_ADMIN_PASSWORD || TEST_USERS.ADMIN_USER.password;

					await authHelper.injectSessionIntoPage(newPage, adminEmail, adminPassword, true, '/admin');
					console.log('✓ Admin login completed successfully');

					await newPage.goto('/admin/', { waitUntil: 'domcontentloaded' });
					// Step 1 verification on new browser
					expect(await newIntEnvPage.verifyLDTAdminHeaderPresent()).toBe(true);
					console.log('✓ Step 1: LDT Admin Header present on new browser instance');

					// Step 2 verification on new browser
					await newIntEnvPage.clickToolsButton();
					const toolsMatch = await newIntEnvPage.verifyToolsMatchAPIandUI();
					expect(toolsMatch.uiTools.length).toBeGreaterThan(0);
					console.log('✓ Step 2: Tools dropdown working correctly on new browser instance');

					console.log('✓ All steps verified successfully on new browser after re-login');
				} finally {
					await newContext.close();
					console.log('New browser context closed');
				}
			});
		});
	});
});
