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
        // Find at least one occurrence of the experiment ID in the page
        const experimentIdLocator = this.page.getByText(experimentId).first();
        await expect(experimentIdLocator).toBeVisible();
    }
}