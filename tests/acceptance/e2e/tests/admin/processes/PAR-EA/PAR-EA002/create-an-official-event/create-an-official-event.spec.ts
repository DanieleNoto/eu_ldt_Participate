import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { ManagePageComponentPage } from '@pages/pages/admin/processes/detail/components/ManagePageComponentPage';
import { FormMeetingPage } from '@pages/pages/admin/processes/detail/meetings/FormMeetingPage';
import { MeetingsPage } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows City Administrator to create new official events with specific details including time, duration, location, attendee access, and calendar association.
 *
 * User Story: As a City Administrator, I want to create an event specifying the start time, duration, location (or online), attendee access settings (public, registered citizens, invitation-only), and associate it with a calendar so that citizens can attend.
 *
 * Requirements: PAR R14a
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The City Administrator has permissions to create surveys.
 * - The specific process has Meeting component configured
 * - If The storage system for Docker images is available and configured
 * - For Jitsi Videoconference the city must install
 */
test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await ensureLoggedIn(page, 'ADMIN');
});

test.describe('[PAR-EA002] – Create an official event', () => {
    test.use({ storageState: STORAGE_STATE.ADMIN });
    let adminHomePage: AdminHomePage;
    let processAdminPage: ProcessAdminPage;
    let meetingsPage: MeetingsPage;
    let formMeetingPage: FormMeetingPage;
    let componentsPage: ComponentsPage;

    test.beforeEach(async ({ page }) => {
        adminHomePage = new AdminHomePage(page);
        processAdminPage = new ProcessAdminPage(page);
        meetingsPage = new MeetingsPage(page);
        formMeetingPage = new FormMeetingPage(page);
        componentsPage = new ComponentsPage(page);
        await adminHomePage.navigateToAdminHomePage();
    });
    test.describe('Main Flow', () => {
        test('should allow admin to create an official event', async () => {
            // Variables to store updated values for verification
            let newTitle: string;
            let newDescription: string;
            let address: string;
            let location: string;
            let newOnlineMeetingUrl: string;
            let newLocationHints: string;
            let beforeMeetingCount: number;
            let newRegistrationType: 'on_this_platform' | 'registration_disabled' | 'on_different_platform';

            await test.step('1. Admin: Navigates to the "Processes" section.', async () => {
                await processAdminPage.navigateToProcesses();
                await processAdminPage.getPage().waitForLoadState('networkidle');

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

            await test.step('5. Admin: Navigates to the "Components->Meetings” section in the admin panel.', async () => {
                // Navigate to Components tab/section
                await componentsPage.sidebarProcessDetail.navigateToComponents();
                const currentUrl = componentsPage.getPage().url();
                expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components/);

            });

            await test.step('6. System: Displays the "Meetings" section in the admin panel.', async () => {
                // Verify meetings page is loaded and visible
                const meetingsLink = componentsPage.getComponentLinkByName('Meetings');
                expect(meetingsLink).not.toBeNull();
                await meetingsLink.click();
                await componentsPage.getPage().waitForLoadState('networkidle');
                await meetingsPage.verifyMeetingsPageVisible();
                // Check if there are meetings available
                beforeMeetingCount = await meetingsPage.getMeetingCount();
                expect(beforeMeetingCount).toBeGreaterThan(0);
                await componentsPage.getPage().screenshot({ path: 'test-results/screenshots/EA002/MeetingsList.png', fullPage: true });
            });

            // Define required fields for validation testing
            const meetingTypes = [{ type: "online" }, { type: "in person" }];

            for (const { type } of meetingTypes) {
                
                await test.step(`7. Admin: Clicks on "New Meeting" to start the process of creating a ${type} meeting`, async () => {
                    await meetingsPage.clickNewMeeting();
                    await meetingsPage.getPage().waitForLoadState('networkidle');
                });
                await test.step('8. System: Displays the "New Meeting" form, prompting the user to fill in the meeting details.', async () => {
                    // Verify we're on the new meeting form page
                    const currentUrl = meetingsPage.getPage().url();
                    expect(currentUrl).toMatch(/\/admin.*\/meetings\/new/);
                    await expect(meetingsPage.getPage().locator('text=Create meeting')).toBeVisible();
                });                      
                
                await test.step('9. Admin: Create meeting details: Title, Description, Type (in person or online), Start Time, Duration, Location, Registration type, Online Meeting URL (only for online meeting)', async () => {
                        // Update meeting title
                        
                if (type === 'online') {
                        await formMeetingPage.selectMeetingType('online');
                        newTitle = `New Meeting Title - Type: ${type}`;
                        await formMeetingPage.fillTitle(newTitle);                        
                        newOnlineMeetingUrl = 'https://meet.jit.si/updated-meeting-room';
                        await formMeetingPage.fillOnlineMeetingUrl(newOnlineMeetingUrl);                        

                } else if (type === 'in person') {
                        await formMeetingPage.selectMeetingType('in_person');
                        newTitle = `New Meeting Title - Type: ${type}`;
                        await formMeetingPage.fillTitle(newTitle);
                        newLocationHints = 'Meeting password: 123456';
                        await formMeetingPage.fillLocationHints(newLocationHints);
                        address = '123 Main St, Cityville';
                        await formMeetingPage.fillAddress(address);
                        location = 'City Hall Conference Room';
                        await formMeetingPage.fillLocation(location);
                }                         
                // Create meeting description
                newDescription = `Create meeting description with new details - ${type}`;
                await formMeetingPage.fillDescriptionField(newDescription, 'en');
                // First Calendar (start)
				// Start date: tomorrow
				const startDate = new Date();
				startDate.setDate(startDate.getDate() + 1);
				await formMeetingPage.selectCustomDate(startDate, 0, 0);
				const hour = startDate.getHours();
				const minute = startDate.getMinutes();
				await formMeetingPage.selectCustomTime(0, hour, minute);

                // Second Calendar (end)
				const endDate = new Date();
				endDate.setDate(endDate.getDate() + 21);
                const endHour = hour + 2; 
				await formMeetingPage.selectCustomDate(endDate, 1, 1);
                await formMeetingPage.selectCustomTime(1, endHour, minute);
                // Set registration type to "on this platform"
                newRegistrationType = 'on_this_platform';
                await formMeetingPage.selectRegistrationType(newRegistrationType);
                                // Enable comments
                await formMeetingPage.setCommentsEnabled(true);
                //await formMeetingPage.getPage().screenshot({ path: `test-results/screenshots/EA002/NewMeetingForm-${type}.png`, fullPage: true });
                });
                await test.step('10. Admin: Clicks on "Create Event" to create the event.', async () => {
                        // Click the Update button to save changes
                        await formMeetingPage.createMeeting();
                        await formMeetingPage.getPage().screenshot({ path: `test-results/screenshots/EA002/CreatedNewMeetingForm-${type}.png`, fullPage: true });
                });
            
                await test.step('11. System: Validates the event details for completeness and correctness.', async () => {
                        // Check if there are validation errors
                        const hasValidationErrors = await formMeetingPage.hasValidationErrors();
                        expect(hasValidationErrors).toBe(false);
                });
            
                await test.step('12. System: Saves the event and makes it available for citizens to view.', async () => {
                        // Verify we're redirected back to meetings list or meeting details
                        const currentUrl = await formMeetingPage.getCurrentUrl();
                        expect(currentUrl).toMatch(/\/admin.*\/meetings/);
                });
            
                await test.step('13. System: Notifies the City Administrator that the event has been successfully created.', async () => {
                        // Check for success notification/message
                        const successMessage = formMeetingPage
                            .getPage()
                            .locator('.flash.success, .alert.success, [role="alert"]');
                        await expect(successMessage).toBeVisible();
                });
            
                await test.step('Result.', async () => {
                        // Final verification: navigate back to meetings and verify our meeting was created
                        if (!(await meetingsPage.isOnMeetingsPage())) {
                            await meetingsPage.navigateToMeetings();
                        }
                    
                        // Verify the meetings page loads successfully
                        await meetingsPage.waitForMeetingsLoad();
                                       
                        // Find and edit the meeting we just updated by title to verify changes were saved
                        const meetingIndex = await meetingsPage.findMeetingByTitle(newTitle);
                        expect(meetingIndex).toBeGreaterThan(0);
                });
            };
            // Verify the total number of meetings has increased by 2, then clean up
            const afterMeetingCount = await meetingsPage.getMeetingCount();
            expect(afterMeetingCount).toBe(beforeMeetingCount + 2);
            await componentsPage.deleteComponentIfExists(/New Meeting Title - Type: online/i);
            await componentsPage.deleteComponentIfExists(/New Meeting Title - Type: in person/i);
        });
    });
    
    test.describe('Alternative Flows', () => {
        test('should show validation errors when required fields are missing', async () => {
            //////////////////
            const expectedErrors = [
              { fieldName: 'meeting[type_of_meeting]', message: 'There is an error in this field.' },
              { fieldName: 'meeting[start_time]', message: 'There is an error in this field.' },
              { fieldName: 'meeting[end_time]', message: 'There is an error in this field.' },
              { fieldName: 'meeting[registration_type]', message: 'There is an error in this field.' }
            ];
            /////////////////////
            let beforeMeetingCount: number;	
            // Navigate to Processes
            await processAdminPage.navigateToProcesses();
            await processAdminPage.getPage().waitForLoadState('networkidle');
            const hasProcesses = await processAdminPage.processTable.hasProcesses();
            expect(hasProcesses).toBe(true);

            // Click edit on the first process in the table
            await processAdminPage.editFirstProcess();
            await processAdminPage.getPage().waitForLoadState('networkidle');

            // Navigate to Components tab/section
            await componentsPage.sidebarProcessDetail.navigateToComponents();

            // Verify meetings page is loaded and visible
            const meetingsLink = componentsPage.getComponentLinkByName('Meetings');
            expect(meetingsLink).not.toBeNull();
            await meetingsLink.click();
            await componentsPage.getPage().waitForLoadState('networkidle');
            await meetingsPage.verifyMeetingsPageVisible();
            beforeMeetingCount = await meetingsPage.getMeetingCount();
            expect(beforeMeetingCount).toBeGreaterThan(0);

            await componentsPage.getPage().screenshot({ path: 'test-results/screenshots/EA002/MeetingsList.png', fullPage: true });            
            
            
            const meetingTypes = [{ type: "online" }, { type: "in person" }, { type: "hybrid" }];

            for (const { type } of meetingTypes) {

                await meetingsPage.clickNewMeeting();
                await meetingsPage.getPage().waitForLoadState('networkidle');
                await formMeetingPage.createMeeting();
                expect(await formMeetingPage.hasValidationErrors()).toBe(true);
                const errorsFirstStep = await formMeetingPage.getValidationErrors();                
                expect(errorsFirstStep.length).toBe(4);
                /////////
                const actualErrors = await meetingsPage.getValidationErrorsDetailed();
                expect(actualErrors.length).toBe(expectedErrors.length);
                for (const expected of expectedErrors) {
                  const match = actualErrors.find(
                    err => err.fieldName === expected.fieldName && err.message === expected.message
                  );
                    if (match) {
                      console.log(`✅ Campo "${expected.fieldName}" ha generato l'errore previsto: "${expected.message}"`);
                    } else {
                      console.warn(`❌ Campo "${expected.fieldName}" NON ha generato l'errore previsto: "${expected.message}"`);
                    }
                  expect(match).toBeTruthy(); // Verifica che l'errore sia presente
                }

                /////////
                await formMeetingPage.getPage().screenshot({ path: `test-results/screenshots/EA002/CreatedNewMeetingForm1 - ${type}.png`, fullPage: true });
				
                const startDate = new Date();
				startDate.setDate(startDate.getDate() + 1);
				await formMeetingPage.selectCustomDate(startDate, 0, 0);
				const hour = startDate.getHours();
				const minute = startDate.getMinutes();
				await formMeetingPage.selectCustomTime(0, hour, minute);
				const endDate = new Date();
				endDate.setDate(endDate.getDate() + 21);
                const endHour = hour + 2; 
				await formMeetingPage.selectCustomDate(endDate, 1, 1);
                await formMeetingPage.selectCustomTime(1, endHour, minute);
                
                // Set registration type to "on this platform"
                const newRegistrationType = 'on_this_platform';
                await formMeetingPage.selectRegistrationType(newRegistrationType);                

                if (type === 'online') {
                    await formMeetingPage.selectMeetingType('online');
                    const newOnlineMeetingUrlError = 'aaa';
                    await formMeetingPage.fillOnlineMeetingUrl(newOnlineMeetingUrlError);
                    await formMeetingPage.createMeeting();
                    const flashIcon = formMeetingPage.getPage().locator('.flash__icon svg[aria-hidden="true"]');
                    await expect(flashIcon).toBeVisible();                    
                    await formMeetingPage.getPage().screenshot({ path: `test-results/screenshots/EA002/CreatedNewMeetingForm2 - ${type}.png`, fullPage: true });                    
                    
                    expect(await formMeetingPage.hasValidationErrors()).toBe(true);
                    const errorsSecondStep = await formMeetingPage.getValidationErrors();                
                    expect(errorsSecondStep.length).toBe(3);
                    expect(errorsSecondStep).toContain('Must be valid URL');



                    //console.log(`✅ Campo "${errorsSecondStep}`);                    
                    // const newTitleAF = `New Meeting Title - Type: ${type}`;
                    // await formMeetingPage.fillTitle(newTitleAF);
                    const newOnlineMeetingUrl = 'https://meet.jit.si/updated-meeting-room';
                    await formMeetingPage.fillOnlineMeetingUrl(newOnlineMeetingUrl);
                    const newDescriptionAF = `Create meeting description with new details - ${type}`;
                    await formMeetingPage.fillDescriptionField(newDescriptionAF, 'en');
                    await formMeetingPage.createMeeting();
                    const flashIcon4Title = formMeetingPage.getPage().locator('.flash__icon svg[aria-hidden="true"]');
                    await expect(flashIcon4Title).toBeVisible();                    
                    await formMeetingPage.getPage().screenshot({ path: `test-results/screenshots/EA002/CreatedNewMeeting4Title- ${type}.png`, fullPage: true });                    
                    
                    expect(await formMeetingPage.hasValidationErrors()).toBe(true);
                    const errors4Title = await formMeetingPage.getValidationErrors();                
                    //expect(errorsSecondStep.length).toBe(3);
                    console.log(`✅ titleField "${errors4Title}`);

                    const newTitleAF = `New Meeting Title - Type: ${type}`;
                    await formMeetingPage.fillTitle(newTitleAF);
                    await formMeetingPage.createMeeting();
                    
                } else if (type === 'in person' || type === 'hybrid') {
                    if (type === 'in person') { await formMeetingPage.selectMeetingType('in_person'); };
                    if (type === 'hybrid') { await formMeetingPage.selectMeetingType('hybrid'); };
                    await formMeetingPage.createMeeting();                    
                    await formMeetingPage.getPage().screenshot({ path: `test-results/screenshots/EA002/CreatedNewMeetingForm2 - ${type}.png`, fullPage: true });                    
                    expect(await formMeetingPage.hasValidationErrors()).toBe(true);
                    const errorsSecondStep = await formMeetingPage.getValidationErrors();                
                    expect(errorsSecondStep.length).toBe(4);
                    const flashIcon = formMeetingPage.getPage().locator('.flash__icon svg[aria-hidden="true"]');
                    await expect(flashIcon).toBeVisible();                    
                    const newTitleAF = `New Meeting Title - Type: ${type}`;
                    await formMeetingPage.fillTitle(newTitleAF);
                    const address = '123 Main St, Cityville';
                    await formMeetingPage.fillAddress(address);
                    const location = 'City Hall Conference Room';
                    await formMeetingPage.fillLocation(location);
                    const newDescriptionAF = `Create meeting description with new details - ${type}`;
                    await formMeetingPage.fillDescriptionField(newDescriptionAF, 'en');                    
                }
                await formMeetingPage.createMeeting();
                await formMeetingPage.getPage().screenshot({ path: `test-results/screenshots/EA002/CreatedNewMeetingForm3 - ${type}.png`, fullPage: true });
                const successMessage = formMeetingPage.getPage().locator('.flash.success, .alert.success, [role="alert"]');
                await expect(successMessage).toBeVisible();                
                await meetingsPage.getPage().waitForLoadState('networkidle');
			}
            const afterMeetingCount = await meetingsPage.getMeetingCount();
            expect(afterMeetingCount).toBe(beforeMeetingCount + 3);
            await componentsPage.deleteComponentIfExists(/New Meeting Title - Type: online/i);
            await componentsPage.deleteComponentIfExists(/New Meeting Title - Type: in person/i);
            await componentsPage.deleteComponentIfExists(/New Meeting Title - Type: hybrid/i);
		});
    });
});