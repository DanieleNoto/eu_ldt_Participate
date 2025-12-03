/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Page } from '@playwright/test';
import { AdminNavigationComponent } from '../../../components/admin/AdminNavigationComponent';
import { AdminTitleBarComponent } from '../../../components/admin/AdminTitleBarComponent';
import { TemplatesBreadcrumbComponent } from '../../../components/admin/templates/TemplatesBreadcrumbComponent';
import { TemplatesSidebarComponent } from '../../../components/admin/templates/TemplatesSidebarComponent';
import { QuestionnaireTemplatesListComponent } from '../../../components/admin/templates/QuestionnaireTemplatesListComponent';
import { FlashMessageComponent } from '../../../components/admin/FlashMessageComponent';

/**
 * Page object for the Questionnaire Templates administration page.
 * Combines all template-related components for comprehensive page interaction.
 */
export class QuestionnaireTemplatesPage {
	// Component instances
	public readonly navigation: AdminNavigationComponent;
	public readonly titleBar: AdminTitleBarComponent;
	public readonly breadcrumb: TemplatesBreadcrumbComponent;
	public readonly sidebar: TemplatesSidebarComponent;
	public readonly templatesList: QuestionnaireTemplatesListComponent;
	public readonly flashMessage: FlashMessageComponent;

	constructor(private page: Page) {
		this.navigation = new AdminNavigationComponent(page);
		this.titleBar = new AdminTitleBarComponent(page);
		this.breadcrumb = new TemplatesBreadcrumbComponent(page);
		this.sidebar = new TemplatesSidebarComponent(page);
		this.templatesList = new QuestionnaireTemplatesListComponent(page);
		this.flashMessage = new FlashMessageComponent(page);
	}

	// Navigation methods
	async navigateToPage(): Promise<void> {
		await this.navigation.navigateToTemplates();
	}

	async navigateToNewTemplate(): Promise<void> {
		await this.templatesList.clickNewTemplate();
	}

	// Page verification methods
	async isPageLoaded(): Promise<boolean> {
		const navigationLoaded = await this.navigation.isNavigationVisible();
		const titleBarLoaded = await this.titleBar.isTitleBarVisible();
		const breadcrumbLoaded = await this.breadcrumb.isBreadcrumbFullyLoaded();
		const sidebarLoaded = await this.sidebar.isSidebarFullyLoaded();
		const listLoaded = await this.templatesList.isComponentFullyLoaded();

		return navigationLoaded && titleBarLoaded && breadcrumbLoaded && sidebarLoaded && listLoaded;
	}

	async isOnQuestionnairesSection(): Promise<boolean> {
		const questionnairesActive = await this.sidebar.isQuestionnairesActive();
		const breadcrumbPath = await this.breadcrumb.getBreadcrumbPath();

		return questionnairesActive && breadcrumbPath.includes('Questionnaires');
	}

	// Combined template operations
	async createNewTemplate(): Promise<void> {
		await this.navigateToNewTemplate();
	}

	async editTemplateByName(templateName: string): Promise<void> {
		const index = await this.templatesList.findTemplateByName(templateName);
		if (index >= 0) {
			await this.templatesList.editTemplate(index);
		} else {
			throw new Error(`Template with name "${templateName}" not found`);
		}
	}

	async duplicateTemplateByName(templateName: string): Promise<void> {
		const index = await this.templatesList.findTemplateByName(templateName);
		if (index >= 0) {
			await this.templatesList.duplicateTemplate(index);
		} else {
			throw new Error(`Template with name "${templateName}" not found`);
		}
	}

	async deleteTemplateByName(templateName: string): Promise<void> {
		const index = await this.templatesList.findTemplateByName(templateName);
		if (index >= 0) {
			await this.templatesList.deleteTemplate(index);
		} else {
			throw new Error(`Template with name "${templateName}" not found`);
		}
	}

	// Search and verification methods
	async hasTemplate(templateName: string): Promise<boolean> {
		const index = await this.templatesList.findTemplateByName(templateName);
		return index >= 0;
	}

	async getTemplateCount(): Promise<number> {
		return await this.templatesList.getTemplateCount();
	}

	// Flash message verification
	async isTemplateOperationSuccessful(): Promise<boolean> {
		return await this.flashMessage.isSuccessMessageVisible();
	}

	async getSuccessMessage(): Promise<string> {
		return await this.flashMessage.getSuccessMessageText();
	}

	async dismissSuccessMessage(): Promise<void> {
		await this.flashMessage.closeFlashMessage();
	}

	// Wait for template operations to complete with success
	async waitForTemplateCreatedSuccess(): Promise<void> {
		await this.flashMessage.waitForTemplateCreatedSuccess();
	}

	async waitForTemplateUpdatedSuccess(): Promise<void> {
		await this.flashMessage.waitForTemplateUpdatedSuccess();
	}

	// Navigation between template types
	async switchToBlockUserMessages(): Promise<void> {
		await this.sidebar.navigateToBlockUserMessages();
	}

	async switchToProposalAnswers(): Promise<void> {
		await this.sidebar.navigateToProposalAnswers();
	}

	// Wait for page to be ready
	async waitForPageToLoad(): Promise<void> {
		await this.page.waitForLoadState('networkidle');

		// Wait for key components to be visible
		await this.templatesList.isComponentFullyLoaded();
		await this.page.waitForFunction(() => this.sidebar.isSidebarVisible());
		await this.page.waitForFunction(() => this.breadcrumb.isBreadcrumbVisible());
	}

	// URL verification
	async getCurrentURL(): Promise<string> {
		return this.page.url();
	}

	async isOnQuestionnaireTemplatesURL(): Promise<boolean> {
		const url = await this.getCurrentURL();
		return url.includes('/admin/templates/questionnaire_templates');
	}
}
