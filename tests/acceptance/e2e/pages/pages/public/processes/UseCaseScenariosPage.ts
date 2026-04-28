/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Simone Bianchelli
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from '../../../base/BasePage';
import { TEST_SELECTORS } from '../../../../utils/constants';

/**
 * Page Object Model for the public Use Case Scenarios page
 */

export class UseCaseScenariosPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Verifies that experiment ID is visible on the page
	 * @param experimentId - The experiment ID to verify
	 */

	async verifyExperimentIdVisible(experimentId: string): Promise<void> {
		const associationName = `association test ${experimentId}`;
		const locator = this.page.getByText(associationName).first();
		await expect(locator).toBeVisible();
	}

	/**
	 * Clicks on the association link with the specified name
	 * @param experimentId - The ID of the experiment to search for
	 */

	async clickAssociationLink(experimentId: string): Promise<void> {
		const associationName = `association test ${experimentId}`;
		const locator = this.page.getByText(associationName).first();
		await locator.click();
	}

	async verifyExperimentIdDetailVisible(experimentId: string): Promise<'Experiment' | 'Execution'> {
		const experimentText = `Experiment ID ${experimentId}`;
		const executionText = `Execution ID ${experimentId}`;

		const experimentLocator = this.page.getByText(experimentText);
		const executionLocator = this.page.getByText(executionText);

		await expect(experimentLocator.or(executionLocator)).toBeVisible();

		if (await experimentLocator.isVisible()) return 'Experiment';
		return 'Execution';
	}

	async verifyScenariosDisplayed(): Promise<void> {
		await this.page.waitForLoadState('load');
		const scenarioList = this.page.locator(TEST_SELECTORS.PROCESS.SCENARIO_LIST);
		await expect(scenarioList.first()).toBeVisible();
		const countScenarios = await scenarioList.count();
		expect(countScenarios).toBeGreaterThan(0);
	}

	async selectFirstScenario(): Promise<void> {
		const firstScenario = this.page.locator(TEST_SELECTORS.PROCESS.FIRST_SCENARIO);
		await expect(firstScenario).toBeVisible();
		const firstScenarioTitleLocator = this.page.locator(
			TEST_SELECTORS.PROCESS.FIRST_SCENARIO + ' .card__list-title'
		);
		const selectedScenarioTitle = (await firstScenarioTitleLocator.innerText()).trim();
		(this.page as any).__selectedScenarioTitle = selectedScenarioTitle;

		const metadataLocator = this.page
			.locator(TEST_SELECTORS.PROCESS.FIRST_SCENARIO + ' .card__list-metadata > div')
			.first();
		if ((await metadataLocator.count()) > 0) {
			let metadataText = (await metadataLocator.innerText()).trim();
			metadataText = metadataText
				.replace(/\s+/g, ' ')
				.replace(/\u2026/g, '')
				.replace(/\.{3,}/g, '')
				.replace(/[\u200B-\u200D\uFEFF]/g, '')
				.trim();
			(this.page as any).__selectedScenarioMetadata = metadataText;
		}

		await firstScenario.click();
		await this.page.waitForLoadState('load');
	}

	/**
	 * Selects a specific scenario by its title
	 * @param scenarioTitle - The title of the scenario to select
	 */
	async selectScenarioByTitle(scenarioTitle: string): Promise<void> {
		const scenarios = this.page.locator(TEST_SELECTORS.PROCESS.SCENARIO_LIST);
		await expect(scenarios.first()).toBeVisible();
		const scenarioCount = await scenarios.count();

		let foundScenario = false;
		for (let i = 0; i < scenarioCount; i++) {
			const scenario = scenarios.nth(i);
			const titleLocator = scenario.locator('.card__list-title');
			let title = (await titleLocator.innerText()).trim();
			// Normalize whitespace
			title = title.replace(/\s+/g, ' ').trim();

			if (title === scenarioTitle) {
				(this.page as any).__selectedScenarioTitle = title;

				const metadataLocator = scenario.locator('.card__list-metadata > div').first();
				if ((await metadataLocator.count()) > 0) {
					let metadataText = (await metadataLocator.innerText()).trim();
					metadataText = metadataText
						.replace(/\s+/g, ' ')
						.replace(/\u2026/g, '')
						.replace(/\.{3,}/g, '')
						.replace(/[\u200B-\u200D\uFEFF]/g, '')
						.trim();
					(this.page as any).__selectedScenarioMetadata = metadataText;
				}

				await scenario.click();
				await this.page.waitForLoadState('load');
				foundScenario = true;
				break;
			}
		}

		if (!foundScenario) {
			throw new Error(`Scenario with title "${scenarioTitle}" not found`);
		}
	}

	async verifyUseCaseContentEmbedded(): Promise<void> {
		const useCaseContent = this.page.locator(TEST_SELECTORS.PROCESS.USE_CASE_CONTENT);
		const countContent = await useCaseContent.count();
		expect(countContent).toBeGreaterThan(0);
	}

	async verifyAiLabel(): Promise<void> {
		const aiLabel = this.page.locator(TEST_SELECTORS.PROCESS.AI_LABEL);
		await expect(aiLabel).toBeVisible();
		await expect(aiLabel).toContainText('AI');
	}

	async verifyProcessContentWithUseCase(): Promise<void> {
		const heading = this.page.locator(TEST_SELECTORS.PROCESS.SCENARIO_HEADING);
		await expect(heading).toBeVisible();

		const selectedScenarioTitle = (this.page as any).__selectedScenarioTitle as string;
		if (!selectedScenarioTitle) throw new Error('No scenario title saved from Step 5');
		await expect(heading).toContainText(selectedScenarioTitle);

		const savedMetadataID = (this.page as any).__selectedScenarioMetadata as string;
		if (!savedMetadataID) throw new Error('No saved metadata found from Step 5');

		const metaTextLocator = this.page.locator(TEST_SELECTORS.PROCESS.EXPERIMENT_ID_TEXT);
		await expect(metaTextLocator).toBeVisible();
		const displayedID = (await metaTextLocator.innerText()).trim();
		expect(displayedID).toContain(savedMetadataID);

		const detailsHeading = this.page.locator(TEST_SELECTORS.PROCESS.EXPERIMENT_DETAILS_HEADING);
		await expect(detailsHeading).toHaveText(/Details of the Experiment Execution/i);
	}

	async verifyAdditionalUseCaseInfo(): Promise<void> {
		const expIdTitle = this.page.locator(TEST_SELECTORS.PROCESS.EXPERIMENT_ID_TITLE);
		await expect(expIdTitle).toHaveText('Experiment ID');

		const iframeContainer = this.page.locator(TEST_SELECTORS.PROCESS.METRICS_IFRAME_CONTAINER);
		await expect(iframeContainer).toBeVisible();
	}

	async verifyBasicInformationSection() {
		const frame = this.page.frameLocator(TEST_SELECTORS.PROCESS.METRICS_IFRAME_CONTAINER);

		await expect(frame.locator('h2')).toHaveText('Basic information');

		const labels = ['ID', 'Status', 'Experiment Version', 'Model', 'Data soure'];

		for (const label of labels) {
			const row = frame.locator(`tr:has-text("${label}")`);
			const valueCell = row.locator('td').nth(1).locator('div');
			await expect(valueCell).toBeVisible();
			await expect(valueCell).not.toHaveText('');
		}
	}

	async getRealtimeMonitoringInfo() {
		const frame = this.page.frameLocator(TEST_SELECTORS.PROCESS.METRICS_IFRAME_CONTAINER);
		const container = frame.locator(TEST_SELECTORS.PROCESS.REALTIME_MONITORING_CONTAINER);

		const chartSelector = container.locator(TEST_SELECTORS.PROCESS.REALTIME_ACTIONS_CHART);
		await chartSelector.waitFor({ state: 'visible' });
		const chartText = await chartSelector.innerText();

		const placeholder = container.locator(TEST_SELECTORS.PROCESS.REALTIME_CHART_PLACEHOLDER);
		const chart = container.locator(TEST_SELECTORS.PROCESS.REALTIME_CHART);

		let chartState: string;
		if (await placeholder.isVisible()) {
			chartState = (await placeholder.innerText())?.trim() ?? 'placeholder visible';
		} else {
			chartState = 'chart rendered';
		}

		return {
			chartSelected: chartText?.trim(),
			chartState
		};
	}

	async getChartOptions() {
		const frame = this.page.frameLocator(TEST_SELECTORS.PROCESS.METRICS_IFRAME_CONTAINER);

		const combo = frame.locator(TEST_SELECTORS.PROCESS.REALTIME_ACTIONS_CHART);

		await combo.waitFor({ state: 'visible' });

		await combo.click({ force: true });
		await combo.press('ArrowDown');

		const optionsLocator = frame.locator('ul[role="listbox"] li[role="option"]');

		await optionsLocator.first().waitFor({ state: 'visible' });

		const options = await optionsLocator.allTextContents();

		await combo.press('Escape');

		return options.map(opt => opt.trim());
	}

	async verifyTabsPresent(expectedTabs: string[]) {
		const iframe = this.page.locator('#experiment-iframe');
		const frame = await iframe.contentFrame();
		if (!frame) {
			throw new Error('Iframe not available');
		}

		for (const tab of expectedTabs) {
			await frame.getByRole('tab', { name: tab }).click();
		}
	}

	async verifyInferenceResponseSection() {
		const frame = this.page.frameLocator('#experiment-iframe');

		const section = frame.locator('div.uc\\:flex.uc\\:items-center.uc\\:justify-between.uc\\:mb-1');

		await expect(section.locator('div.uc\\:font-semibold')).toHaveText('Inference Response');

		await expect(section.getByRole('button', { name: 'Collapse' })).toBeVisible();
		await expect(section.getByRole('button', { name: 'Copy' })).toBeVisible();
		await expect(section.getByRole('button', { name: 'Download' })).toBeVisible();
	}
}
