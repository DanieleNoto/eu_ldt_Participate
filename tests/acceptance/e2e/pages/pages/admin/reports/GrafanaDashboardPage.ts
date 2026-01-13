/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 */

import { Page, expect, Locator } from '@playwright/test';
import { GRAFANA_URLS } from '../../../../utils/constants';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const EXECUTIVE_SUMMARY_METRICS = [
	'Total Registered Users',
	'Active Users Rate',
	'Active Processes',
	'Total Activities',
	'Active Contributors',
	'Newsletters Sent'
] as const;

export class GrafanaDashboardPage {
	constructor(private page: Page) {}

	/**
	 * Dashboard/Report rows in the list
	 */
	get dashboardRows(): Locator {
		return this.page.locator('[data-testid*="browse dashboards row"]');
	}

	/**
	 * Links inside dashboard/report rows
	 */
	get dashboardLinks(): Locator {
		return this.dashboardRows.locator('a');
	}

	/**
	 * Executive Summary row in the dashboard
	 */
	get executiveSummaryRow(): Locator {
		return this.page.locator('[data-testid="data-testid dashboard-row-title-Executive Summary"]');
	}

	/**
	 * Time range dropdown button
	 */
	get timeRangeDropdown(): Locator {
		return this.page.locator(
			'div[data-testid*="Dashboard template variables Variable Value DropDown value link text"]'
		);
	}

	/**
	 * Variable options in dropdown
	 */
	get variableOptions(): Locator {
		return this.page.locator('[data-testid="data-testid Select option"]');
	}

	/**
	 * Dashboard panels (any panel with data-viz-panel-key)
	 */
	get dashboardPanels(): Locator {
		return this.page.locator('[data-viz-panel-key]');
	}

	/**
	 * Get a specific metric panel by name
	 * @param panelName - Name of the panel/metric
	 */
	getPanel(panelName: string): Locator {
		return this.page.locator(`[data-testid="data-testid Panel header ${panelName}"]`);
	}

	/**
	 * Get panel menu button (3 dots) for a specific panel
	 */
	getPanelMenu(panelName: string): Locator {
		return this.page.locator(`[data-testid="data-testid Panel menu ${panelName}"]`);
	}

	/**
	 * Get Inspect menu item in panel menu
	 */
	get inspectMenuItem(): Locator {
		return this.page.locator('[data-testid="data-testid Panel menu item Inspect"]');
	}

	/**
	 * Get panel dropdown menu container
	 */
	get panelDropdown(): Locator {
		return this.page.locator('[data-testid="panel-dropdown"]');
	}

	/**
	 * Get Data tab in inspect drawer
	 */
	get inspectDataTab(): Locator {
		return this.page.getByRole('tab', { name: 'Data' });
	}

	/**
	 * Get Download CSV button in inspect drawer
	 */
	get downloadCSVButton(): Locator {
		return this.page.getByRole('button', { name: 'Download CSV' });
	}

	/**
	 * Get drawer close button
	 */
	get drawerCloseButton(): Locator {
		return this.page.getByTestId('data-testid Drawer close');
	}

	/**
	 * Locator for the dashboard title element.
	 */
	get dashboardTitle(): Locator {
		return this.page.getByTitle('Dashboards - Grafana');
	}

	/**
	 * Locator for the introductory text shown on the dashboard page.
	 */
	get dashboardIntroText(): Locator {
		return this.page.getByText('Create and manage dashboards to visualize your data');
	}

	/**
	 * Locator for the "Decidim" link in the dashboard.
	 */
	get decidimLink(): Locator {
		return this.page.getByRole('link', { name: 'Decidim' });
	}

	/**
	 * Locator for the heading of the "Decidim" section.
	 */
	get decidimHeading(): Locator {
		return this.page.getByRole('heading', { name: 'Decidim' });
	}

	/**
	 * Locator for the "Participation Demographics" report link.
	 */
	get participationDemographicsLink(): Locator {
		return this.page.getByRole('link', { name: 'Participation Demographics' });
	}

	/**
	 * Locator for the dashboard controls container.
	 */
	get dashboardControls(): Locator {
		return this.page.getByTestId('data-testid dashboard controls');
	}

	/**
	 * Locator for the TimePicker open button.
	 */
	get timePickerButton(): Locator {
		return this.page.getByTestId('data-testid TimePicker Open Button');
	}

	/**
	 * Locator for the "Last 1 year" option in the TimePicker.
	 */
	get lastOneYearOption(): Locator {
		return this.page.getByText('Last 1 year');
	}

	/**
	 * Locator for the panel header of the "Monthly Registration Trend" report.
	 */
	get monthlyRegistrationPanel(): Locator {
		return this.page.getByTestId('data-testid Panel header Monthly Registration Trend');
	}

	/**
	 * Locator for the content inside the "Monthly Registration Trend" panel.
	 */
	get monthlyRegistrationContent(): Locator {
		return this.monthlyRegistrationPanel.locator('[data-testid="data-testid panel content"]');
	}

	/**
	 * Locator for the canvas chart inside the "Monthly Registration Trend" panel.
	 */
	get monthlyRegistrationCanvas(): Locator {
		return this.monthlyRegistrationContent.locator('canvas');
	}

	/**
	 * Locator for the chart axes inside the "Monthly Registration Trend" panel.
	 */
	get monthlyRegistrationAxes(): Locator {
		return this.monthlyRegistrationContent.locator('.u-axis');
	}

	/**
	 * Locator for the legend item "New Registrations" inside the panel.
	 */
	get monthlyRegistrationLegend(): Locator {
		return this.monthlyRegistrationContent.getByTestId('data-testid VizLegend series New Registrations');
	}

	/**
	 * Navigate to Grafana dashboards page and verify successful navigation
	 */
	async navigateGrafanaDashboard(): Promise<void> {
		await this.page.goto(`${GRAFANA_URLS.BASE}/dashboards`, {
			waitUntil: 'networkidle'
		});

		await expect(this.page).toHaveURL(/\/dashboards/);
		await expect(this.page.getByText('Create and manage dashboards to visualize your data')).toBeVisible();
		await expect(this.page.locator('nav').first()).toBeVisible();
		await expect(this.page).toHaveTitle('Dashboards - Grafana');
	}

	/**
	 * Verify that the dashboard list is displayed
	 */
	async verifyDashboardListDisplayed(): Promise<void> {
		await expect(this.dashboardRows.first()).toBeVisible();
	}

	/**
	 * Select the first available dashboard folder
	 */
	async selectFirstDashboard(): Promise<void> {
		await expect(this.dashboardLinks.first()).toBeVisible();
		await this.dashboardLinks.first().click();
	}

	/**
	 * Verify that the reports list is displayed inside the selected folder
	 */
	async verifyReportsListDisplayed(): Promise<void> {
		await expect(this.dashboardRows.first()).toBeVisible();
	}

	/**
	 * Select the first available report
	 */
	async selectFirstReport(): Promise<void> {
		await expect(this.dashboardLinks.first()).toBeVisible();
		await this.dashboardLinks.first().click();
	}

	/**
	 * Select a report by its name (partial or full match)
	 * @param reportName - Full or partial name of the report
	 * @returns true if found and clicked, false if not found
	 */
	async selectReportByName(reportName: string): Promise<boolean> {
		try {
			const matchingRow = this.dashboardRows.filter({ hasText: reportName }).first();

			const link = matchingRow.locator('a').first();

			await expect(link).toBeVisible();
			await link.click();
			return true;
		} catch (error) {
			// Report not found
			console.log(`Report "${reportName}" not found:`, error instanceof Error ? error.message : String(error));
			return false;
		}
	}

	/**
	 * Wait for the dashboard detail page to be fully loaded
	 */
	async waitForDashboardDetailLoaded(): Promise<void> {
		await expect(this.dashboardPanels.first()).toBeVisible();
	}

	/**
	 * Verify that the report dashboard is loaded with visualizations
	 */
	async verifyReportDashboardLoaded(): Promise<void> {
		await expect(this.executiveSummaryRow).toBeVisible();
	}

	/**
	 * Get the value of a specific metric from the Executive Summary
	 * @param metricName - Name of the metric
	 * @returns The metric value as string
	 */
	async getMetricValue(metricName: string): Promise<string> {
		const panel = this.getPanel(metricName);
		await expect(panel).toBeVisible();

		const valueElement = panel.locator('div[style*="font-size"]').last();
		const value = await valueElement.textContent();

		return value?.trim() || 'No data';
	}

	/**
	 * Verify that all metric panels are displayed (regardless of data availability)
	 */
	async verifyAllMetricPanelsDisplayed(): Promise<void> {
		for (const metricName of EXECUTIVE_SUMMARY_METRICS) {
			await expect(this.getPanel(metricName)).toBeVisible();
		}
	}

	/**
	 * Get the current time range filter value
	 * @returns Current time range value as string (e.g., "7", "30", "90") or "Unknown" if not found
	 */
	async getCurrentTimeRange(): Promise<string> {
		try {
			await expect(this.timeRangeDropdown).toBeVisible();

			// Get the text content directly from the dropdown container
			// The value is displayed as visible text in the container
			const valueText = await this.timeRangeDropdown.textContent();

			if (valueText && valueText.trim()) {
				return valueText.trim();
			}

			// Fallback: parse from data-testid
			const testId = await this.timeRangeDropdown.getAttribute('data-testid');
			const match = testId?.match(/text (\d+)$/);

			if (match) {
				return match[1];
			}

			// Log warning if pattern doesn't match
			console.warn(`Could not parse time range from data-testid: "${testId}"`);
			return 'Unknown';
		} catch (error) {
			console.error('Error getting current time range:', error instanceof Error ? error.message : String(error));
			return 'Unknown';
		}
	}

	/**
	 * Change the time range filter
	 * @param days - Number of days (e.g., "7", "14", "30", "60", "90", "180", "365")
	 */
	async changeTimeRange(days: string): Promise<void> {
		// Click on the dropdown container to open it
		await this.timeRangeDropdown.click();

		// Wait for the options menu to appear
		await this.page.waitForTimeout(500);

		// Click on the matching option by text
		const option = this.page
			.locator('[data-testid="data-testid Select option"]')
			.filter({ hasText: new RegExp(`^${days}$`) });
		await expect(option).toBeVisible();
		await option.click();

		await this.page.waitForLoadState('networkidle');

		// Verify the change
		const newValue = await this.getCurrentTimeRange();
		if (newValue !== days) {
			throw new Error(`Time range not changed. Expected: ${days}, Got: ${newValue}`);
		}
	}

	/**
	 * Get all available time range options
	 * @returns Array of available time range values
	 */
	async getAvailableTimeRanges(): Promise<string[]> {
		// Find the input field for the dropdown
		const inputField = this.page.locator(
			'input[data-testid*="Dashboard template variables Variable Value DropDown value link text"][role="combobox"]'
		);

		await expect(inputField).toBeVisible();

		// Click on input to open dropdown
		await inputField.click();

		await expect(this.variableOptions.first()).toBeVisible();

		const values: string[] = [];
		const count = await this.variableOptions.count();

		for (let i = 0; i < count; i++) {
			const optionText = this.variableOptions.nth(i).locator('span').last();
			const text = await optionText.textContent();
			if (text) {
				values.push(text.trim());
			}
		}

		await this.page.keyboard.press('Escape');

		return values;
	}

	// Store metric values before filter change
	private metricValuesBeforeFilter = new Map<string, string>();

	/**
	 * Capture current metric values
	 * @returns Map of captured metric values (metric name -> value)
	 */
	async captureMetricValues(): Promise<Map<string, string>> {
		this.metricValuesBeforeFilter.clear();

		for (const metric of EXECUTIVE_SUMMARY_METRICS) {
			try {
				const value = await this.getMetricValue(metric);
				this.metricValuesBeforeFilter.set(metric, value);
			} catch (error) {
				// Metric not available
				console.log(`   - ${metric}: Not available -`, error instanceof Error ? error.message : String(error));
			}
		}

		return new Map(this.metricValuesBeforeFilter);
	}

	/**
	 * Compare current metric values with previously captured values
	 * @returns Comparison results with changes details
	 */
	async compareMetricValues(): Promise<{
		hasChanges: boolean;
		changes: Array<{ metric: string; oldValue: string; newValue: string; changed: boolean }>;
	}> {
		let hasChanges = false;
		const changes: Array<{ metric: string; oldValue: string; newValue: string; changed: boolean }> = [];

		for (const metric of EXECUTIVE_SUMMARY_METRICS) {
			try {
				const newValue = await this.getMetricValue(metric);
				const oldValue = this.metricValuesBeforeFilter.get(metric);

				if (oldValue !== undefined) {
					const changed = oldValue !== newValue;
					if (changed) {
						hasChanges = true;
					}

					changes.push({ metric, oldValue, newValue, changed });
				}
			} catch (error) {
				// Metric not available
				console.log(`   - ${metric}: Not available -`, error instanceof Error ? error.message : String(error));
			}
		}

		return { hasChanges, changes };
	}

	/**
	 * Export data from a specific panel as CSV
	 * @param panelName - Name of the panel to export
	 * @param cleanupAfterDownload - Whether to delete the file after download (default: true)
	 * @returns Object with download info and file path
	 */
	async exportPanelDataAsCSV(
		panelName: string,
		cleanupAfterDownload: boolean = true
	): Promise<{
		fileName: string;
		filePath: string;
		cleaned: boolean;
	}> {
		// Hover on the panel to reveal menu
		const panelHeader = this.getPanel(panelName);
		await panelHeader.hover();

		// Click on the menu (3 dots) - now it should be visible after hover
		const panelMenu = this.getPanelMenu(panelName);

		// Force click even if Playwright thinks it's hidden
		await panelMenu.click({ force: true });

		// Wait for Inspect menu item to be visible and actionable
		await this.inspectMenuItem.waitFor({ state: 'visible' });

		// Verify we're clicking the right element by checking text
		const inspectText = await this.inspectMenuItem.textContent();
		if (!inspectText?.includes('Inspect')) {
			throw new Error(`Expected "Inspect" menu item but found: "${inspectText}"`);
		}

		// Click Inspect to open submenu
		await this.inspectMenuItem.click();

		// Wait for Inspect submenu and click on "Data"
		const dataMenuItem = this.page.locator('[data-testid="data-testid Panel menu item Data"]');
		await dataMenuItem.waitFor({ state: 'visible' });
		await dataMenuItem.click();

		// Wait for drawer to open with explicit check
		const drawer = this.page.locator('[aria-label*="Drawer title Inspect"]');
		await drawer.waitFor({ state: 'visible' });

		// Wait for Download CSV button to be visible in the drawer
		await expect(this.downloadCSVButton).toBeVisible();

		// Start waiting for download before clicking
		const downloadPromise = this.page.waitForEvent('download');

		// Click Download CSV
		await this.downloadCSVButton.click();

		// Wait for download to complete
		const download = await downloadPromise;

		// Get filename
		const fileName = download.suggestedFilename();

		// Use temp directory
		const tempDir = tmpdir();
		const filePath = join(tempDir, fileName);

		// Save the file
		await download.saveAs(filePath);

		// Close drawer
		await this.drawerCloseButton.click();

		// Wait for drawer to close
		await expect(this.drawerCloseButton).not.toBeVisible();

		// Cleanup if requested
		let cleaned = false;
		if (cleanupAfterDownload) {
			if (existsSync(filePath)) {
				unlinkSync(filePath);
				cleaned = true;
			}
		}

		return {
			fileName,
			filePath,
			cleaned
		};
	}

	/**
	 * Export data from all Executive Summary metric panels as CSV
	 * @param cleanupAfterDownload - Whether to delete files after download (default: true)
	 * @returns Array of objects with metric name and download info
	 */
	async exportAllMetricPanelsData(cleanupAfterDownload: boolean = true): Promise<
		Array<{
			metric: string;
			fileName: string;
			filePath: string;
			success: boolean;
			cleaned: boolean;
			error?: string;
		}>
	> {
		const results: Array<{
			metric: string;
			fileName: string;
			filePath: string;
			success: boolean;
			cleaned: boolean;
			error?: string;
		}> = [];

		for (const metric of EXECUTIVE_SUMMARY_METRICS) {
			try {
				const result = await this.exportPanelDataAsCSV(metric, cleanupAfterDownload);

				results.push({
					metric,
					fileName: result.fileName,
					filePath: result.filePath,
					success: true,
					cleaned: result.cleaned
				});

				// Small delay between exports to avoid race conditions
				await this.page.waitForTimeout(500);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.log(`   Failed to export ${metric}: ${errorMessage}`);

				results.push({
					metric,
					fileName: 'N/A',
					filePath: 'N/A',
					success: false,
					cleaned: false,
					error: errorMessage
				});
			}
		}

		return results;
	}

	/**
	 * Verifies that the user is on the Grafana dashboard page and that key elements are visible.
	 */
	async verifyDashboardPageLoaded() {
		await expect(this.page).toHaveURL(`${GRAFANA_URLS.BASE}/dashboards`);
		await this.page.waitForFunction(() => document.title && document.title.includes('Dashboards'));
		await expect(this.page).toHaveTitle('Dashboards - Grafana');
		await expect(this.dashboardIntroText).toBeVisible();
	}
	/**
	 * Opens the "Decidim" section from the dashboard and verifies its heading is visible.
	 */
	async openDecidimSection() {
		await expect(this.decidimLink).toBeVisible();
		await this.decidimLink.click();
		await this.page.waitForLoadState('networkidle');
		await expect(this.decidimHeading).toBeVisible();
	}
	/**
	 * Opens the "Participation Demographics" report and verifies the URL contains the expected path.
	 */
	async openParticipationDemographicsReport() {
		await expect(this.participationDemographicsLink).toBeVisible();
		await this.participationDemographicsLink.click();
		await this.page.waitForLoadState('networkidle');
		expect(this.page.url()).toContain(`${GRAFANA_URLS.BASE}/d/decidim_demographics/participation-demographics`);
	}
	/**
	 * Verifies that the dashboard controls section is visible.
	 */
	async verifyDashboardControlsVisible() {
		await expect(this.dashboardControls).toBeVisible();
	}
	/**
	 * Opens the TimePicker and selects the "Last 1 year" option to filter data.
	 */
	async configureTimePeriodFilter() {
		await expect(this.timePickerButton).toBeVisible();
		await this.timePickerButton.click();
		await this.lastOneYearOption.click();
	}
	/**
	 * Verifies that the panel header for "Monthly Registration Trend" is visible.
	 */
	async verifyPanelHeaderVisible() {
		await expect(this.monthlyRegistrationPanel).toBeVisible();
	}
	/**
	 * Verifies that the heading "Monthly Registration Trend" is visible on the page.
	 */
	async verifyPanelHeadingVisible() {
		await expect(this.monthlyRegistrationPanel).toBeVisible();
	}
	/**
	 * Verifies that the visual feedback report is rendered with chart, axes, and legend.
	 */
	async verifyMonthlyRegistrationTrendPanel() {
		await expect(this.monthlyRegistrationContent).toBeVisible();
		await expect(this.monthlyRegistrationCanvas).toBeVisible();
		await expect(this.monthlyRegistrationAxes).toHaveCount(2);
		await expect(this.monthlyRegistrationLegend).toBeVisible();
		await expect(this.monthlyRegistrationPanel).toBeVisible();
	}
}
