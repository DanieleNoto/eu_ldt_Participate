import { Page } from '@playwright/test';

export class AdminBlockUserComponent {
	constructor(private page: Page) {}

	private get pageTitle() {
		return this.page.locator('h1.item_show__header-title');
	}

	private get blockForm() {
		return this.page.locator('form#edit_block_user_1');
	}

	private get informationText() {
		return this.page.locator('.card-section .row.column').first();
	}

	private get justificationTextarea() {
		return this.page.locator('textarea#block_user_justification');
	}

	private get justificationLabel() {
		return this.page.locator('label[for="block_user_justification"]');
	}

	private get characterCounter() {
		return this.page.locator('#block_user_justification_characters');
	}

	private get characterCounterSr() {
		return this.page.locator('#block_user_justification_characters_sr');
	}

	private get formError() {
		return this.page.locator('.form-error[role="alert"]');
	}

	private get submitButton() {
		return this.page.locator('button[type="submit"]:has-text("Block account and send justification")');
	}

	private get userIdHiddenField() {
		return this.page.locator('input#block_user_user_id');
	}

	private get hideHiddenField() {
		return this.page.locator('input#block_user_hide');
	}

	private get reportedContentSidebarLink() {
		return this.page.locator('a[href="/admin/moderations"]:has-text("Reported content")');
	}

	private get reportedParticipantsSidebarLink() {
		return this.page.locator('a[href="/admin/moderated_users"]:has-text("Reported participants")');
	}

	private get successFlashMessage() {
		return this.page.locator('.flash.success:has-text("Participant successfully blocked.")');
	}

	private get successFlashMessageText() {
		return this.page.locator('.flash.success .flash__message');
	}

	private get successFlashCloseButton() {
		return this.page.locator('.flash.success .close-button');
	}

	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	async isPageTitleVisible(): Promise<boolean> {
		return await this.pageTitle.isVisible();
	}

	async getInformationText(): Promise<string> {
		return (await this.informationText.textContent()) || '';
	}

	async isFormVisible(): Promise<boolean> {
		return await this.blockForm.isVisible();
	}

	async fillJustification(justification: string) {
		await this.justificationTextarea.fill(justification);
	}

	async getJustificationValue(): Promise<string> {
		return (await this.justificationTextarea.inputValue()) || '';
	}

	async clearJustification() {
		await this.justificationTextarea.clear();
	}

	async isJustificationRequired(): Promise<boolean> {
		return await this.justificationTextarea.getAttribute('required').then(attr => attr !== null);
	}

	async getJustificationMinLength(): Promise<number> {
		const minLength = await this.justificationTextarea.getAttribute('minlength');
		return minLength ? parseInt(minLength, 10) : 0;
	}

	async getCharacterCounterText(): Promise<string> {
		return (await this.characterCounter.textContent()) || '';
	}

	async getCharacterCounterSrText(): Promise<string> {
		return (await this.characterCounterSr.textContent()) || '';
	}

	async isFormErrorVisible(): Promise<boolean> {
		return await this.formError.isVisible();
	}

	async getFormErrorText(): Promise<string> {
		return (await this.formError.textContent()) || '';
	}

	async clickSubmitButton() {
		await this.submitButton.click();
	}

	async isSubmitButtonVisible(): Promise<boolean> {
		return await this.submitButton.isVisible();
	}

	async isSubmitButtonEnabled(): Promise<boolean> {
		return await this.submitButton.isEnabled();
	}

	async getUserId(): Promise<string> {
		return (await this.userIdHiddenField.getAttribute('value')) || '';
	}

	async getHideValue(): Promise<string> {
		return (await this.hideHiddenField.getAttribute('value')) || '';
	}

	async getFormAction(): Promise<string> {
		return (await this.blockForm.getAttribute('action')) || '';
	}

	async getFormMethod(): Promise<string> {
		return (await this.blockForm.getAttribute('method')) || '';
	}

	async clickReportedContentSidebar() {
		await this.reportedContentSidebarLink.click();
	}

	async clickReportedParticipantsSidebar() {
		await this.reportedParticipantsSidebarLink.click();
	}

	async isReportedParticipantsSidebarActive(): Promise<boolean> {
		return await this.reportedParticipantsSidebarLink
			.locator('..')
			.getAttribute('class')
			.then(classes => classes?.includes('is-active') || false);
	}

	async getReportedContentCount(): Promise<string> {
		const counter = this.reportedContentSidebarLink.locator('.component-counter');
		return (await counter.textContent()) || '';
	}

	async getReportedParticipantsCount(): Promise<string> {
		const counter = this.reportedParticipantsSidebarLink.locator('.component-counter');
		return (await counter.textContent()) || '';
	}

	async waitForFormToLoad() {
		await this.blockForm.waitFor({ state: 'visible' });
		await this.justificationTextarea.waitFor({ state: 'visible' });
	}

	async waitForPageToLoad() {
		await this.pageTitle.waitFor({ state: 'visible' });
		await this.blockForm.waitFor({ state: 'visible' });
	}

	async submitBlockForm(justification?: string): Promise<void> {
		if (justification) {
			await this.fillJustification(justification);
		}
		await this.clickSubmitButton();
		await this.page.waitForLoadState('networkidle');
	}

	async isParticipantBlockedSuccessfully(): Promise<boolean> {
		try {
			await this.successFlashMessage.waitFor({ state: 'visible', timeout: 5000 });
			return await this.successFlashMessage.isVisible();
		} catch {
			return false;
		}
	}

	async getSuccessFlashMessage(): Promise<string> {
		return (await this.successFlashMessage.textContent()) || '';
	}

	async validateForm(): Promise<boolean> {
		const justificationValue = await this.getJustificationValue();
		const minLength = await this.getJustificationMinLength();

		return justificationValue.length >= minLength;
	}

	async isFormValid(): Promise<boolean> {
		const isErrorVisible = await this.isFormErrorVisible();
		return !isErrorVisible;
	}

	async getFormData(): Promise<{
		userId: string;
		hide: string;
		justification: string;
		action: string;
		method: string;
	}> {
		return {
			userId: await this.getUserId(),
			hide: await this.getHideValue(),
			justification: await this.getJustificationValue(),
			action: await this.getFormAction(),
			method: await this.getFormMethod()
		};
	}

	async hasRequiredFieldIndicator(): Promise<boolean> {
		const requiredIndicator = this.justificationLabel.locator('.label-required');
		return await requiredIndicator.isVisible();
	}

	async getRequiredFieldText(): Promise<string> {
		const requiredIndicator = this.justificationLabel.locator('.sr-only');
		return (await requiredIndicator.textContent()) || '';
	}

	async triggerValidation() {
		await this.justificationTextarea.blur();
	}

	async waitForCharacterCounter() {
		await this.characterCounter.waitFor({ state: 'visible' });
	}

	async getUserNameFromTitle(): Promise<string> {
		const title = await this.getPageTitle();
		const match = title.match(/Block User (.+)/);
		return match ? match[1] : '';
	}
}
