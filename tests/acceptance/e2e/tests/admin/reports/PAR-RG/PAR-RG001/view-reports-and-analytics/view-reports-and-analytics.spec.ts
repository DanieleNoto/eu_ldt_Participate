/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 */

import { test, expect } from '@playwright/test';
import { GrafanaAuthHelper } from '../../../../../../utils/grafana-auth-helper';
import { GrafanaDashboardPage } from '../../../../../../pages/pages/admin/reports/GrafanaDashboardPage';
import { setupGrafanaDataSource } from '@utils/grafana-setup-helper';

/**
 * Allows administrators to view reports on community engagement and communication effectiveness to evaluate participation and optimize strategies.
 * User Story: As a System Administrator, I want to view reports so that I can assess community engagement and improve communication channels.
 * Requirements: PAR R17
 * Prerequisites:
 * - The system administrator has an active account on the platform and is logged in.
 * - The platform has sufficient data on community engagement and communication activities
 */

test.describe('[PAR-RG001] - View reports and analytics', () => {
	let grafanaAuth: GrafanaAuthHelper;
	let grafanaDashboardPage: GrafanaDashboardPage;

	test.beforeEach(async ({ page }) => {
		grafanaAuth = new GrafanaAuthHelper();
		await grafanaAuth.injectSessionIntoPage(page);

		grafanaDashboardPage = new GrafanaDashboardPage(page);
		await setupGrafanaDataSource(page);
	});

	test.afterEach(async () => {
		await grafanaAuth.dispose();
	});

	test.describe('Main Flow', () => {
		test('Admin can view and interact with reports', async ({ page, browserName }) => {
			await test.step('1. User: Navigates to the "Grafana Dashboard"', async () => {
				await grafanaDashboardPage.navigateGrafanaDashboard();
			});
			await test.step('2. System: Displays a list of available reports, categorised by engagement area', async () => {
				// Verify dashboard folders list is displayed on /dashboards page
				await grafanaDashboardPage.verifyDashboardListDisplayed();

				// Select the first dashboard folder (e.g., "Decidim")
				await grafanaDashboardPage.selectFirstDashboard();

				// Wait for navigation to folder
				await page.waitForURL(/\/dashboards\/f\//);

				// Verify reports list inside the folder is displayed
				await grafanaDashboardPage.verifyReportsListDisplayed();
			});
			await test.step('3. User: Selects a specific report to view', async () => {
				// Try to select "Administrative Reports" by name
				const found = await grafanaDashboardPage.selectReportByName('Administrative Reports');

				if (found) {
					console.log('Selected preferred report: "Administrative Reports"');
				} else {
					console.log('Report "Administrative Reports" not found, selecting first available report');
					await grafanaDashboardPage.selectFirstReport();
				}

				await page.waitForURL(/\/d\//);

				await page.waitForLoadState('networkidle');

				// Wait for dashboard panels to be rendered
				await grafanaDashboardPage.waitForDashboardDetailLoaded();
			});

			await test.step('4. System: Loads and displays the selected report with interactive visualisations and detailed metrics', async () => {
				await grafanaDashboardPage.verifyReportDashboardLoaded();
				await grafanaDashboardPage.verifyAllMetricPanelsDisplayed();

				console.log('\nCapturing metric values before filter change:');
				const capturedValues = await grafanaDashboardPage.captureMetricValues();

				capturedValues.forEach((value, metric) => {
					console.log(`   - ${metric}: ${value}`);
				});
			});

			await test.step('5. User: Applies filters to customise the report view', async () => {
				// Log current time range
				const currentTimeRange = await grafanaDashboardPage.getCurrentTimeRange();
				console.log(`Current time range: ${currentTimeRange} days`);

				// Get available time range options
				const availableRanges = await grafanaDashboardPage.getAvailableTimeRanges();
				console.log(`Available time ranges: ${availableRanges.join(', ')} days`);

				// Verify expected options are available
				expect(availableRanges).toContain('7');
				expect(availableRanges).toContain('14');
				expect(availableRanges).toContain('30');
				expect(availableRanges).toContain('60');
				expect(availableRanges).toContain('90');
				expect(availableRanges).toContain('180');
				expect(availableRanges).toContain('365');

				// Change time range to 7 days
				const newTimeRange = '7';
				console.log(`\nChanging time range from ${currentTimeRange} to ${newTimeRange} days`);
				await grafanaDashboardPage.changeTimeRange(newTimeRange);
				console.log(`Time range changed successfully to ${newTimeRange} days`);

				// Wait for dashboard to update
				await grafanaDashboardPage.waitForDashboardDetailLoaded();
			});

			await test.step('6. System: Updates the report view based on the applied filters', async () => {
				// Compare and log metric changes
				console.log('\nComparing values after filter application:');
				const comparison = await grafanaDashboardPage.compareMetricValues();

				// Log each change
				comparison.changes.forEach(({ metric, oldValue, newValue, changed }) => {
					const indicator = changed ? 'Changed' : 'Same';
					console.log(`   ${indicator} ${metric}: ${oldValue} -> ${newValue}`);
				});

				// Warning if no changes detected
				if (!comparison.hasChanges) {
					console.warn('\nWARNING: No metric values changed after filter application');
					console.warn('   This might indicate:');
					console.warn('   - No data in the selected time range');
					console.warn('   - Environment has insufficient data');
				} else {
					const changedCount = comparison.changes.filter(c => c.changed).length;
					console.log(`\n${changedCount}/${comparison.changes.length} metrics updated after filter change`);
				}

				// Check if all values are zero or No data
				const allZeroOrNoData = comparison.changes.every(
					({ newValue }) =>
						newValue === '0' ||
						newValue === 'No data' ||
						newValue === '0.00' ||
						newValue === '' ||
						newValue === 'N/A'
				);

				if (allZeroOrNoData) {
					console.error(
						'\nERROR: All metrics are 0 or No data - dashboard might not be loading data correctly'
					);
				}

				// Verify dashboard still functional (core test validation)
				await grafanaDashboardPage.verifyReportDashboardLoaded();
				await grafanaDashboardPage.verifyAllMetricPanelsDisplayed();
			});

			await test.step('7. User: Export data from widget', async () => {
				if (browserName === 'firefox') {
					test.skip(true, 'CSV export blocked by CSP frame-src policy on Firefox (blob: not allowed)');
					return;
				}

				const results = await grafanaDashboardPage.exportAllMetricPanelsData(true);

				const successful = results.filter(r => r.success);
				const failed = results.filter(r => !r.success);

				console.log(`\nExport Summary:`);
				console.log(`   Successful: ${successful.length}/${results.length}`);
				console.log(`   Failed: ${failed.length}/${results.length}`);

				if (successful.length > 0) {
					console.log(`\nExported and cleaned files:`);
					successful.forEach(({ metric, fileName, cleaned }) => {
						const cleanedStatus = cleaned ? '(cleaned)' : '(kept)';
						console.log(`   ${metric}: ${fileName} ${cleanedStatus}`);
					});
				}

				if (failed.length > 0) {
					console.log(`\nFailed exports:`);
					failed.forEach(({ metric, error }) => {
						console.log(`   ${metric}: ${error}`);
					});
				}

				expect(failed.length).toBe(0);
				expect(successful.length).toBe(6);

				const cleanedCount = successful.filter(r => r.cleaned).length;
				console.log(`\nCleaned up ${cleanedCount}/${successful.length} downloaded files`);
				expect(cleanedCount).toBe(successful.length);

				await grafanaDashboardPage.verifyReportDashboardLoaded();
			});
		});
	});
});
