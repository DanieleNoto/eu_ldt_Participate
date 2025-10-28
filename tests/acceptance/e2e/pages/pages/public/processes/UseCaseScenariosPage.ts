/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Simone Bianchelli
 */

import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from '../../../base/BasePage';

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
	 * Click s on the association link with the specified name
	 * @param experimentId - The ID of the experiment to search for
	 */
	async clickAssociationLink(experimentId: string): Promise<void> {
		const associationName = `association test ${experimentId}`;
		const locator = this.page.getByText(associationName).first();
		await locator.click();
	}

	/**
	 * Verify the "Experiment ID <experimentId>" is visible on the page
	 */
	async verifyExperimentIdDetailVisible(experimentId: string): Promise<void> {
		await expect(this.page.getByText(`Experiment ID ${experimentId}`)).toBeVisible();
	}
}
