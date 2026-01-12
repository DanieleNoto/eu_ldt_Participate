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

		// Check if already authenticated by verifying a protected UI element (header)
		let isAuthenticated = false;
		try {
			// Try to navigate to admin and check header presence quickly
			await page.goto('/admin/');
			isAuthenticated = await integratedEnvironmentPage.verifyLDTAdminHeaderPresent();
		} catch (e) {
			// ignore navigation errors; treat as not authenticated
			isAuthenticated = false;
		}

		// If not authenticated, perform login via Keycloak helper (works both with and without project storageState)
		if (!isAuthenticated) {
			console.log('Not authenticated in this context — performing login via Keycloak helper');
			const authHelper = new DecidimKeycloakAuthHelper();
			const adminEmail = process.env.TEST_KEYCLOAK_ADMIN_EMAIL || TEST_USERS.ADMIN_USER.email;
			const adminPassword = process.env.TEST_KEYCLOAK_ADMIN_PASSWORD || TEST_USERS.ADMIN_USER.password;

			await authHelper.injectSessionIntoPage(page, adminEmail, adminPassword, true, '/admin');

			// Ensure we land on admin dashboard and header is visible
			await adminHomePage.goToAdminDashboard();
			// Use existing page object verification method (no debug_getHeaderLocator)
			expect(await integratedEnvironmentPage.verifyLDTAdminHeaderPresent()).toBe(true);
			console.log('Login completed and admin dashboard loaded');
		} else {
			// Already authenticated: ensure dashboard is loaded and header visible
			await adminHomePage.goToAdminDashboard();
			expect(await integratedEnvironmentPage.verifyLDTAdminHeaderPresent()).toBe(true);
			console.log('Context already authenticated; admin dashboard loaded');
		}
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

				expect([...matchVerification.uiTools].sort()).toEqual([...matchVerification.apiTools].sort());

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
		});
	});
});
