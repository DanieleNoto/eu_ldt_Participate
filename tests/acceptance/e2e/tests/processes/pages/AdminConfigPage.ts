import { Page, expect } from '@playwright/test';
import path from 'path';

export class AdminConfigPage {
	constructor(private page: Page) {}

	// Public getter for page access in tests
	getPage(): Page {
		return this.page;
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

	// URL checking methods
	async getCurrentUrl(): Promise<string> {
		return this.page.url();
	}

	async waitForUrl(pattern: RegExp, timeout: number = 30000): Promise<void> {
		await this.page.waitForURL(pattern, { timeout });
	}

	async expectUrl(pattern: RegExp): Promise<void> {
		await expect(this.page).toHaveURL(pattern);
	}

	// Text and element checking methods
	async getTextBySelector(text: string): Promise<any> {
		return this.page.getByText(text);
	}

	async waitForTimeout(ms: number): Promise<void> {
		await this.page.waitForTimeout(ms);
	}

	async getLocator(selector: string, options?: any): Promise<any> {
		return this.page.locator(selector, options);
	}

	async navigateToHomePage() {
		await this.page.goto('http://localhost:3000/');
	}

	async clickLoginLink() {
		await this.page.getByLabel('Log in', { exact: true }).click();
	}

	async navigateToSignIn() {
		await this.page.goto('http://localhost:3000/users/sign_in');
	}

	async acceptCookies() {
		await this.page.getByRole('button', { name: 'Accept all' }).click();
	}

	async loginAsAdmin(email: string = 'admin@admin.com', password: string = 'decidim123456789') {
		await this.page.getByRole('textbox', { name: 'Email Required field' }).click();
		await this.page.getByRole('textbox', { name: 'Email Required field' }).fill(email);
		await this.page.getByRole('textbox', { name: 'Password Required field' }).click();
		await this.page.getByRole('textbox', { name: 'Password Required field' }).fill(password);
		await this.page.getByRole('button', { name: 'Log in' }).click();
	}

	async navigateToAdminDashboard() {
		await this.page.goto('http://localhost:3000/');
		await this.page.getByRole('link', { name: 'Admin dashboard' }).click();
	}

	async navigateToProcesses() {
		await this.page.getByRole('link', { name: 'Processes' }).click();
		await this.page.goto('http://localhost:3000/admin/participatory_processes');
	}
	async navigateToNewProcess() {
		await this.page.getByRole('link', { name: 'New process' }).click();
		await this.page.goto('http://localhost:3000/admin/participatory_processes/new');
	}

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

		await this.page.getByRole('textbox', { name: 'Short description' }).click();
		await this.page.getByRole('textbox', { name: 'Short description' }).fill(processData.shortDescription);

		await this.page.locator('#panel-title div').filter({ hasText: 'Hashtag' }).nth(1).click();
		await this.page.getByRole('textbox', { name: 'Hashtag' }).fill(processData.hashtag);

		await this.page.getByRole('textbox', { name: 'Description', exact: true }).click();
		await this.page.getByRole('textbox', { name: 'Description', exact: true }).fill(processData.description);

		await this.page.getByRole('textbox', { name: 'Announcement' }).click();
		await this.page.getByRole('textbox', { name: 'Announcement' }).fill(processData.announcement);
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

	async submitProcess() {
		await this.page.getByRole('button', { name: 'Create' }).click();
	}

	async cancelProcessCreation() {
		const cancelButton = this.page.getByRole('link', { name: 'home' });
		await cancelButton.click();
	}

	async waitForSuccessMessage() {
		await this.page.getByText('Participatory process successfully created.');
	}

	async waitForErrorMessage() {
		await this.page.getByText('There was a problem creating a new participatory process.');
	}

	async getValidationErrors(): Promise<string[]> {
		const validationSelectors = '.form-error';
		await this.page.waitForTimeout(1000); // Wait for validation to appear
		const errors = await this.page.locator(validationSelectors).all();
		const errorTexts: string[] = [];

		for (const error of errors) {
			const text = await error.textContent();
			if (text) {
				errorTexts.push(text.trim());
			}
		}

		return errorTexts;
	}

	async retrySubmission() {
		await this.page.getByRole('button', { name: 'Retry' }).click();
	}

	async addPrivateParticipants(emails: string[]) {
		for (const email of emails) {
			await this.page.getByRole('textbox', { name: 'Participant email' }).fill(email);
			await this.page.getByRole('button', { name: 'Add participant' }).click();
		}
	}

	async isSessionExpired(): Promise<boolean> {
		return (
			(await this.page.locator('text=Session expired').isVisible()) ||
			(await this.page.url().includes('/users/sign_in'))
		);
	}

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
