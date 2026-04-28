/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Page, expect } from '@playwright/test';

/**
 * Page object class for Map Visualization page in the public section of processes.
 */
export class MapVisualizationPage {
	private page: Page;
	private cardTitleLocator = '.card__list-title';

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Verifies if the Map ID is visible on the Map Visualization public page.
	 * @param expectedMapId - The expected Map ID to be visible.
	 */
	async verifyMapIdVisible(expectedMapId: string) {
		const associationName = `association test ${expectedMapId}`;
		const titleLocator = this.page.locator(this.cardTitleLocator, {
			hasText: associationName
		});

		await expect(titleLocator).toBeVisible();
	}

	/**
	 * Clicks on the map link to navigate to the details.
	 * @param selectedMapId - The ID of the selected map.
	 */
	async clickMapLink(selectedMapId: string) {
		const associationName = `association test ${selectedMapId}`;
		const titleLocator = this.page.locator(this.cardTitleLocator, {
			hasText: associationName
		});

		await titleLocator.click();
	}

	/**
	 * Verifies if the Map details are visible on the detail page.
	 * @param expectedMapId - The expected Map ID to verify on the detail page.
	 */
	async verifyMapDetailsVisible(expectedMapId: string) {
		const associationName = `association test ${expectedMapId}`;

		// Wait for navigation to complete
		await this.page.waitForLoadState('load');

		// Verify URL pattern
		await expect(this.page).toHaveURL(/\/map_visualizations\/\d+/);

		// Verify the title is visible
		const titleElement = this.page.locator('h1.title-decorator', {
			hasText: associationName
		});
		await expect(titleElement).toBeVisible();

		// Verify the map image is present
		const mapImage = this.page.locator(`img[alt="${associationName}"]`);
		await expect(mapImage).toBeVisible();
	}
}
