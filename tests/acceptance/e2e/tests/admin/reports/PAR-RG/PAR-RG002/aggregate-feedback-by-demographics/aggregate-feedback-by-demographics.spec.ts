/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 */

import { test } from '@playwright/test';
import { GrafanaAuthHelper } from '../../../../../../utils/grafana-auth-helper';
import { GrafanaDashboardPage } from '../../../../../../pages/pages/admin/reports/GrafanaDashboardPage';
import { setupGrafanaDataSource } from '@utils/grafana-setup-helper';
import { tryAnalyze, saveAccessibilityResults } from '@utils/helpers';

/**
 * User Story: As a System Administrator, I want to aggregate feedback by demographics so that I can understand different community segments.
 *
 * Requirements: PAR R18
 *
 * Prerequisites:
 * - The system administrator has an active account on the platform and is logged in.
 * - The platform has sufficient data on community engagement and communication activities
 */

/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 */

test.describe('[PAR-RG002] - Aggregate feedback by demographics', () => {
	let grafanaAuth: GrafanaAuthHelper;

	test.beforeEach(async ({ page }) => {
		grafanaAuth = new GrafanaAuthHelper();
		await grafanaAuth.injectSessionIntoPage(page);
		await setupGrafanaDataSource(page);
	});

	test.afterEach(async () => {
		await grafanaAuth.dispose();
	});

	test.afterAll(async () => {
		await saveAccessibilityResults();
	});

	test.describe('Main Flow', () => {
		test('Admin can view and interact with reports', async ({ page }) => {
			const dashboard = new GrafanaDashboardPage(page);

			await test.step('1. User: Navigate to the Participation Demographics report from the Grafana dashboard', async () => {
				await test.step('1.1 Verify user is on the Grafana dashboard page', async () => {
					await dashboard.verifyDashboardPageLoaded();
					await page.screenshot({
						path: 'test-results/screenshots/PAR-RG002/step-1.1-dashboard-loaded.png',
						fullPage: true
					});
					await tryAnalyze(page, 'grafanaDashboardLoaded');
				});

				await test.step('1.2 Open the "Decidim" section', async () => {
					await dashboard.openDecidimSection();
					await page.screenshot({
						path: 'test-results/screenshots/PAR-RG002/step-1.2-decidim-section.png',
						fullPage: true
					});
					await tryAnalyze(page, 'grafanaDecidimSectionOpened');
				});

				await test.step('1.3 Open the "Participation Demographics" report', async () => {
					await dashboard.openParticipationDemographicsReport();
					await page.screenshot({
						path: 'test-results/screenshots/PAR-RG002/step-1.3-participation-report.png',
						fullPage: true
					});
					await tryAnalyze(page, 'grafanaParticipationDemographicsReport');
				});
			});

			await test.step('2. System: Displays options to configure demographic aggregation parameters', async () => {
				await dashboard.verifyNavToolbarVisible();
				await page.screenshot({
					path: 'test-results/screenshots/PAR-RG002/step-2-dashboard-controls.png',
					fullPage: true
				});
			});

			await test.step('3. User: Configures the demographic and additional filters', async () => {
				// the time range filter is no longer
				// present in this dashboard and is therefore not currently testable.
				// await dashboard.configureTimePeriodFilter();
				// await page.screenshot({
				// 	path: 'test-results/screenshots/PAR-RG002/step-3-time-filter-applied.png',
				// 	fullPage: true
				// });
				// await tryAnalyze(page, 'grafanaDemographicsReportFiltered');
			});

			await test.step('4. System: Processes the parameters and generates a demographic-specific feedback report', async () => {
				await dashboard.verifyPanelHeaderVisible();
			});

			await test.step('5. User: Views the aggregated feedback report with visual representations', async () => {
				await dashboard.verifyPanelHeadingVisible();
			});

			await test.step('Result. Simulate the interaction with the time filter and verify the visual response of the report', async () => {
				await dashboard.verifyMonthlyRegistrationTrendPanel();
				await tryAnalyze(page, 'grafanaMonthlyRegistrationTrendPanel');
			});
		});
	});
});
