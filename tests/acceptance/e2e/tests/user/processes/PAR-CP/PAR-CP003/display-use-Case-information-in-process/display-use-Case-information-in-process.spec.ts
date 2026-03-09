/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Simone Bianchelli
 */

import { test, expect } from '@fixtures/keycloak-test';
import { CookieBarComponent } from '@pages/components/common/CookieBarComponent';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { UseCaseScenariosPage } from '@pages/pages/public/processes/UseCaseScenariosPage';

/**
 * Test suite When a process is linked to a Use Case, the system retrieves and displays information from the EU LDT Use Cases & Scenarios Tool
 * within the Process and integrates with the capabilities of EU LDT Play & Visualise for the visualisation of static images. This allows citizens to view scenario details directly.
 *
 * User Story: As a Citizen, I want to view Use Case information within a Process so that I can better understand the context and implications of the proposal.
 *
 * Requirements: PAR R8, PAR R20, PAR R6
 *
 * Prerequisites:
 * - The process is created and linked to a Use Case from the EU LDT Use Cases & Scenarios Tool.
 * - The EU LDT Use Cases & Scenarios Tool is accessible and integrated with the platform.
 * - The citizen has access to view process on the platform.
 */

test.describe('@useKeycloak [PAR-CP003] Display Use Case information in process', () => {
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let useCaseScenariosPage: UseCaseScenariosPage;

	test.beforeEach(async ({ userPage }) => {
		const cookieBar = new CookieBarComponent(userPage);
		if (await cookieBar.isCookieBarVisible()) {
			await cookieBar.acceptAllAndWait();
		}
		processesOverviewPage = new ProcessesOverviewPage(userPage);
		processDetailPage = new ProcessDetailPage(userPage);
		useCaseScenariosPage = new UseCaseScenariosPage(userPage);
	});
	test.describe('Main Flow', () => {
		test('User views Use Case information embedded in Process page', async ({ userPage }) => {
			await test.step('1. User: Navigates to the process section and selects a specific process that is linked to a Use Case.', async () => {
				await processesOverviewPage.navigateToProcessesOverview();
				await processesOverviewPage.applyDateFilterAndEnsureGridLoaded('all');
				await processesOverviewPage.checkProcessVisibility('Update Test0');
				await processesOverviewPage.navigateToProcess('Update Test0', 'test');
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});

			await test.step('2. System: Displays the Process in a clear and organized format.', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
				await processDetailPage.verifyProcessDescriptionSection();
				await processDetailPage.collectAndVerifyParticipatoryMenuItems();
			});

			await test.step('3. User: The user selects "LDT Use Case Scenarios"', async () => {
				await processDetailPage.clickOnMenuItem('LDT Use Case Scenarios');
				await expect(userPage).toHaveURL(/\/use_case_scenarios/);
			});

			await test.step('4. System: Verify scenarios are displayed', async () => {
				await useCaseScenariosPage.verifyScenariosDisplayed();
			});

			await test.step('5. User: The user selects a specific scenario', async () => {
				await useCaseScenariosPage.selectScenarioByTitle('zzzzz');
			});

			await test.step('6. System: Embed Use Case information exposed by Use Case & Scenario manager inside the Process page', async () => {
				await useCaseScenariosPage.verifyUseCaseContentEmbedded();
			});

			await test.step('7. System: Display a small, non-intrusive label ("Created by AI" disclaimer) adjacent to the content.', async () => {
				await useCaseScenariosPage.verifyAiLabel();
			});

			await test.step('8. User: Reviews the Process content along with the Use Case information.', async () => {
				await useCaseScenariosPage.verifyProcessContentWithUseCase();
			});

			await test.step('9. User: Access additional information or interactive elements related to the Use Case (e.g., expanded visual data or scenario metrics)', async () => {
				await useCaseScenariosPage.verifyBasicInformationSection();
				await useCaseScenariosPage.getRealtimeMonitoringInfo();
				await useCaseScenariosPage.getChartOptions();
				await useCaseScenariosPage.verifyTabsPresent(['Overview', 'Code']);
				await useCaseScenariosPage.verifyInferenceResponseSection();
			});

			await test.step('Result: Log success', async () => {
				console.log('Use Case information successfully displayed within the Process page');
			});
		});
	});
});
