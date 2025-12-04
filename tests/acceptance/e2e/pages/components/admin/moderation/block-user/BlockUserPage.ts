/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Page } from '@playwright/test';
import { BlockUserBreadcrumbComponent } from './BlockUserBreadcrumbComponent';
import { BlockUserSidebarComponent } from './BlockUserSidebarComponent';
import { BlockUserPageHeaderComponent } from './BlockUserPageHeaderComponent';
import { BlockUserFormComponent } from './BlockUserFormComponent';
import { BlockUserSubmitActionsComponent } from './BlockUserSubmitActionsComponent';
import { FlashMessageComponent } from '../process/FlashMessageComponent';

/**
 * Main page component for the Block User page
 * Orchestrates all the individual UI components
 */
export class BlockUserPage {
	readonly page: Page;
	readonly breadcrumb: BlockUserBreadcrumbComponent;
	readonly sidebar: BlockUserSidebarComponent;
	readonly pageHeader: BlockUserPageHeaderComponent;
	readonly form: BlockUserFormComponent;
	readonly submitActions: BlockUserSubmitActionsComponent;
	readonly flashMessage: FlashMessageComponent;

	constructor(page: Page) {
		this.page = page;
		this.breadcrumb = new BlockUserBreadcrumbComponent(page);
		this.sidebar = new BlockUserSidebarComponent(page);
		this.pageHeader = new BlockUserPageHeaderComponent(page);
		this.form = new BlockUserFormComponent(page);
		this.submitActions = new BlockUserSubmitActionsComponent(page);
		this.flashMessage = new FlashMessageComponent(page);
	}

	/**
	 * Navigate to the block user page for a specific user
	 */
	async navigateTo(userId: string): Promise<void> {
		await this.page.goto(`/admin/moderated_users/${userId}/user_block/new`);
		await this.waitForPageLoad();
	}

	/**
	 * Wait for the page to fully load
	 */
	async waitForPageLoad(): Promise<void> {
		await this.pageHeader.isVisible();
		await this.form.waitForFormToLoad();
		await this.submitActions.waitForSubmitReady();
	}

	/**
	 * Verify the page is displayed correctly
	 */
	async verifyPageStructure(): Promise<{
		breadcrumbVisible: boolean;
		sidebarVisible: boolean;
		headerVisible: boolean;
		formVisible: boolean;
		submitActionsVisible: boolean;
	}> {
		return {
			breadcrumbVisible: await this.breadcrumb.isVisible(),
			sidebarVisible: await this.sidebar.isVisible(),
			headerVisible: await this.pageHeader.isVisible(),
			formVisible: await this.form.isVisible(),
			submitActionsVisible: await this.submitActions.isVisible()
		};
	}

	/**
	 * Get comprehensive page information
	 */
	async getPageInformation(): Promise<{
		title: string;
		userName: string;
		informationText: string;
		sidebarData: {
			reportedContentCount: string;
			reportedParticipantsCount: string;
			reportedContentActive: boolean;
			reportedParticipantsActive: boolean;
		};
		formData: {
			userId: string;
			hide: string;
			justification: string;
			action: string;
			method: string;
			minLength: number;
			isRequired: boolean;
		};
	}> {
		const title = await this.pageHeader.getTitleText();
		const userName = await this.pageHeader.getUserNameFromTitle();
		const informationText = await this.form.getInformationText();
		const sidebarData = await this.sidebar.getSidebarData();
		const formData = await this.form.getFormData();

		return {
			title,
			userName,
			informationText,
			sidebarData,
			formData
		};
	}

	/**
	 * Fill out and submit the block user form
	 */
	async blockUser(justification: string): Promise<void> {
		await this.form.fillJustification(justification);
		await this.validateForm();
		await this.submitActions.clickSubmit();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Fill justification without submitting
	 */
	async fillJustification(justification: string): Promise<void> {
		await this.form.fillJustification(justification);
	}

	/**
	 * Clear the justification field
	 */
	async clearJustification(): Promise<void> {
		await this.form.clearJustification();
	}

	/**
	 * Get the current justification value
	 */
	async getJustificationValue(): Promise<string> {
		return await this.form.getJustificationValue();
	}

	/**
	 * Validate the form
	 */
	async validateForm(): Promise<boolean> {
		return await this.form.validateForm();
	}

	/**
	 * Check if form is valid
	 */
	async isFormValid(): Promise<boolean> {
		return await this.form.isFormValid();
	}

	/**
	 * Trigger form validation
	 */
	async triggerValidation(): Promise<void> {
		await this.form.triggerValidation();
	}

	/**
	 * Submit the form
	 */
	async submitForm(): Promise<void> {
		await this.submitActions.clickSubmit();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Check if user was blocked successfully
	 */
	async isUserBlockedSuccessfully(): Promise<boolean> {
		try {
			await this.flashMessage.waitForSuccessMessage(5000);
			return await this.flashMessage.isSuccessMessageVisible();
		} catch {
			return false;
		}
	}

	/**
	 * Get success message text
	 */
	async getSuccessMessage(): Promise<string> {
		if (await this.flashMessage.isSuccessMessageVisible()) {
			return await this.flashMessage.getSuccessMessageText();
		}
		return '';
	}

	/**
	 * Get form error message if present
	 */
	async getFormErrorMessage(): Promise<string> {
		if (await this.form.isFormErrorVisible()) {
			return await this.form.getFormErrorText();
		}
		return '';
	}

	/**
	 * Get character counter information
	 */
	async getCharacterCounterInfo(): Promise<{
		counterText: string;
		srCounterText: string;
		minLength: number;
		currentLength: number;
	}> {
		const counterText = await this.form.getCharacterCounterText();
		const srCounterText = await this.form.getCharacterCounterSrText();
		const minLength = await this.form.getJustificationMinLength();
		const currentValue = await this.form.getJustificationValue();

		return {
			counterText,
			srCounterText,
			minLength,
			currentLength: currentValue.length
		};
	}

	/**
	 * Navigate back to reported participants
	 */
	async navigateToReportedParticipants(): Promise<void> {
		await this.sidebar.clickReportedParticipants();
	}

	/**
	 * Navigate to reported content
	 */
	async navigateToReportedContent(): Promise<void> {
		await this.sidebar.clickReportedContent();
	}

	/**
	 * Navigate home via breadcrumb
	 */
	async navigateHomeViaBreadcrumb(): Promise<void> {
		await this.breadcrumb.clickHome();
	}

	/**
	 * Get user name from page title
	 */
	async getUserNameFromTitle(): Promise<string> {
		return await this.pageHeader.getUserNameFromTitle();
	}

	/**
	 * Check if page has flash message
	 */
	async hasFlashMessage(): Promise<boolean> {
		return await this.flashMessage.isFlashMessageVisible();
	}

	/**
	 * Get flash message if present
	 */
	async getFlashMessage(): Promise<string> {
		if (await this.hasFlashMessage()) {
			return await this.flashMessage.getFlashMessageText();
		}
		return '';
	}

	/**
	 * Get flash message type
	 */
	async getFlashMessageType(): Promise<'success' | 'error' | 'warning' | 'info' | 'none'> {
		return await this.flashMessage.getFlashMessageType();
	}

	/**
	 * Dismiss flash message if present
	 */
	async dismissFlashMessage(): Promise<void> {
		if (await this.hasFlashMessage()) {
			await this.flashMessage.dismissFlashMessage();
		}
	}

	/**
	 * Verify form requirements and validation
	 */
	async verifyFormRequirements(): Promise<{
		isRequired: boolean;
		hasMinLength: boolean;
		hasRequiredIndicator: boolean;
		hasCharacterCounter: boolean;
		hasInformationText: boolean;
	}> {
		return {
			isRequired: await this.form.isJustificationRequired(),
			hasMinLength: (await this.form.getJustificationMinLength()) > 0,
			hasRequiredIndicator: await this.form.hasRequiredFieldIndicator(),
			hasCharacterCounter: await this.form.characterCounter.isVisible(),
			hasInformationText: await this.form.hasInformationText()
		};
	}

	/**
	 * Complete block user workflow with validation
	 */
	async completeBlockUserWorkflow(justification: string): Promise<{
		success: boolean;
		errorMessage?: string;
		successMessage?: string;
	}> {
		// Fill justification
		await this.fillJustification(justification);

		// Validate form
		const isValid = await this.validateForm();
		if (!isValid) {
			const errorMessage = await this.getFormErrorMessage();
			return { success: false, errorMessage };
		}

		// Submit form
		await this.submitForm();

		// Check result
		const isSuccess = await this.isUserBlockedSuccessfully();
		if (isSuccess) {
			const successMessage = await this.getSuccessMessage();
			return { success: true, successMessage };
		} else {
			const errorMessage = (await this.getFormErrorMessage()) || (await this.getFlashMessage());
			return { success: false, errorMessage };
		}
	}
}
