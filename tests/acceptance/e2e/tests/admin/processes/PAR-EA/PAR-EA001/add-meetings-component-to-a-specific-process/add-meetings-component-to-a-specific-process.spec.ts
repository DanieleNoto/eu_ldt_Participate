import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { AddMeetingsComponentPage } from '@pages/pages/admin/processes/detail/components/meetings/AddMeetingsComponentPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows the City Administrator to add a Meetings component to a specific participatory process, enabling meetings to be organized and associated directly with the process, facilitating citizen engagement.
 *
 * User Story: As a City Administrator, I want to add a Meetings component to a specific process so that meetings can be organized and associated directly with the participatory process, allowing participants to engage in related discussions and events.
 *
 * Requirements: PAR R14, PAR R10
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The City Administrator has permissions to edit participatory processes.
 */
test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await ensureLoggedIn(page, 'ADMIN');
});

test.describe('[PAR-EA001] – Add meetings component to a specific process', () => {
    test.use({ storageState: STORAGE_STATE.ADMIN });
    let adminHomePage: AdminHomePage;
    let processAdminPage: ProcessAdminPage;
    let componentsPage: ComponentsPage;
    let addMeetingsComponentPage: AddMeetingsComponentPage;

    test.beforeEach(async ({ page }) => {
        adminHomePage = new AdminHomePage(page);
        processAdminPage = new ProcessAdminPage(page);
        componentsPage = new ComponentsPage(page);
        addMeetingsComponentPage = new AddMeetingsComponentPage(page);
        await adminHomePage.navigateToAdminHomePage();
    });
    test.describe('Main Flow', () => {
        test('should allow admin to add a Meetings component to a specific participatory process', async () => {
            const newName = `Community Meetings - adding meetings component`;
            await test.step('1. Admin: Navigates to the "Processes" section.', async () => {
                await processAdminPage.navigateToProcesses();
                await processAdminPage.getPage().waitForLoadState('networkidle');
                // Verify we're on the processes page                    
                const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
                expect(isOnProcessesPage).toBe(true);
            });

            await test.step('2. System: displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
                // Verify processes table is visible and has content
                const hasProcesses = await processAdminPage.processTable.hasProcesses();
                expect(hasProcesses).toBe(true);
            });

            await test.step('3. Admin: selects the process that want to update', async () => {
                // Click edit on the first process in the table
                await processAdminPage.editFirstProcess();
                await processAdminPage.getPage().waitForLoadState('networkidle');
            });

            await test.step('4. System: loads the selected process and displays the content in an editable form, including all existing information', async () => {
                // Verify we're on the process edit/management page
                const currentUrl = processAdminPage.getPage().url();
                expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/edit/);
            });

            await test.step('5. Admin: Navigates to the "Components" section in the admin panel.', async () => {
                // Navigate to Components tab/section
                await componentsPage.sidebarProcessDetail.navigateToComponents();
                const currentUrl = componentsPage.getPage().url();
                expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components/);
            });

            await test.step('6. Admin: Clicks on "Add Component" and select Meetings', async () => {
                // Click on "Add Component" button and select Meetings
                await componentsPage.addMeetingsComponent();
                await componentsPage.getPage().screenshot({ path: 'test-results/screenshots/EA001/AddComponent.png', fullPage: true });
            });

            await test.step('7. System: Displays the "Add Meetings Component" form, prompting the City Administrator to provide the component details.', async () => {
                // Verify we're on the new meeting form page
                const currentUrl = componentsPage.getPage().url();
                expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/new\?type=meetings/);
                await expect(componentsPage.getPage().locator('text=Add component: Meetings').first()).toBeVisible();
            });

            await test.step('8. Admin: Fills in the component details • Name: Adds a title for the Meetings component, Announcement (optional): Adds an announcement visible to participants on the .', async () => {
                // Fill in the form fields
                await addMeetingsComponentPage.fillNameEn(newName);
                await addMeetingsComponentPage.fillAnnouncementEn('Announcement visible to participants on the meeting landing page.');
                await addMeetingsComponentPage.getPage().screenshot({ path: 'test-results/screenshots/EA001/FilledFields.png', fullPage: true });
            });

            await test.step('9. Admin: Clicks on "Save Component" to add the Meetings component to the process.', async () => {
                // Submit the form
                await addMeetingsComponentPage.submitForm();
                await addMeetingsComponentPage.getPage().waitForLoadState('networkidle');
            });

            await test.step('10. System: Validates the component details for completeness and correctness.', async () => {
			    // Check if there are validation errors
		    	const hasValidationErrors = await addMeetingsComponentPage.hasValidationErrors();
		    	expect(hasValidationErrors).toBe(false);
		    });

            await test.step('11. System: Saves the Meetings component and updates the process details.', async () => {
                // Verify we're redirected back to components list
                const currentUrl = await componentsPage.getCurrentUrl();
                expect(currentUrl).toMatch(/\/admin.*\/components/);
            });

            await test.step('12. System: Notifies the City Administrator that the Meetings component has been successfully added to the process.', async () => {
                // Check for success notification/message
                const successMessage = componentsPage.getPage().locator('.flash.success, .alert.success, [role="alert"]');
                await expect(successMessage).toBeVisible();
                await componentsPage.getPage().screenshot({ path: 'test-results/screenshots/EA001/MeetingComponentAdded.png', fullPage: true });
            });

            await test.step('Result.', async () => {
                // Final verification: check the new component appears in the components list with correct type
                const row = componentsPage.getPage().getByRole('option', { name: /Community Meetings - adding meetings component/i }).first();
                await expect(row).toBeVisible();
                const typeCell = row.locator('td').nth(2);
                await expect(typeCell).toHaveText(/Meetings/i);  
                await componentsPage.deleteComponentIfExists(/Community Meetings - adding meetings component/i, 'snapshots/EA001');  
            });
        });
    });

    test.describe('Alternative Flow', () => {
        test('should show validation error when mandatory fields are blank and allow successful update after correction', async ({ page }) => {
            const newNameBlank = ``;
            const newName = `Community Meetings - adding meetings component`;
            await processAdminPage.navigateToProcesses();
            await processAdminPage.getPage().waitForLoadState('load');
            await processAdminPage.getPage().waitForLoadState('networkidle');
            await processAdminPage.editFirstProcess();
            await processAdminPage.getPage().waitForLoadState('load');            
            // Verify we're on the processes page             
            await componentsPage.sidebarProcessDetail.navigateToComponents();
            // create the component Meetings first "blank name"
            await componentsPage.getPage().waitForLoadState('networkidle');
            await componentsPage.addMeetingsComponent();
            await addMeetingsComponentPage.fillNameEn(newNameBlank);
            await addMeetingsComponentPage.getPage().screenshot({ path: 'test-results/screenshots/EA001/MissingField.png', fullPage: true });
            await addMeetingsComponentPage.fillAnnouncementEn('');
            await addMeetingsComponentPage.submitForm();
            await addMeetingsComponentPage.getPage().waitForLoadState('networkidle');
            await addMeetingsComponentPage.getPage().screenshot({ path: 'test-results/screenshots/EA001/ExpectedErrorMissingField.png', fullPage: true });
            const flashIcon = page.locator('.flash__icon svg[aria-hidden="true"]');
            await expect(flashIcon).toBeVisible();
            const errorMessage = page.locator('small.form-error.is-visible[role="alert"]', { hasText: 'cannot be blank' });
            await expect(errorMessage).toBeVisible();
            // Now fill in a lowercase name to test that validation
            await addMeetingsComponentPage.fillNameEn('lowercase')
            await addMeetingsComponentPage.getPage().screenshot({ path: 'test-results/screenshots/EA001/LowercaseField.png', fullPage: true });
            await addMeetingsComponentPage.submitForm();
            await addMeetingsComponentPage.getPage().waitForLoadState('networkidle');
            await addMeetingsComponentPage.getPage().screenshot({ path: 'test-results/screenshots/EA001/ExpectedErrorLowercaseField.png', fullPage: true });
            await expect(flashIcon).toBeVisible();
            await expect(errorMessage).toBeVisible();
            // Finally, fill in the correct name and submit
            await addMeetingsComponentPage.fillNameEn(newName);
            await addMeetingsComponentPage.fillAnnouncementEn('Announcement visible to participants on the meeting landing page.');
            await addMeetingsComponentPage.getPage().screenshot({ path: 'test-results/screenshots/EA001/ExpectedFieldFilled.png', fullPage: true });
            await addMeetingsComponentPage.submitForm();
            await addMeetingsComponentPage.getPage().waitForLoadState('networkidle');
            // Verify the component was created
            const currentUrl = await componentsPage.getCurrentUrl();
            expect(currentUrl).toMatch(/\/admin.*\/components/);            
            const successMessage = componentsPage.getPage().locator('.flash.success, .alert.success, [role="alert"]');
            await expect(successMessage).toBeVisible();
            await componentsPage.getPage().screenshot({ path: 'test-results/screenshots/EA001/MeetingComponentAdded.png', fullPage: true });
            await componentsPage.deleteComponentIfExists(/Community Meetings - adding meetings component/i, 'snapshots/EA001');
        });
    });    
});