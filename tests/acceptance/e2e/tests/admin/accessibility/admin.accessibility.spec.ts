/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test, expect } from '@fixtures/keycloak-test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { tryAnalyze, saveAccessibilityResults } from '@utils/helpers';

/**
 * [PAR-USA02] - QA tests execution for W3C WCAG 2.0, 2.1, and 2.2 Level AA compliance
 * Accessibility tests for Admin Section
 * Minimum requirement: WCAG 2.1 Level AA (test fails only for 2.0/2.1 violations)
 * WCAG 2.2 violations are reported as warnings only
 * The tool must comply with accessibility guidelines for people with disabilities using WAI-ARIA
 */

test.describe('@useKeycloak [PAR-USA02] Accessibility - Admin Section', () => {
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;

	// Use existing process
	const processSlug = 'test';
	const meetingsComponentId = '6';
	const meetingId = '3';
	const surveysComponentId = '8';
	const surveyId = '15';
	const debatesComponentId = '3';
	const debateId = '24';
	const playandvisualizeComponentId = '13';
	const usecasescenariosComponentId = '9';
	const questionnairetemplateId = '6';
	const newsletterId = '1';

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);

		await adminHomePage.goToAdminDashboard();
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

		// Navigate to debates management page
		await test.step('Debates management page accessibility check', async () => {
			await page.goto(`/admin/participatory_processes/${processSlug}/components/${debatesComponentId}/manage/`);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'debatesManagementPage');
		});

		// Navigate to debate edit page
		await test.step('Debate edit page accessibility check', async () => {
			await page.goto(
				`/admin/participatory_processes/${processSlug}/components/${debatesComponentId}/manage/debates/${debateId}/edit`
			);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'debateEditPage');
		});

		// Navigate to Play and visualize management page
		await test.step('Play and visualize management page accessibility check', async () => {
			await page.goto(
				`/admin/participatory_processes/${processSlug}/components/${playandvisualizeComponentId}/manage/`
			);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'playAndVisualizeManagementPage');
		});

		// Navigate to Play and visualize edit page
		await test.step('Play and visualize edit page accessibility check', async () => {
			await page.goto(
				`/admin/participatory_processes/${processSlug}/components/${playandvisualizeComponentId}/edit`
			);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'playAndVisualizeEditPage');
		});

		// Navigate to Create Map Visualization page
		await test.step('Create Map Visualization page accessibility check', async () => {
			await page.goto(
				`/admin/participatory_processes/${processSlug}/components/${playandvisualizeComponentId}/manage/map_visualizations/new`
			);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'createMapVisualizationPage');
		});

		// Navigate to Use Case Scenarios management page
		await test.step('Use Case Scenarios management page accessibility check', async () => {
			await page.goto(
				`/admin/participatory_processes/${processSlug}/components/${usecasescenariosComponentId}/manage/`
			);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'useCaseScenariosManagementPage');
		});

		// Navigate to Use Case Scenarios edit page
		await test.step('Use Case Scenarios edit page accessibility check', async () => {
			await page.goto(
				`/admin/participatory_processes/${processSlug}/components/${usecasescenariosComponentId}/edit`
			);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'useCaseScenariosEditPage');
		});

		// Navigate to Associate Experiment Results page
		await test.step('Associate Experiment Results page accessibility check', async () => {
			await page.goto(
				`/admin/participatory_processes/${processSlug}/components/${usecasescenariosComponentId}/manage/ldt_use_case_scenarios/new`
			);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'associateExperimentResultsPage');
		});

		// Navigate to Matomo Analytics page
		await test.step('Matomo Analytics page accessibility check', async () => {
			await page.goto('/admin/analytics/analytics');
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'matomoAnalyticsPage');
		});

		// Navigate to Questionnaire templates page
		await test.step('Questionnaire templates page accessibility check', async () => {
			await page.goto('/admin/templates/questionnaire_templates');
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'questionnaireTemplatesPage');
		});

		// Navigate to New questionnaire template page
		await test.step('New questionnaire template page accessibility check', async () => {
			await page.goto('/admin/templates/questionnaire_templates/new');
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'newQuestionnaireTemplatePage');
		});

		// Navigate to Edit questionnaire template page
		await test.step('Edit questionnaire template page accessibility check', async () => {
			await page.goto(`/admin/templates/questionnaire_templates/${questionnairetemplateId}/edit`);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'editQuestionnaireTemplatePage');
		});

		// Navigate to Newsletters page
		await test.step('Newsletters page accessibility check', async () => {
			await page.goto('/admin/newsletters');
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'newslettersPage');
		});

		// Navigate to Newsletter templates page
		await test.step('Newsletter templates page accessibility check', async () => {
			await page.goto('/admin/newsletter_templates');
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'newsletterTemplatesPage');
		});

		// Navigate to New newsletter page
		await test.step('New newsletter page accessibility check', async () => {
			await page.goto('/admin/newsletter_templates/basic_only_text/newsletters/new');
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'newNewsletterPage');
		});

		// Navigate to Select recipients to deliver page
		await test.step('Select recipients to deliver page accessibility check', async () => {
			await page.goto(`/admin/newsletters/${newsletterId}/select_recipients_to_deliver`);
			await page.waitForLoadState('networkidle');

			await tryAnalyze(page, 'selectRecipientsToDeliverPage');
		});
	});

	test.afterAll(async () => {
		// Writes summary-admin.json and removes older scans, keeping only the latest per stepName
		await saveAccessibilityResults('admin');
	});
});
