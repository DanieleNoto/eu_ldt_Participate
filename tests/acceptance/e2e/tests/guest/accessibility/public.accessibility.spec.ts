/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import test from '@playwright/test';
import { HomePage } from '@pages/pages/public/HomePage';
import { LoginPage } from '@pages/pages/auth/LoginPage';
import { SignUpPage } from '@pages/pages/public/SignUpPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ROUTES } from '@utils/routes';
import { tryAnalyze, saveAccessibilityResults } from '@utils/helpers';

/**
 * [PAR-USA02] - QA tests execution for W3C WCAG 2.0, 2.1, and 2.2 Level AA compliance
 * Accessibility tests for Public Section (Guest - not authenticated)
 * Minimum requirement: WCAG 2.1 Level AA (test fails only for 2.0/2.1 violations)
 * WCAG 2.2 violations are reported as warnings only
 * The tool must comply with accessibility guidelines for people with disabilities using WAI-ARIA
 */

test.describe('[PAR-USA02] Accessibility - Public Section (Guest)', () => {
	// No storageState - we want to test as a guest (not authenticated)
	let homePage: HomePage;
	let loginPage: LoginPage;
	let signUpPage: SignUpPage;
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;

	test.beforeEach(async ({ page, context }) => {
		// Clear any existing authentication
		await context.clearCookies();

		homePage = new HomePage(page);
		loginPage = new LoginPage(page);
		signUpPage = new SignUpPage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
	});

	test('should have a minimum of a WCAG 2.1 AA level on public homepage', async ({ page }) => {
		await test.step('Public homepage (guest) accessibility check', async () => {
			await homePage.navigateToHomePage();

			await page.waitForLoadState('load');

			await homePage.expectToBeOnHomePage();

			await tryAnalyze(homePage.getPage(), 'homePage_public');
		});

		await test.step('Login page accessibility check', async () => {
			await page.goto(ROUTES.loginPage.pattern);

			await page.waitForLoadState('load');

			await loginPage.expectToBeOnLoginPage();

			await tryAnalyze(loginPage.getPage(), 'loginPage_public');
		});

		await test.step('Registration page accessibility check', async () => {
			await page.goto(ROUTES.signupPage.pattern);

			await page.waitForLoadState('load');

			await signUpPage.expectToBeOnSignupPage();

			await tryAnalyze(page, 'signUpPage_public');
		});

		await test.step('Password reset page accessibility check', async () => {
			await page.goto(ROUTES.passwordNewPage.pattern);

			await page.waitForLoadState('load');

			await loginPage.expectToBeOnPasswordResetPage();

			await tryAnalyze(loginPage.getPage(), 'passwordResetPage_public');
		});

		await test.step('Processes overview page accessibility check', async () => {
			await processesOverviewPage.navigateToProcessesOverview();

			await page.waitForLoadState('load');

			await tryAnalyze(processesOverviewPage.getPage(), 'processesOverview_public');
		});

		await test.step('Process detail page accessibility check', async () => {
			await processDetailPage.navigateToProcess('test');

			await page.waitForLoadState('load');

			await tryAnalyze(processDetailPage.getPage(), 'processDetail_public');
		});
	});

	test.afterAll(async () => {
		// Writes summary-public.json and removes older scans, keeping only the latest per stepName
		await saveAccessibilityResults('public');
	});
});
