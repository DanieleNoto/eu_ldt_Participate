import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { ConfigureAccountabilityComponentPage } from '@pages/pages/admin/processes/detail/components/ConfigureAccountabilityComponentPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows City Administrators to configure which components are available in the process, such as Use Case embed, Blog, Debates, Meetings, Page, Proposal, and Survey.
 *
 * User Story: As a City Administrator, I want to configure the components available in the process so that I can ensure the right tools are available for citizen engagement.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 */
test.describe('[PAR-PPM003] – Configure available components', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let configureAccountabilityComponentPage: ConfigureAccountabilityComponentPage;
	let componentPage: ComponentsPage;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		componentPage = new ComponentsPage(page);
		configureAccountabilityComponentPage = new ConfigureAccountabilityComponentPage(page);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow admin to edit a component of process', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
			});
			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await processAdminPage.expectToBeOnProcessesAdminPage();
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User: Selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.processTable.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Configure Components" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToComponents();
			});
			await test.step('6. System: Displays a list of existing components (if any) and provides options to add, edit, or remove components.Displays a list of available components (e.g., Use Case embed, Blog, Debates, Meetings, Page, Proposal, Survey).', async () => {
				await componentPage.expectToBeOnComponentsPage();
			});
			await test.step('7. User: Selects the components to enable for this process.', async () => {
				await componentPage.configureFirstComponent();
			});
			await test.step('8. User: Configure the selected component properly', async () => {
				await configureAccountabilityComponentPage.expectToBeOnEditComponentPage();
				await configureAccountabilityComponentPage.fillName('Updated Test Component');
			});
			await test.step('9. User: Clicks on "Save Configuration" to confirm the selected components.', async () => {
				await configureAccountabilityComponentPage.submitForm();
			});
			await test.step('10. System: Validates the selection for completeness and consistency.', async () => {
				await componentPage.waitForLoadState('networkidle');
				await componentPage.expectToBeOnComponentsPage();
			});
			await test.step('11. System: Saves the configuration and updates the process accordingly.', async () => {
				await componentPage.expectComponentExists('Test Component');
			});
			await test.step('12. System:Notifies the City Administrator that the components have been successfully configured.', async () => {
				await componentPage.expectSuccessFlashMessage('The component was updated successfully.');
			});
			await test.step('Result.', async () => {
				await componentPage.expectComponentExists('Updated Test Component');
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should show validation fail when edit component with wrong field', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
			});
			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await processAdminPage.expectToBeOnProcessesAdminPage();
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});
			await test.step('3. User: Selects the process that want to update', async () => {
				// Click edit on the first process in the table
				await processAdminPage.processTable.editFirstProcess();
				await processAdminPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});
			await test.step('5. User: Navigates to the "Configure Components" section within the process management interface.', async () => {
				await updateProcessAdminPage.navigateToComponents();
			});
			await test.step('6. System: Displays a list of existing components (if any) and provides options to add, edit, or remove components.Displays a list of available components (e.g., Use Case embed, Blog, Debates, Meetings, Page, Proposal, Survey).', async () => {
				await componentPage.expectToBeOnComponentsPage();
			});
			await test.step('7. User: Selects the components to enable for this process.', async () => {
				await componentPage.configureFirstComponent();
			});
			await test.step('8. User: Configure the selected component properly', async () => {
				await configureAccountabilityComponentPage.expectToBeOnEditComponentPage();
				await configureAccountabilityComponentPage.fillName('');
			});
			await test.step('9. User: Clicks on "Save Configuration" to confirm the selected components.', async () => {
				await configureAccountabilityComponentPage.submitForm();
			});
			await test.step('10.1. System: Detects that the selected component configuration is incomplete or inconsistent.', async () => {
				await configureAccountabilityComponentPage.waitForLoadState('networkidle');
				await configureAccountabilityComponentPage.expectErrorFlashMessage(
					'There was a problem updating this component.'
				);
			});
			await test.step('10.2. System: Highlights the fields with errors and provides appropriate error messages.', async () => {
				await configureAccountabilityComponentPage.expectFormValidationError();
			});
			await test.step('10.3. User: Corrects the invalid configuration.', async () => {
				await configureAccountabilityComponentPage.expectToBeOnEditComponentPage();
				await configureAccountabilityComponentPage.fillName('Valid Component Name');
			});
			await test.step('10.4. User: Clicks on "Save Configuration" again.', async () => {
				await configureAccountabilityComponentPage.submitForm();
			});
			await test.step('Result.', async () => {
				await componentPage.waitForLoadState('networkidle');
				await componentPage.expectToBeOnComponentsPage();
				await componentPage.expectSuccessFlashMessage('The component was updated successfully.');
				await componentPage.expectComponentExists('Valid Component Name');
			});
		});
	});
});
