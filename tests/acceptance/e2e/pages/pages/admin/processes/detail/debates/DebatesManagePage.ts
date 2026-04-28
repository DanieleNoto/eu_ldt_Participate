/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Page } from '@playwright/test';
import { BaseAdminPage } from '../../../BaseAdminPage';
import { NewDebatesComponentPage } from '../components/NewDebatesComponentPage';
import { ComponentsPage } from '../components/ComponentsPage';
import { ProcessAdminPage } from '../../ProcessAdminPage';
import { DebatesPage } from './DebatesPage';
import { NewDebatePage } from './NewDebatePage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { DebatesOverviewPage } from '@pages/pages/public/processes/DebatesOverviewPage';
import { DebateDetailPage } from '@pages/pages/user/processes/DebateDetailPage';

/**
 * Page Object Model for Debates management functionality.
 * Contains helper functions for setting up debates components and debates for testing.
 */
export class DebatesManagePage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	async setupTestDebates(
		processSlug: string,
		processEditUrl: string,
		processAdminPage: ProcessAdminPage,
		componentsPage: ComponentsPage,
		debatesPage: DebatesPage,
		newDebatePage: NewDebatePage
	): Promise<{ componentName: string; debateName: string }> {
		await processAdminPage.getPage().goto(processEditUrl);
		await processAdminPage.getPage().waitForLoadState('load');

		// Navigate to components page
		await componentsPage.sidebarProcessDetail.navigateToComponents();
		await componentsPage.waitForComponentsPageLoad();
		await componentsPage.expectToBeOnComponentsPage();

		const componentName = 'Debate';

		const newDebatesComponentPage = new NewDebatesComponentPage(processAdminPage.getPage());

		await newDebatesComponentPage.navigateToNewDebatesComponent(processSlug);

		await newDebatesComponentPage.expectToBeOnNewDebatesComponentPage();

		await newDebatesComponentPage.fillNewDebatesComponentForm({
			name: componentName,
			globalAnnouncement: 'Global announcement for debates component',
			stepAnnouncement: 'Step announcement for debates component',
			commentsEnabled: true,
			commentsBlocked: false,
			commentsMaxLength: 1000
		});

		await newDebatesComponentPage.submitForm();
		console.log('Debates component created using NewDebatesComponentPage');

		await componentsPage.sidebarProcessDetail.navigateToComponents();
		await componentsPage.waitForComponentsPageLoad();
		await componentsPage.expectToBeOnComponentsPage();

		//  Publish the component
		await componentsPage.publishComponent(componentName);
		console.log('Debates component successfully published');

		await componentsPage.manageComponent(componentName);
		await processAdminPage.getPage().waitForLoadState('load');

		// Create new debate
		await debatesPage.createNewDebate();

		// Verify we're on the debate creation page
		const isOnCreationPage = await this.isOnDebateCreationPage();
		if (!isOnCreationPage) {
			throw new Error('Not on debate creation page');
		}

		await newDebatePage.waitForPageReady();

		// Create the debate
		const debateTimestamp = Date.now().toString();
		const testDebateData = {
			title: `Test Debate ${debateTimestamp}`,
			description: 'This is a test debate created for export data testing purposes.',
			instructions: 'Please participate respectfully in this debate discussion.',
			informationUpdates: 'Updates will be posted regularly about this debate.'
		};

		await newDebatePage.fillTitle(testDebateData.title);
		await newDebatePage.fillDescription(testDebateData.description);
		await newDebatePage.fillInstructions(testDebateData.instructions);
		await newDebatePage.fillInformationUpdates(testDebateData.informationUpdates);

		await newDebatePage.setDebateTypeOpen();
		await newDebatePage.setCommentsEnabled(true);
		await newDebatePage.clickCreateDebate();

		await processAdminPage.getPage().waitForLoadState('load');
		console.log('Setup completed - debate created');

		return {
			componentName,
			debateName: testDebateData.title
		};
	}

	async isOnDebateCreationPage(): Promise<boolean> {
		const url = this.page.url();
		return /\/admin\/participatory_processes\/.*\/components\/.*\/manage\/debates\/new/.test(url);
	}

	/**
	 * Setup user responses to the debate created in the test process
	 * Uses public navigation (not admin) to simulate real user behavior
	 */
	async setupUserDebateResponses(browser: any, processSlug: string): Promise<void> {
		const userContext = await browser.newContext({
			storageState: STORAGE_STATE.USER
		});
		const userPage = await userContext.newPage();

		try {
			await ensureLoggedIn(userPage, 'USER');

			const publicProcessUrl = `/processes/${processSlug}`;
			await userPage.goto(publicProcessUrl);
			await userPage.waitForLoadState('load');

			const processDetailPage = new ProcessDetailPage(userPage);
			const debatesOverviewPage = new DebatesOverviewPage(userPage);
			const debateDetailPage = new DebateDetailPage(userPage);

			await processDetailPage.expectToBeOnProcessDetailPage();
			await processDetailPage.navigateToDebatesPage();

			await debatesOverviewPage.expectToBeOnDebatesOverviewPage();
			await debatesOverviewPage.clickDebateByIndex(0);

			await debateDetailPage.expectToBeOnDebateDetailPage();

			const userComment =
				'This is a very important topic for our community. I believe we should prioritize this area.';

			try {
				await debateDetailPage.clickCommentButton();
				await debateDetailPage.fillComment(userComment);
				await debateDetailPage.submitComment();

				await debateDetailPage.expectCommentToBeVisible(userComment);
			} catch (error) {
				console.log(`Could not add comment. Error: ${error instanceof Error ? error.message : error}`);
			}

			const commentsVisible = await debateDetailPage.getExistingCommentsCount();
			console.log(`Total comments visible: ${commentsVisible}`);

			if (commentsVisible >= 1) {
				console.log('User debate response setup completed successfully');
			} else {
				console.log('Expected 1 comment, but none found');
			}
		} finally {
			await userPage.close();
			await userContext.close();
		}
	}
}
