/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Simone Bianchelli
 */

import { Page, expect } from '@playwright/test';
import { BaseAdminPage } from '../../../../admin/BaseAdminPage';
import { ComponentsPage } from './ComponentsPage';

export class LDTUseCaseScenariosComponentPage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Adds a new component and selects LDT Use Case Scenarios type
	 * @param componentsPage - Components page instance
	 * @param processSlug - Process slug for navigation
	 */
	async addComponentAndSelectLDTUseCaseScenarios(componentsPage: ComponentsPage, processSlug: string): Promise<void> {
		await componentsPage.addLDTUseCaseScenariosComponent();
		await this.page.waitForURL(
			`/admin/participatory_processes/${processSlug}/components/new?type=ldt_use_case_scenarios`
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
	 * Clicks on "Associate experiments results" link to configure use case information
	 */
	async clickAssociateExperimentsResults(): Promise<void> {
		await this.page.getByRole('link', { name: 'Associate experiments results' }).click();
	}

	/**
	 * Verifies that the experiments list is displayed
	 */
	async verifyExperimentsListDisplayed(): Promise<void> {
		await expect(this.page.locator('#experiments-thead')).toBeVisible();
		await expect(this.page.locator('#experiments-tbody')).toBeVisible();
	}

	/**
	 * Selects the first available experiment in the list and returns its ID
	 * @returns The experiment ID (UUID) of the selected experiment
	 */
	async selectFirstExperiment(): Promise<string> {
		const experimentRows = this.page.locator('#experiments-tbody tr[data-experiment-id]');
		const firstRow = experimentRows.first();

		await expect(firstRow).toBeVisible();

		// Get experiment ID before selecting
		const experimentId = await firstRow.getAttribute('data-experiment-id');

		if (!experimentId) {
			throw new Error('Could not get experiment ID from the first row');
		}

		// Select the experiment using radio button
		const radioButton = firstRow.locator('input.select-experiment-radio');
		await radioButton.check();

		return experimentId;
	}

	/**
	 * Fills the Association Name field
	 * @param associationName - The name for the association
	 */
	async fillAssociationName(associationName: string): Promise<void> {
		// Aspetta che il loader sparisca
		const loadingLocator = this.page.locator('div[data-selected-experiment-info] p', {
			hasText: 'Loading experiment details...'
		});
		if (await loadingLocator.isVisible().catch(() => false)) {
			await loadingLocator.waitFor({ state: 'hidden' });
		}

		const associationInput = this.page.getByRole('textbox', { name: 'Association Name' });
		await associationInput.waitFor({ state: 'visible' });
		await expect(associationInput).toBeEnabled();
		await associationInput.fill(associationName);
	}

	/**
	 * Clicks the Save button to confirm the association configuration
	 */
	async saveAssociationConfiguration(): Promise<void> {
		await this.page.getByRole('button', { name: 'Save' }).click();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Verifies that the experiment was saved successfully by checking the success message
	 */
	async verifyExperimentSavedSuccessfully(): Promise<void> {
		await expect(this.page.getByText('Experiment association created successfully')).toBeVisible();
	}

	/**
	 * Verifies that an association exists in the Use Case Scenarios table
	 * @param associationName - The association name to verify
	 * @param experimentId - The experiment ID to verify
	 */
	async verifyAssociationExists(associationName: string, experimentId: string): Promise<void> {
		// Find the row containing the association
		const associationRow = this.page
			.locator('tbody tr[data-scenario-id]')
			.filter({
				has: this.page.locator('td strong', { hasText: associationName })
			})
			.first();

		// Verify the row is visible
		await expect(associationRow).toBeVisible();

		// Verify Association Name in first column
		const nameCell = associationRow.locator('td[data-label="Scenario Name"] strong');
		await expect(nameCell).toHaveText(associationName);

		// Verify Experiment ID in second column
		const experimentCell = associationRow.locator('td[data-label="Experiment ID"]');
		await expect(experimentCell).toHaveText(experimentId);
	}

	/**
	 * Verifies that the association was deleted successfully by checking the success message
	 */
	async verifyAssociationDeletedSuccessfully(): Promise<void> {
		await expect(this.page.getByText('Item deleted successfully')).toBeVisible();
	}

	/**
	 * Deletes an association by experiment ID
	 * @param experimentId - The experiment ID to delete
	 */
	async deleteAssociationByExperimentId(experimentId: string): Promise<void> {
		// Find the row containing the experiment ID
		const associationRow = this.page
			.locator('tbody tr[data-scenario-id]')
			.filter({
				has: this.page.locator('td[data-label="Experiment ID"]', { hasText: experimentId })
			})
			.first();

		// Verify the row exists
		const rowCount = await associationRow.count();
		if (rowCount === 0) {
			console.log(`Association with experiment ID "${experimentId}" not found, skipping deletion`);
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
		await this.verifyAssociationDeletedSuccessfully();

		console.log(`Deleted association with experiment ID: ${experimentId}`);
	}

	/**
	 * Navigates to the LDT Use Case Scenarios manage page
	 * @param processSlug - Process slug
	 * @param componentId - Component ID
	 */
	async navigateToManagePage(processSlug: string, componentId: string): Promise<void> {
		await this.page.goto(
			`/admin/participatory_processes/${processSlug}/components/${componentId}/manage/ldt_use_case_scenarios`
		);
	}

	/**
	 * Verifies that the validation error message is displayed.
	 */
	async verifyAssociationNameRequiredError(): Promise<void> {
		await expect(this.page.getByText('There is an error in this field')).toBeVisible();
	}
}
