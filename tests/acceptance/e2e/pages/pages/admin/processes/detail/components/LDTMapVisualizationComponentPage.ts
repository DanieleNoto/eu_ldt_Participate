/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Page, expect } from '@playwright/test';
import { BaseAdminPage } from '../../../../admin/BaseAdminPage';
import { ComponentsPage } from './ComponentsPage';

export class LDTMapVisualizationComponentPage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Adds a new component and selects LDT Map Visualization type
	 * @param componentsPage - Components page instance
	 * @param processSlug - Process slug for navigation
	 */
	async addComponentAndSelectLDTMapVisualization(componentsPage: ComponentsPage, processSlug: string): Promise<void> {
		await componentsPage.addLDTMapVisualizationComponent();
		await this.page.waitForURL(
			`/admin/participatory_processes/${processSlug}/components/new?type=ldt_map_visualization`
		);
	}

	/**
	 * Fills component configuration form
	 * @param name - Component name
	 * @param title - Component title
	 */
	async fillComponentForm(name: string, title: string): Promise<void> {
		// Fill Name field
		await this.page.getByRole('textbox', { name: 'name' }).click();
		await this.page.getByRole('textbox', { name: 'name' }).fill(name);

		// Fill Title field
		await this.page.getByRole('textbox', { name: 'Title' }).click();
		await this.page.getByRole('textbox', { name: 'Title' }).fill(title);
	}

	/**
	 * Saves the component configuration by clicking "Add component" button
	 */
	async saveComponent(): Promise<void> {
		await this.page.getByRole('button', { name: 'Add component', exact: true }).click();
	}

	/**
	 * Clicks on "Add New Map" link
	 */
	async clickAddNewMap(): Promise<void> {
		await this.page.getByRole('link', { name: 'Add New Map' }).click();
	}

	/**
	 * Selects the first available map in the list and returns its name
	 * @returns The map name of the selected map
	 */
	async selectFirstMap(): Promise<string> {
		const mapsTable = this.page.locator('table.table-list');
		await mapsTable.waitFor({ state: 'visible' });

		const firstMapRow = this.page.locator('tbody#maps-tbody tr').first();
		await firstMapRow.waitFor({ state: 'visible' });

		const mapId = await firstMapRow.getAttribute('data-map-id');
		if (!mapId) {
			throw new Error('Could not get map ID from the first row');
		}

		const radioButton = firstMapRow.locator('input.select-map-radio');
		await radioButton.check();

		console.log(`Selected map with ID: ${mapId}`);

		return mapId;
	}

	/**
	 * Fills the Association Name field
	 * @param associationName - The name for the association
	 */
	async fillAssociationName(associationName: string): Promise<void> {
		const associationInput = this.page.getByRole('textbox', { name: 'Enter a name for this map' });
		await associationInput.waitFor({ state: 'visible' });
		await expect(associationInput).toBeEnabled();
		await associationInput.fill(associationName);
	}

	/**
	 * Clicks the Create button to confirm the association configuration
	 */
	async saveAssociationConfiguration(): Promise<void> {
		await this.page.getByRole('button', { name: 'Create' }).click();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Verifies that the map visualization was created successfully by checking the success message
	 */
	async verifyMapVisualizationCreatedSuccessfully(): Promise<void> {
		await expect(this.page.getByText('Map visualization created successfully')).toBeVisible();
	}

	/**
	 * Verifies that an association exists in the Map Visualization table
	 * @param associationName - The association name to verify
	 * @param mapId - The map ID to verify
	 */
	async verifyMapVisualizationExists(associationName: string, mapId: string): Promise<void> {
		// Find the row containing the association by matching the Name column
		const associationRow = this.page
			.locator('table.table-list tbody tr')
			.filter({
				has: this.page.locator('td[data-label="Name"]', { hasText: associationName })
			})
			.first();

		// Verify the row is visible
		await expect(associationRow).toBeVisible();

		// Verify Association Name in Name column
		const nameCell = associationRow.locator('td[data-label="Name"]');
		await expect(nameCell).toContainText(associationName);

		// Verify map ID in Map ID column
		const mapIdCell = associationRow.locator('td[data-label="Map ID"]');
		await expect(mapIdCell).toContainText(mapId);
	}

	/**
	 * Verifies that the map visualization was deleted successfully by checking the success message
	 */
	async verifyMapVisualizationDeletedSuccessfully(): Promise<void> {
		await expect(this.page.getByText('Map visualization deleted successfully')).toBeVisible();
	}

	/**
	 * Deletes an association by map ID
	 * @param mapId - The map ID to delete
	 */
	async deleteMapVisualizationByMapId(mapId: string): Promise<void> {
		// Find the row containing the map ID in the "Map ID" column
		const associationRow = this.page
			.locator('table.table-list tbody tr')
			.filter({
				has: this.page.locator('td[data-label="Map ID"]', { hasText: mapId })
			})
			.first();

		// Verify the row exists
		const rowCount = await associationRow.count();
		if (rowCount === 0) {
			console.log(`Map ID "${mapId}" not found, skipping deletion`);
			return;
		}

		// Click the delete link
		const deleteLink = associationRow.locator('a.action-icon--delete');
		await deleteLink.click();

		// Wait for the confirmation modal to appear and click OK button
		const okButton = this.page.locator('button[data-confirm-ok]');
		await okButton.waitFor({ state: 'visible' });
		await okButton.evaluate((element: HTMLElement) => element.click());

		// Wait for deletion to complete
		await this.page.waitForLoadState('networkidle');

		// Verify success message
		await this.verifyMapVisualizationDeletedSuccessfully();
	}

	/**
	 * Navigates to the LDT Map Visualization manage page
	 * @param processSlug - Process slug
	 * @param componentId - Component ID
	 */
	async navigateToManagePage(processSlug: string, componentId: string): Promise<void> {
		await this.page.goto(
			`/admin/participatory_processes/${processSlug}/components/${componentId}/manage/map_visualizations`
		);
	}

	/**
	 * Verifies that the validation error message is displayed.
	 */
	async verifyAssociationNameRequiredError(): Promise<void> {
		await expect(this.page.getByText('There is an error in this field')).toBeVisible();
	}
}
