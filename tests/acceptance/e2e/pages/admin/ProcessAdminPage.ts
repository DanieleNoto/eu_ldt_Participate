import { Page, expect } from '@playwright/test';
import { ADMIN_ROUTES } from '@utils/routes';
import { BaseAdminPage } from '../admin/BaseAdminPage';

export class ProcessAdminPage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	// Public getter for page access in tests
	getPage(): Page {
		return this.page;
	}

	// Navigation specific to processes
	async navigateToProcesses() {
		await this.page.getByRole('link', { name: 'Processes' }).click();
		await this.page.goto(ADMIN_ROUTES.participatoryProcesses.pattern);
	}

	async navigateToNewProcess() {
		await this.page.getByRole('link', { name: 'New process' }).click();
		await this.page.goto(ADMIN_ROUTES.newParticipatoryProcesses.pattern);
	}

	// Form element getters for test assertions
	async getSubtitleTextbox() {
		return this.page.getByRole('textbox', { name: 'subtitle' });
	}

	async getOrderPositionSpinbutton() {
		return this.page.getByRole('spinbutton', { name: 'Order position Required field' });
	}

	async getTitleTextbox() {
		return this.page.getByRole('textbox', { name: 'title', exact: true });
	}

	// Process creation form methods
	async fillGeneralInfo(processData: ProcessGeneralInfo) {
		await this.page.getByRole('textbox', { name: 'title', exact: true }).click();
		await this.page.getByRole('textbox', { name: 'title', exact: true }).fill(processData.title);

		await this.page.getByRole('textbox', { name: 'subtitle' }).click();
		await this.page.getByRole('textbox', { name: 'subtitle' }).fill(processData.subtitle);

		await this.page.getByRole('spinbutton', { name: 'Order position Required field' }).click();
		await this.page
			.getByRole('spinbutton', { name: 'Order position Required field' })
			.fill(processData.orderPosition.toString());

		await this.page.getByRole('textbox', { name: 'URL slug Required field URL' }).click();
		await this.page.getByRole('textbox', { name: 'URL slug Required field URL' }).fill(processData.urlSlug);

		await this.page
			.locator('#participatory_process_short_description_en')
			.getByRole('textbox', { name: 'Add image' })
			.click();
		await this.page
			.locator('#participatory_process_short_description_en')
			.getByRole('textbox', { name: 'Add image' })
			.fill(processData.shortDescription);

		await this.page.locator('#panel-title div').filter({ hasText: 'Hashtag' }).nth(1).click();
		await this.page.getByRole('textbox', { name: 'Hashtag' }).fill(processData.hashtag);

		await this.page
			.locator('#participatory_process_description_en')
			.getByRole('textbox', { name: 'Add image' })
			.click();
		await this.page
			.locator('#participatory_process_description_en')
			.getByRole('textbox', { name: 'Add image' })
			.fill(processData.description);

		await this.page
			.locator('#participatory_process_announcement_en')
			.getByRole('textbox', { name: 'Add image' })
			.click();
		await this.page
			.locator('#participatory_process_announcement_en')
			.getByRole('textbox', { name: 'Add image' })
			.fill(processData.announcement);
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
		await this.page.getByRole('button', { name: 'Create' }).click();
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
		await expect(this.page.getByText('There was a problem creating a new participatory process.')).toBeVisible();
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

	async setupProcessManagement() {
		await this.performAdminLogin();
		await this.navigateToProcesses();
	}
}

// Type definitions for better type safety (moved from original file)
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
