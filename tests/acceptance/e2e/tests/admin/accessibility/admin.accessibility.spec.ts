/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import test, { expect } from '@playwright/test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { tryAnalyze, saveAccessibilityResults } from '@utils/helpers';

/**
 * [PAR-USA02] - QA tests execution for W3C WCAG 2.0, 2.1, and 2.2 Level AA compliance
 * Accessibility tests for Admin Section
 * Minimum requirement: WCAG 2.1 Level AA (test fails only for 2.0/2.1 violations)
 * WCAG 2.2 violations are reported as warnings only
 * The tool must comply with accessibility guidelines for people with disabilities using WAI-ARIA
 */

test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
	await page.close();
	await context.close();
});

test.describe('[PAR-USA02] Accessibility - Admin Section', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;

	// Use existing process
	const processSlug = 'test';
	const meetingsComponentId = '6';
	const meetingId = '3';
	const surveysComponentId = '8';
	const surveyId = '15';

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
	});

	test('should comply with WCAG 2.1 AA accessibility standards across admin pages', async ({ page }) => {
		// Navigate to admin homepage
		await test.step('Admin homepage accessibility check', async () => {
			await adminHomePage.navigateToAdminHomePage();
			await page.waitForLoadState('networkidle');
			await expect(page).toHaveURL(/\/admin/);

			await tryAnalyze(adminHomePage.getPage(), 'AdminHomePage');
		});

		// Navigate to processes list page
		await test.step('Processes list page accessibility check', async () => {
			await adminHomePage.navigateViaAdminNav('processes');
			await processAdminPage.waitForLoadState('networkidle');

			const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
			expect(isOnProcessesPage).toBe(true);

			await tryAnalyze(processAdminPage.getPage(), 'processAdminPage');
		});

		// Navigate to edit process page
		await test.step('Edit Process page accessibility check', async () => {
			await page.goto(`/admin/participatory_processes/${processSlug}/edit`);
			await page.waitForLoadState('networkidle');

			const isOnEditPage = await processAdminPage.isOnProcessEditPage();
			expect(isOnEditPage).toBe(true);

			await tryAnalyze(processAdminPage.getPage(), 'processEditPage');
		});

		// Navigate to Decidim Awesome editors config page
		await test.step('Decidim Awesome editors config page accessibility check', async () => {
			await page.goto('/admin/decidim_awesome/config/editors');
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'decidimAwesomeEditorsConfig');
		});

		// Navigate to Decidim Awesome custom styles for admin panel
		await test.step('Decidim Awesome custom styles page accessibility check', async () => {
			await page.goto('/admin/decidim_awesome/config/scoped_admin_styles');
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'decidimAwesomeAdminStyles');
		});

		// Navigate to meetings management page
		await test.step('Meetings management page accessibility check', async () => {
			await page.goto(`/admin/participatory_processes/${processSlug}/components/${meetingsComponentId}/manage/`);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'meetingsManagementPage');
		});

		// Navigate to meeting edit page
		await test.step('Meeting edit page accessibility check', async () => {
			await page.goto(
				`/admin/participatory_processes/${processSlug}/components/${meetingsComponentId}/manage/meetings/${meetingId}/edit`
			);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'meetingEditPage');
		});

		// Navigate to surveys management page
		await test.step('Surveys management page accessibility check', async () => {
			await page.goto(`/admin/participatory_processes/${processSlug}/components/${surveysComponentId}/manage/`);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'surveysManagementPage');
		});

		// Navigate to survey edit page
		await test.step('Survey edit page accessibility check', async () => {
			await page.goto(
				`/admin/participatory_processes/${processSlug}/components/${surveysComponentId}/manage/surveys/${surveyId}/edit`
			);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'surveyEditPage');
		});
	});

	test.afterAll(async () => {
		// Writes summary.json and removes older scans, keeping only the latest per stepName
		await saveAccessibilityResults();
	});
});
