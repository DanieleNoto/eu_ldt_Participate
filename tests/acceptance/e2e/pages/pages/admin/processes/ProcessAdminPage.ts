import { Page, expect } from '@playwright/test';
import { LocalizationUtils } from '../../../../utils/localization.utils';
import { AdminProcessBreadcrumbComponent } from '../../../components/admin/process/AdminProcessBreadcrumbComponent';
import { AdminProcessFiltersComponent } from '../../../components/admin/process/AdminProcessFiltersComponent';
import { AdminProcessTableComponent } from '../../../components/admin/process/AdminProcessTableComponent';
import { AdminProcessTabNavigationComponent } from '../../../components/admin/process/AdminProcessTabNavigationComponent';
import { BaseAdminPage } from '../BaseAdminPage';
import { NewAdminPage } from './detail/admins/NewAdminPage';
import { ParticipatoryProcessAdminsPage } from './detail/admins/ParticipatoryProcessAdminsPage';
import { NewPrivateParticipantFormPage } from './detail/private-participants/NewParticipantsPage';
import { PrivateParticipantsPage } from './detail/private-participants/PrivateParticipantsPage';
import { UpdateProcessAdminPage } from './detail/UpdateProcessAdminPage';

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

	// Page state and checks using components
	async isOnProcessesPage() {
		return (
			(await this.processBreadcrumb.isBreadcrumbVisible()) &&
			(await this.processTabNavigation.isProcessesTabActive())
		);
	}

	async isOnNewProcessPage() {
		const currentUrl = this.page.url();
		return currentUrl.includes('/admin/participatory_processes/new');
	}

	// Process management using table component

	async editProcess(processName: string) {
		await this.processTable.editProcess(processName);
	}

	async editFirstProcess() {
		await this.processTable.editFirstProcess();
	}

	// Process filtering and search using filters component
	async searchProcesses(searchTerm: string) {
		await this.processFilters.searchFor(searchTerm);
		await this.processTable.waitForTableLoad();
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

			// Target the ProseMirror editor content area within the editor container
			const editorSelector = `${shortDescriptionSelector} .editor-container .ProseMirror`;
			await this.page.locator(editorSelector).click();
			await this.page.locator(editorSelector).fill(processData.shortDescription);
			console.log('Short description field filled successfully');
		} catch (error) {
			console.log('Error filling short description field:', error);
			// Try fallback method
			try {
				const shortDescriptionSelector = await LocalizationUtils.getWorkingLocalizedSelector(
					this.page,
					'participatory_process_short_description'
				);
				await this.page.locator(shortDescriptionSelector).getByRole('textbox').click();
				await this.page
					.locator(shortDescriptionSelector)
					.getByRole('textbox')
					.fill(processData.shortDescription);
				console.log('Short description field filled successfully (fallback)');
			} catch (fallbackError) {
				console.log('Both methods failed for short description field, continuing...', fallbackError);
			}
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

			// Target the ProseMirror editor content area within the editor container
			const editorSelector = `${descriptionSelector} .editor-container .ProseMirror`;
			await this.page.locator(editorSelector).click();
			await this.page.locator(editorSelector).fill(processData.description);
			console.log('Description field filled successfully');
		} catch (error) {
			console.log('Error filling description field:', error);
			// Try fallback method
			try {
				const descriptionSelector = await LocalizationUtils.getWorkingLocalizedSelector(
					this.page,
					'participatory_process_description'
				);
				await this.page.locator(descriptionSelector).getByRole('textbox').click();
				await this.page.locator(descriptionSelector).getByRole('textbox').fill(processData.description);
				console.log('Description field filled successfully (fallback)');
			} catch (fallbackError) {
				console.log('Both methods failed for description field, continuing...', fallbackError);
			}
		}
		// Announcement field
		try {
			const announcementSelector = await LocalizationUtils.getWorkingLocalizedSelector(
				this.page,
				'participatory_process_announcement'
			);

			// Target the ProseMirror editor content area within the editor container
			const editorSelector = `${announcementSelector} .editor-container .ProseMirror`;
			await this.page.locator(editorSelector).click();
			await this.page.locator(editorSelector).fill(processData.announcement);
			console.log('Announcement field filled successfully');
		} catch (error) {
			console.log('Error filling announcement field:', error);
			// Try fallback method
			try {
				const announcementSelector = await LocalizationUtils.getWorkingLocalizedSelector(
					this.page,
					'participatory_process_announcement'
				);
				await this.page.locator(announcementSelector).getByRole('textbox').click();
				await this.page.locator(announcementSelector).getByRole('textbox').fill(processData.announcement);
				console.log('Announcement field filled successfully (fallback)');
			} catch (fallbackError) {
				console.log('Both methods failed for announcement field, continuing...', fallbackError);
			}
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
		const publicVisibilityRadio = this.page.getByText('Private process');
		if ((await publicVisibilityRadio.isVisible()) && (await publicVisibilityRadio.isChecked())) {
			await publicVisibilityRadio.click();
		}
	}

	async setVisibilityToPrivate() {
		const privateVisibilityRadio = this.page.getByText('Private process');
		if ((await privateVisibilityRadio.isVisible()) && !(await privateVisibilityRadio.isChecked())) {
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

	// Success and error handling

	async expectSuccessMessage() {
		await expect(this.page.getByText('Participatory process successfully created.')).toBeVisible();
	}

	async expectErrorMessage() {
		await expect(this.page.locator('div.slug span.form-error')).toBeVisible();
	}

	async expectToBeOnProcessesAdminPage() {
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes/);
	}

	public async createTestProcess(validProcessData: CompleteProcessData, isPrivateProcess: boolean = false) {
		await this.navigateToProcesses();
		await this.waitForLoadState('networkidle');
		await this.page.waitForTimeout(1000); // Ensure the page is fully loaded
		const hasPrivateProcess = await this.hasPrivateProcess();
		if (!isPrivateProcess || (isPrivateProcess && hasPrivateProcess)) {
			const isTableVisible = await this.processTable.isTableVisible();
			expect(isTableVisible).toBe(true);
			const isTableEmpty = await this.isTableEmpty();
			if (isTableVisible && !isTableEmpty) {
				return; // Skip creation if table is not empty
			}
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

		if (isPrivateProcess) {
			// Set private visibility
			await this.setVisibilityToPrivate();
		} else {
			// Set public visibility
			await this.setVisibilityToPublic();
		}
		// Submit process
		await this.submitProcess();

		// Verify success message
		await this.expectSuccessMessage();

		// Verify navigation to process edit page (indicates successful creation)
		await expect(this.getPage()).toHaveURL(/\/admin\/participatory_processes\/.*/);
		if (isPrivateProcess) {
			await this.createPrivateParticipants();
			await this.createPrivateAdmins();
		}
	}
	async hasPrivateProcess(): Promise<boolean> {
		const rows = await this.processTable.getRows();
		for (const row of rows) {
			const visibility = await this.processTable.getVisibility(row);
			if (visibility === 'Private') {
				return true;
			}
		}
		return false;
	}

	async createPrivateParticipants() {
		await this.navigateToProcesses();
		await this.processTable.clickFirstPrivateProcess();
		await this.getPage().waitForLoadState('networkidle');
		const updateProcessAdminPage = new UpdateProcessAdminPage(this.page);
		await updateProcessAdminPage.navigateToPrivateParticipants();
		const privateParticipantsPage = new PrivateParticipantsPage(this.page);
		await privateParticipantsPage.clickNewPrivateUser();
		const newPrivateParticipantFormPage = new NewPrivateParticipantFormPage(this.page);
		await newPrivateParticipantFormPage.fillName('Test User 1');
		await newPrivateParticipantFormPage.fillEmail('test-privateuser1@example.com');
		await newPrivateParticipantFormPage.submitForm();
		await privateParticipantsPage.expectParticipantIsInTable('Test User 1', 'test-privateuser1@example.com');

		await privateParticipantsPage.clickNewPrivateUser();
		await newPrivateParticipantFormPage.fillName('Test User 2');
		await newPrivateParticipantFormPage.fillEmail('test-privateuser2@example.com');
		await newPrivateParticipantFormPage.submitForm();
		await privateParticipantsPage.expectParticipantIsInTable('Test User 2', 'test-privateuser2@example.com');

		await privateParticipantsPage.clickNewPrivateUser();
		await newPrivateParticipantFormPage.fillName('Test User 3');
		await newPrivateParticipantFormPage.fillEmail('test-privateuser3@example.com');
		await newPrivateParticipantFormPage.submitForm();
		await privateParticipantsPage.expectParticipantIsInTable('Test User 3', 'test-privateuser3@example.com');

		await privateParticipantsPage.clickNewPrivateUser();
		await newPrivateParticipantFormPage.fillName('Test User 4');
		await newPrivateParticipantFormPage.fillEmail('test-privateuser4@example.com');
		await newPrivateParticipantFormPage.submitForm();
		await privateParticipantsPage.expectParticipantIsInTable('Test User 4', 'test-privateuser4@example.com');

		await privateParticipantsPage.clickNewPrivateUser();
		await newPrivateParticipantFormPage.fillName('Test User 5');
		await newPrivateParticipantFormPage.fillEmail('test-privateuser5@example.com');
		await newPrivateParticipantFormPage.submitForm();
		await privateParticipantsPage.expectParticipantIsInTable('Test User 5', 'test-privateuser5@example.com');

		await this.navigateToProcesses();
	}
	async createPrivateAdmins() {
		await this.navigateToProcesses();
		await this.processTable.clickFirstPrivateProcess();
		await this.getPage().waitForLoadState('networkidle');
		const updateProcessAdminPage = new UpdateProcessAdminPage(this.page);
		await updateProcessAdminPage.navigateToProcessAdmins();
		const processAdminsPage = new ParticipatoryProcessAdminsPage(this.page);
		await processAdminsPage.clickNewAdminButton();
		const newAdminPage = new NewAdminPage(this.page);
		await newAdminPage.fillName('Test Admin 1');
		await newAdminPage.fillEmail('test-privateadmin1@example.com');
		await newAdminPage.selectRole('admin');
		await newAdminPage.submitForm();
		await processAdminsPage.expectAdminIsInTable('Test Admin 1', 'test-privateadmin1@example.com');

		await processAdminsPage.clickNewAdminButton();
		await newAdminPage.fillName('Test Admin 2');
		await newAdminPage.fillEmail('test-privateadmin2@example.com');
		await newAdminPage.selectRole('admin');
		await newAdminPage.submitForm();
		await processAdminsPage.expectAdminIsInTable('Test Admin 2', 'test-privateadmin2@example.com');

		await processAdminsPage.clickNewAdminButton();
		await newAdminPage.fillName('Test Admin 3');
		await newAdminPage.fillEmail('test-privateadmin3@example.com');
		await newAdminPage.selectRole('admin');
		await newAdminPage.submitForm();
		await processAdminsPage.expectAdminIsInTable('Test Admin 3', 'test-privateadmin3@example.com');

		await processAdminsPage.clickNewAdminButton();
		await newAdminPage.fillName('Test Admin 4');
		await newAdminPage.fillEmail('test-privateadmin4@example.com');
		await newAdminPage.selectRole('admin');
		await newAdminPage.submitForm();
		await processAdminsPage.expectAdminIsInTable('Test Admin 4', 'test-privateadmin4@example.com');

		await processAdminsPage.clickNewAdminButton();
		await newAdminPage.fillName('Test Admin 5');
		await newAdminPage.fillEmail('test-privateadmin5@example.com');
		await newAdminPage.selectRole('admin');
		await newAdminPage.submitForm();
		await processAdminsPage.expectAdminIsInTable('Test Admin 5', 'test-privateadmin5@example.com');

		await this.navigateToProcesses();
	}

	// Process Update Methods
	async getFirstProcessName(): Promise<string> {
		return await this.processTable.getFirstProcessName();
	}

	async selectProcessForEdit(processName: string): Promise<void> {
		await this.editProcess(processName);
	}
	async waitForEditFormToLoad(): Promise<void> {
		await this.page.waitForLoadState('networkidle');

		// Wait for the edit form to be present using the exact form class from HTML
		try {
			await this.page.waitForSelector('form.edit_participatory_process', { state: 'visible', timeout: 30000 });
		} catch (error) {
			console.log("Edit form not found, checking if we're on the correct page");
			console.log('Current URL:', this.page.url());
			throw new Error('Process edit form not found. Current URL: ' + this.page.url());
		}

		// Wait for essential form fields to be present
		await this.page.waitForSelector('input[name*="title"], input[id*="title"]', { timeout: 30000 });
	}

	async isOnProcessEditPage(): Promise<boolean> {
		const currentUrl = this.page.url();
		return currentUrl.includes('/admin/participatory_processes/') && currentUrl.includes('/edit');
	}

	async getCurrentTitleValue(): Promise<string> {
		const titleField = await this.getTitleTextbox();
		return await titleField.inputValue();
	}

	async getCurrentSubtitleValue(): Promise<string> {
		const subtitleField = await this.getSubtitleTextbox();
		return await subtitleField.inputValue();
	}

	async updateGeneralInfo(processData: ProcessGeneralInfo): Promise<void> {
		console.log('Updating general info fields...');

		// Update title field
		if (processData.title) {
			try {
				const titleField = await this.getTitleTextbox();
				await titleField.click();
				await titleField.fill(processData.title);
				console.log('Title field updated successfully');
			} catch (error) {
				console.log('Error updating title field:', error);
				throw error;
			}
		}

		// Update subtitle field
		if (processData.subtitle) {
			try {
				const subtitleField = await this.getSubtitleTextbox();
				await subtitleField.click();
				await subtitleField.fill(processData.subtitle);
				console.log('Subtitle field updated successfully');
			} catch (error) {
				console.log('Error updating subtitle field:', error);
				throw error;
			}
		}

		// Update order position field - handle gracefully
		if (processData.orderPosition !== undefined && processData.orderPosition !== 0) {
			try {
				const orderPositionField = await this.getOrderPositionSpinbutton();
				if (await orderPositionField.isVisible({ timeout: 5000 })) {
					await orderPositionField.click();
					await orderPositionField.fill(processData.orderPosition.toString());
					console.log('Order position field updated successfully');
				} else {
					console.log('Order position field not visible, skipping...');
				}
			} catch (error) {
				console.log('Order position field not found or not fillable, continuing...', error);
			}
		}

		// Update URL slug field
		if (processData.urlSlug) {
			try {
				await this.page.locator('#participatory_process_slug').click();
				await this.page.locator('#participatory_process_slug').fill(processData.urlSlug);
				console.log('URL slug field updated successfully');
			} catch (error) {
				console.log('Error updating URL slug field:', error);
				throw error;
			}
		}

		// Update hashtag field
		if (processData.hashtag) {
			try {
				await this.page.getByRole('textbox', { name: 'Hashtag' }).fill(processData.hashtag);
				console.log('Hashtag field updated successfully');
			} catch (error) {
				console.log('Error updating hashtag field:', error);
				// Not critical, continue
			}
		}
		// Update short description field using the proper editor structure
		if (processData.shortDescription) {
			try {
				const shortDescriptionSelector = await LocalizationUtils.getWorkingLocalizedSelector(
					this.page,
					'participatory_process_short_description'
				);

				// Target the ProseMirror editor content area within the editor container
				const editorSelector = `${shortDescriptionSelector} .editor-container .ProseMirror`;
				await this.page.locator(editorSelector).click();
				await this.page.locator(editorSelector).fill(processData.shortDescription);
				console.log('Short description field updated successfully');
			} catch (error) {
				console.log('Error updating short description field:', error);
				// Try fallback method with textbox role
				try {
					const shortDescriptionSelector = await LocalizationUtils.getWorkingLocalizedSelector(
						this.page,
						'participatory_process_short_description'
					);
					await this.page.locator(shortDescriptionSelector).getByRole('textbox').click();
					await this.page
						.locator(shortDescriptionSelector)
						.getByRole('textbox')
						.fill(processData.shortDescription);
					console.log('Short description field updated successfully (fallback method)');
				} catch (fallbackError) {
					console.log('Both methods failed for short description field, continuing...', fallbackError);
				}
			}
		}
		// Update description field using the proper editor structure
		if (processData.description) {
			try {
				const descriptionSelector = await LocalizationUtils.getWorkingLocalizedSelector(
					this.page,
					'participatory_process_description'
				);

				// Target the ProseMirror editor content area within the editor container
				const editorSelector = `${descriptionSelector} .editor-container .ProseMirror`;
				await this.page.locator(editorSelector).click();
				await this.page.locator(editorSelector).fill(processData.description);
				console.log('Description field updated successfully');
			} catch (error) {
				console.log('Error updating description field:', error);
				// Try fallback method with textbox role
				try {
					const descriptionSelector = await LocalizationUtils.getWorkingLocalizedSelector(
						this.page,
						'participatory_process_description'
					);
					await this.page.locator(descriptionSelector).getByRole('textbox').click();
					await this.page.locator(descriptionSelector).getByRole('textbox').fill(processData.description);
					console.log('Description field updated successfully (fallback method)');
				} catch (fallbackError) {
					console.log('Both methods failed for description field, continuing...', fallbackError);
				}
			}
		}
		// Update announcement field using the proper editor structure
		if (processData.announcement) {
			try {
				const announcementSelector = await LocalizationUtils.getWorkingLocalizedSelector(
					this.page,
					'participatory_process_announcement'
				);

				// Target the ProseMirror editor content area within the editor container
				const editorSelector = `${announcementSelector} .editor-container .ProseMirror`;
				await this.page.locator(editorSelector).click();
				await this.page.locator(editorSelector).fill(processData.announcement);
				console.log('Announcement field updated successfully');
			} catch (error) {
				console.log('Error updating announcement field:', error);
				// Try fallback method with textbox role
				try {
					const announcementSelector = await LocalizationUtils.getWorkingLocalizedSelector(
						this.page,
						'participatory_process_announcement'
					);
					await this.page.locator(announcementSelector).getByRole('textbox').click();
					await this.page.locator(announcementSelector).getByRole('textbox').fill(processData.announcement);
					console.log('Announcement field updated successfully (fallback method)');
				} catch (fallbackError) {
					console.log('Both methods failed for announcement field, continuing...', fallbackError);
				}
			}
		}
	}

	async updateDurationInfo(durationData: ProcessDurationInfo): Promise<void> {
		if (durationData.startDate) {
			await this.page.locator('#participatory_process_start_date_date').click();
			await this.page.locator('#participatory_process_start_date_date').fill(durationData.startDate);
		}

		if (durationData.endDate) {
			await this.page.locator('#participatory_process_end_date_date').click();
			await this.page.locator('#participatory_process_end_date_date').fill(durationData.endDate);
		}
	}

	async updateImage(imagePath: string = 'tests/acceptance/e2e/tests/processes/test-assets/test.jpg'): Promise<void> {
		await this.page.getByRole('button', { name: 'Add image' }).click();
		// Wait for the dialog to appear
		const dialog = this.page.getByRole('dialog');
		const fileInput = dialog.locator('input[type="file"][name="participatory_process[hero_image]"]');
		await fileInput.setInputFiles(imagePath);
		await this.page.getByRole('button', { name: 'Save' }).click();
	}

	async updateMetadataInfo(metadataData: ProcessMetadataInfo): Promise<void> {
		if (metadataData.developerGroup) {
			await this.page.getByRole('textbox', { name: 'developer_group' }).click();
			await this.page.getByRole('textbox', { name: 'developer_group' }).fill(metadataData.developerGroup);
		}

		if (metadataData.localArea) {
			await this.page.getByRole('textbox', { name: 'local_area' }).click();
			await this.page.getByRole('textbox', { name: 'local_area' }).fill(metadataData.localArea);
		}

		if (metadataData.metaScope) {
			await this.page.getByRole('textbox', { name: 'meta_scope' }).click();
			await this.page.getByRole('textbox', { name: 'meta_scope' }).fill(metadataData.metaScope);
		}

		if (metadataData.target) {
			await this.page.getByRole('textbox', { name: 'target' }).click();
			await this.page.getByRole('textbox', { name: 'target' }).fill(metadataData.target);
		}

		if (metadataData.participatoryScope) {
			await this.page.getByRole('textbox', { name: 'participatory_scope' }).click();
			await this.page.getByRole('textbox', { name: 'participatory_scope' }).fill(metadataData.participatoryScope);
		}

		if (metadataData.participatoryStructure) {
			await this.page.getByRole('textbox', { name: 'participatory_structure' }).click();
			await this.page
				.getByRole('textbox', { name: 'participatory_structure' })
				.fill(metadataData.participatoryStructure);
		}
	}

	async updateVisibilitySettings(visibility: 'public' | 'private'): Promise<void> {
		if (visibility === 'public') {
			await this.setVisibilityToPublic();
		} else {
			await this.setVisibilityToPrivate();
		}
	}
	async saveProcessChanges(): Promise<void> {
		// Target the Update button within the edit form more specifically
		const updateButton = this.page
			.locator('form.edit_participatory_process button[type="submit"]')
			.getByText('Update');

		// Try the specific form button first
		try {
			await updateButton.click();
			console.log('Update button clicked successfully (form-specific)');
		} catch (error) {
			console.log('Form-specific update button not found, trying generic approach');
			// Fallback to generic update button
			const genericUpdateButton = this.page.getByRole('button', { name: 'Update' });
			await genericUpdateButton.click();
			console.log('Update button clicked successfully (generic)');
		}
	}
	async expectUpdateSuccessMessage(): Promise<void> {
		// Wait for and verify the exact update success message from the HTML
		await expect(
			this.page.locator('.flash.success').getByText('Participatory process successfully updated.')
		).toBeVisible({ timeout: 10000 });
	}

	async updateProcessTitle(title: string): Promise<void> {
		const titleField = await this.getTitleTextbox();
		await titleField.click();
		await titleField.fill(title);
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
