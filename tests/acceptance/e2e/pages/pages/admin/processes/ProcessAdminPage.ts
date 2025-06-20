import { Page, expect } from '@playwright/test';
import { LocalizationUtils } from '../../../../utils/localization.utils';
import { AdminProcessBreadcrumbComponent } from '../../../components/admin/process/AdminProcessBreadcrumbComponent';
import { AdminProcessFiltersComponent } from '../../../components/admin/process/AdminProcessFiltersComponent';
import { AdminProcessTableComponent } from '../../../components/admin/process/AdminProcessTableComponent';
import { AdminProcessTabNavigationComponent } from '../../../components/admin/process/AdminProcessTabNavigationComponent';
import { BaseAdminPage } from '../BaseAdminPage';

/**
 * Page Object Model for the Decidim admin participatory processes page.
 * Extends BaseAdminPage and composes process-specific components for modular architecture.
 */
export class ProcessAdminPage extends BaseAdminPage {
	// Process-specific components
	public readonly processBreadcrumb: AdminProcessBreadcrumbComponent;
	public readonly processTabNavigation: AdminProcessTabNavigationComponent;
	public readonly processFilters: AdminProcessFiltersComponent;
	public readonly processTable: AdminProcessTableComponent;

	constructor(page: Page) {
		super(page);

		// Initialize process-specific components
		this.processBreadcrumb = new AdminProcessBreadcrumbComponent(page);
		this.processTabNavigation = new AdminProcessTabNavigationComponent(page);
		this.processFilters = new AdminProcessFiltersComponent(page);
		this.processTable = new AdminProcessTableComponent(page);
	}

	// Navigation methods using components
	async navigateToProcesses() {
		await this.adminNavigation.navigateToProcesses();
		await this.waitForProcessesPageLoad();
	}

	async navigateToNewProcess() {
		try {
			await this.processBreadcrumb.clickNewProcess();
		} catch (error) {
			// If breadcrumb navigation fails, try direct navigation
			console.log('Breadcrumb navigation failed, trying direct navigation');
			await this.page.goto('/admin/participatory_processes/new');
		}
		await this.waitForNewProcessPageLoad();
	}

	async navigateToProcessGroups() {
		await this.processTabNavigation.clickProcessGroupsTab();
		await this.waitForProcessGroupsPageLoad();
	}

	async navigateToProcessesTab() {
		await this.processTabNavigation.clickProcessesTab();
		await this.waitForProcessesPageLoad();
	}

	// Page state and checks using components
	async isOnProcessesPage() {
		return (
			(await this.processBreadcrumb.isBreadcrumbVisible()) &&
			(await this.processTabNavigation.isProcessesTabActive())
		);
	}

	async isOnProcessGroupsPage() {
		return (
			(await this.processBreadcrumb.isBreadcrumbVisible()) &&
			(await this.processTabNavigation.isProcessGroupsTabActive())
		);
	}

	async isOnNewProcessPage() {
		const currentUrl = this.page.url();
		return currentUrl.includes('/admin/participatory_processes/new');
	}

	// Process management using table component
	async viewProcess(processName: string) {
		await this.processTable.viewProcess(processName);
	}

	async editProcess(processName: string) {
		await this.processTable.editProcess(processName);
	}

	async editFirstProcess() {
		await this.processTable.editFirstProcess();
	}

	async duplicateProcess(processName: string) {
		await this.processTable.duplicateProcess(processName);
	}

	async deleteProcess(processName: string) {
		await this.processTable.deleteProcess(processName);
	}

	async publishProcess(processName: string) {
		await this.processTable.publishProcess(processName);
	}

	async unpublishProcess(processName: string) {
		await this.processTable.unpublishProcess(processName);
	}

	// Process filtering and search using filters component
	async searchProcesses(searchTerm: string) {
		await this.processFilters.searchFor(searchTerm);
		await this.processTable.waitForTableLoad();
	}

	async filterByPublicSpace() {
		await this.processFilters.filterByPublicSpace();
		await this.processTable.waitForTableLoad();
	}

	async filterByPrivateSpace() {
		await this.processFilters.filterByPrivateSpace();
		await this.processTable.waitForTableLoad();
	}

	async filterByPublished() {
		await this.processFilters.filterByPublished();
		await this.processTable.waitForTableLoad();
	}

	async filterByUnpublished() {
		await this.processFilters.filterByUnpublished();
		await this.processTable.waitForTableLoad();
	}

	async clearAllFilters() {
		await this.processFilters.clearAllFilters();
		await this.processTable.waitForTableLoad();
	}

	// Process data retrieval
	async getProcessTitles() {
		return await this.processTable.getProcessTitles();
	}

	async getProcessStatuses() {
		return await this.processTable.getProcessStatuses();
	}

	async getProcessCount() {
		return await this.processTable.getProcessCount();
	}

	async hasProcesses() {
		return await this.processTable.hasProcesses();
	}

	async isTableEmpty() {
		return await this.processTable.isEmpty();
	}

	// Process status checks
	async isProcessPublished(processName: string) {
		return await this.processTable.isProcessPublished(processName);
	}

	async isProcessDraft(processName: string) {
		return await this.processTable.isProcessDraft(processName);
	}

	async isProcessArchived(processName: string) {
		return await this.processTable.isProcessArchived(processName);
	}

	// Page loading helpers
	private async waitForProcessesPageLoad() {
		await this.page.waitForLoadState('networkidle');
		await this.processTabNavigation.isComponentFullyLoaded();
		await this.processTable.waitForTableLoad();
	}

	private async waitForProcessGroupsPageLoad() {
		await this.page.waitForLoadState('networkidle');
		await this.processTabNavigation.isComponentFullyLoaded();
	}

	private async waitForNewProcessPageLoad() {
		await this.page.waitForLoadState('networkidle');

		// Wait for the form to be present
		try {
			await this.page.waitForSelector('form', { state: 'visible', timeout: 30000 });
		} catch (error) {
			console.log("Form not found, checking if we're on the correct page");
			console.log('Current URL:', this.page.url());
			throw new Error('New process form not found. Current URL: ' + this.page.url());
		}

		// Wait for essential form fields to be present
		await this.page.waitForSelector('input[name*="title"], input[id*="title"]', { timeout: 30000 });
	}

	// Form element getters for test assertions (legacy support)
	async getSubtitleTextbox() {
		return this.page.getByRole('textbox', { name: 'subtitle' });
	}

	async getOrderPositionSpinbutton() {
		// Try multiple selectors for the order position field
		const selectors = [
			// Role-based selectors
			this.page.getByRole('spinbutton', { name: 'Order position Required field' }),
			this.page.getByRole('spinbutton', { name: /order.*position/i }),
			this.page.getByRole('textbox', { name: /order.*position/i }),
			this.page.getByRole('spinbutton'),

			// Attribute-based selectors
			this.page.locator('input[name*="order_position"], input[id*="order_position"]'),
			this.page.locator('input[type="number"][name*="order"], input[type="number"][id*="order"]'),
			this.page.locator('input[name*="position"], input[id*="position"]'),

			// Generic selectors for number inputs
			this.page.locator('input[type="number"]'),
			this.page.locator('input[inputmode="numeric"]'),

			// Label-based selectors
			this.page.locator('label:has-text("Order position") + input, label:has-text("Order position") input'),
			this.page.locator('label:has-text("Position") + input, label:has-text("Position") input')
		];

		for (let i = 0; i < selectors.length; i++) {
			const selector = selectors[i];
			try {
				const count = await selector.count();
				if (count > 0) {
					const element = selector.first();
					if (await element.isVisible({ timeout: 2000 })) {
						console.log(`Order position field found using selector ${i}: ${selector}`);
						return element;
					}
				}
			} catch (error) {
				// Continue to next selector
			}
		}

		console.log('No order position field found with any selector');
		// If none found, return the first number input or original selector
		const numberInputs = this.page.locator('input[type="number"]');
		const numberCount = await numberInputs.count();
		if (numberCount > 0) {
			console.log('Returning first number input as fallback');
			return numberInputs.first();
		}

		return this.page.getByRole('spinbutton', { name: 'Order position Required field' });
	}

	async getTitleTextbox() {
		return this.page.getByRole('textbox', { name: 'title', exact: true });
	}

	// Process creation form methods
	async fillGeneralInfo(processData: ProcessGeneralInfo) {
		console.log('Filling general info fields...');

		// Title field
		try {
			await this.page.getByRole('textbox', { name: 'title', exact: true }).click();
			await this.page.getByRole('textbox', { name: 'title', exact: true }).fill(processData.title);
			console.log('Title field filled successfully');
		} catch (error) {
			console.log('Error filling title field:', error);
			throw error;
		}

		// Subtitle field
		try {
			await this.page.getByRole('textbox', { name: 'subtitle' }).click();
			await this.page.getByRole('textbox', { name: 'subtitle' }).fill(processData.subtitle);
			console.log('Subtitle field filled successfully');
		} catch (error) {
			console.log('Error filling subtitle field:', error);
			throw error;
		}

		// Order position field - handle gracefully
		if (processData.orderPosition !== 0) {
			try {
				const orderPositionField = await this.getOrderPositionSpinbutton();
				if (await orderPositionField.isVisible({ timeout: 5000 })) {
					await orderPositionField.click();
					await orderPositionField.fill(processData.orderPosition.toString());
					console.log('Order position field filled successfully');
				} else {
					console.log('Order position field not visible, skipping...');
				}
			} catch (error) {
				console.log('Order position field not found or not fillable, continuing...', error);
			}
		} else {
			console.log('Order position is 0, skipping field...');
		}

		// URL slug field
		try {
			await this.page.locator('#participatory_process_slug').click();
			await this.page.locator('#participatory_process_slug').fill(processData.urlSlug);
			console.log('URL slug field filled successfully');
		} catch (error) {
			console.log('Error filling URL slug field:', error);
			throw error;
		}

		// Short description field
		try {
			const shortDescriptionSelector = await LocalizationUtils.getWorkingLocalizedSelector(
				this.page,
				'participatory_process_short_description'
			);
			await this.page.locator(shortDescriptionSelector).getByRole('textbox', { name: 'Add image' }).click();
			await this.page
				.locator(shortDescriptionSelector)
				.getByRole('textbox', { name: 'Add image' })
				.fill(processData.shortDescription);
			console.log('Short description field filled successfully');
		} catch (error) {
			console.log('Error filling short description field:', error);
			// Not critical, continue
		}

		// Hashtag field
		try {
			await this.page.locator('#panel-title div').filter({ hasText: 'Hashtag' }).nth(1).click();
			await this.page.getByRole('textbox', { name: 'Hashtag' }).fill(processData.hashtag);
			console.log('Hashtag field filled successfully');
		} catch (error) {
			console.log('Error filling hashtag field:', error);
			// Not critical, continue
		}

		// Description field
		try {
			const descriptionSelector = await LocalizationUtils.getWorkingLocalizedSelector(
				this.page,
				'participatory_process_description'
			);
			await this.page.locator(descriptionSelector).getByRole('textbox', { name: 'Add image' }).click();
			await this.page
				.locator(descriptionSelector)
				.getByRole('textbox', { name: 'Add image' })
				.fill(processData.description);
			console.log('Description field filled successfully');
		} catch (error) {
			console.log('Error filling description field:', error);
			// Not critical, continue
		}

		// Announcement field
		try {
			const announcementSelector = await LocalizationUtils.getWorkingLocalizedSelector(
				this.page,
				'participatory_process_announcement'
			);
			await this.page.locator(announcementSelector).getByRole('textbox', { name: 'Add image' }).click();
			await this.page
				.locator(announcementSelector)
				.getByRole('textbox', { name: 'Add image' })
				.fill(processData.announcement);
			console.log('Announcement field filled successfully');
		} catch (error) {
			console.log('Error filling announcement field:', error);
			// Not critical, continue
		}
	}

	async fillDurationInfo(durationData: ProcessDurationInfo) {
		await this.page.locator('#participatory_process_start_date_date').click();
		await this.page.locator('#participatory_process_start_date_date').fill(durationData.startDate);

		await this.page.locator('#participatory_process_end_date_date').click();
		await this.page.locator('#participatory_process_end_date_date').fill(durationData.endDate);
	}

	async addImage(imagePath: string = 'tests/acceptance/e2e/tests/processes/test-assets/test.jpg') {
		await this.page.getByRole('button', { name: 'Add image' }).click();
		// Wait for the dialog to appear
		const dialog = this.page.getByRole('dialog');
		const fileInput = dialog.locator('input[type="file"][name="participatory_process[hero_image]"]');
		await fileInput.setInputFiles(imagePath);
		await this.page.getByRole('button', { name: 'Save' }).click();
	}

	async fillMetadataInfo(metadataData: ProcessMetadataInfo) {
		await this.page.getByRole('textbox', { name: 'developer_group' }).click();
		await this.page.getByRole('textbox', { name: 'developer_group' }).fill(metadataData.developerGroup);

		await this.page.getByRole('textbox', { name: 'local_area' }).click();
		await this.page.getByRole('textbox', { name: 'local_area' }).fill(metadataData.localArea);

		await this.page.getByRole('textbox', { name: 'meta_scope' }).click();
		await this.page.getByRole('textbox', { name: 'meta_scope' }).fill(metadataData.metaScope);

		await this.page.getByRole('textbox', { name: 'target' }).click();
		await this.page.getByRole('textbox', { name: 'target' }).fill(metadataData.target);

		await this.page.getByRole('textbox', { name: 'participatory_scope' }).click();
		await this.page.getByRole('textbox', { name: 'participatory_scope' }).fill(metadataData.participatoryScope);

		await this.page.getByRole('textbox', { name: 'participatory_structure' }).click();
		await this.page
			.getByRole('textbox', { name: 'participatory_structure' })
			.fill(metadataData.participatoryStructure);
	}

	// Visibility settings
	async setVisibilityToPublic() {
		const publicVisibilityRadio = this.page.getByRole('radio', { name: 'Public' });
		if (await publicVisibilityRadio.isVisible()) {
			await publicVisibilityRadio.click();
		}
	}

	async setVisibilityToPrivate() {
		const privateVisibilityRadio = this.page.getByRole('radio', { name: 'Private' });
		if (await privateVisibilityRadio.isVisible()) {
			await privateVisibilityRadio.click();
		}
	}

	// Process submission and management
	async submitProcess() {
		await this.page.locator('form.new_participatory_process button[type="submit"]').click();
	}

	async cancelProcessCreation() {
		const cancelButton = this.page.getByRole('link', { name: 'home' });
		await cancelButton.click();
	}

	async retrySubmission() {
		await this.page.getByRole('button', { name: 'Retry' }).click();
	}

	// Private process participants
	async addPrivateParticipants(emails: string[]) {
		for (const email of emails) {
			await this.page.getByRole('textbox', { name: 'Participant email' }).fill(email);
			await this.page.getByRole('button', { name: 'Add participant' }).click();
		}
	}

	// Success and error handling
	async waitForSuccessMessage() {
		await this.page.getByText('Participatory process successfully created.');
	}

	async waitForProcessErrorMessage() {
		await this.page.getByText('There was a problem creating a new participatory process.');
	}

	async expectSuccessMessage() {
		await expect(this.page.getByText('Participatory process successfully created.')).toBeVisible();
	}

	async expectErrorMessage() {
		await expect(this.page.locator('div.slug span.form-error')).toBeVisible();
	}

	async expectToBeOnProcessesAdminPage() {
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes/);
	}

	// Complete workflow methods
	async createNewProcess(processData: CompleteProcessData) {
		await this.navigateToNewProcess();
		await this.fillGeneralInfo(processData.general);
		await this.fillDurationInfo(processData.duration);
		if (processData.image) {
			await this.addImage(processData.image);
		}
		await this.fillMetadataInfo(processData.metadata);

		if (processData.visibility === 'private') {
			await this.setVisibilityToPrivate();
		} else {
			await this.setVisibilityToPublic();
		}

		await this.submitProcess();

		if (processData.visibility === 'private' && processData.privateParticipants) {
			await this.addPrivateParticipants(processData.privateParticipants);
		}
	}

	// Public method to test locale detection (for testing purposes)
	public async testLocaleDetection(): Promise<{ currentLocale: string; testSelectors: string[] }> {
		const currentLocale = LocalizationUtils.getCurrentLocale(this.page);
		const testFields = [
			'participatory_process_short_description',
			'participatory_process_description',
			'participatory_process_announcement'
		];

		const testSelectors = [];
		for (const field of testFields) {
			const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.page, field);
			testSelectors.push(selector);
		}

		return {
			currentLocale,
			testSelectors
		};
	}

	public async createTestProcess(validProcessData: CompleteProcessData) {
		await this.navigateToProcesses();
		await this.waitForLoadState('networkidle');
		await this.page.waitForTimeout(1000); // Ensure the page is fully loaded
		const isTableVisible = await this.processTable.isTableVisible();
		expect(isTableVisible).toBe(true);
		const isTableEmpty = await this.isTableEmpty();
		if (isTableVisible && !isTableEmpty) {
			return; // Skip creation if table is not empty
		}
		await this.navigateToNewProcess();

		// Verify we're on new process page
		const isOnNewProcessPage = await this.isOnNewProcessPage();
		expect(isOnNewProcessPage).toBe(true);

		// Fill general information
		await this.fillGeneralInfo(validProcessData.general);

		// Fill duration information
		await this.fillDurationInfo(validProcessData.duration);

		// Add image if provided
		if (validProcessData.image) {
			await this.addImage(validProcessData.image);
		}

		// Fill metadata information
		await this.fillMetadataInfo(validProcessData.metadata);

		// Set public visibility
		await this.setVisibilityToPublic();

		// Submit process
		await this.submitProcess();

		// Verify success message
		await this.expectSuccessMessage();

		// Verify navigation to process edit page (indicates successful creation)
		await expect(this.getPage()).toHaveURL(/\/admin\/participatory_processes\/.*/);
	}
}

// Type definitions for better type safety
export interface ProcessGeneralInfo {
	title: string;
	subtitle: string;
	orderPosition: number;
	urlSlug: string;
	shortDescription: string;
	hashtag: string;
	description: string;
	announcement: string;
}

export interface ProcessDurationInfo {
	startDate: string;
	endDate: string;
}

export interface ProcessMetadataInfo {
	developerGroup: string;
	localArea: string;
	metaScope: string;
	target: string;
	participatoryScope: string;
	participatoryStructure: string;
}

export interface CompleteProcessData {
	general: ProcessGeneralInfo;
	duration: ProcessDurationInfo;
	metadata: ProcessMetadataInfo;
	visibility: 'public' | 'private';
	image?: string;
	privateParticipants?: string[];
}
