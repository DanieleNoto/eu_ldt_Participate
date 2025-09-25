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
    let updateProcessPage: UpdateProcessAdminPage;
    let meetingsPage: MeetingsPage;
    let formMeetingPage: FormMeetingPage;
    let componentsPage: ComponentsPage;
    let managePageComponentPage: ManagePageComponentPage;

    test.beforeEach(async ({ page }) => {
        adminHomePage = new AdminHomePage(page);
        processAdminPage = new ProcessAdminPage(page);
        updateProcessPage = new UpdateProcessAdminPage(page);
        meetingsPage = new MeetingsPage(page);
        formMeetingPage = new FormMeetingPage(page);
        componentsPage = new ComponentsPage(page);
        await adminHomePage.navigateToAdminHomePage();
    });
    test.describe('Main Flow', () => {
        test('should allow admin to create an official event', async () => {
            // Variables to store updated values for verification
            let updatedTitle: string;
            let updatedDescription: string;
            let updatedMeetingType: 'online' | 'in_person' | 'hybrid';
            let updatedStartDate: string;
            let updatedStartTime: string;
            let updatedEndTime: string;
            let updatedOnlineMeetingUrl: string;
            let updatedLocationHints: string;
            let updatedRegistrationType: 'on_this_platform' | 'registration_disabled' | 'on_different_platform';
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
// riparto da qui, devo selezionare Meetings dalla lista dei componenti
            await test.step('6. System: Displays the "Meetings" section in the admin panel.', async () => {
                // Verify meetings page is loaded and visible
                await componentsPage.openComponentMeetingsLink();

                // Check if there are meetings available
                const meetingCount = await meetingsPage.getMeetingCount();
                expect(meetingCount).toBeGreaterThan(0);
                await componentsPage.getPage().screenshot({ path: 'snapshots/EA002/MeetingsList.png', fullPage: true });
            });

            await test.step('7. Admin: Clicks on "New Meeting" to start the process of creating a new meeting', async () => {
                await meetingsPage.clickNewMeeting();
                await meetingsPage.getPage().waitForLoadState('networkidle');
            });

            await test.step('8. System: Displays the "New Meeting" form, prompting the user to fill in the meeting details.', async () => {
                // Verify we're on the new meeting form page
                const currentUrl = managePageComponentPage.getPage().url();
                expect(currentUrl).toMatch(/\/admin.*\/meetings\/new/);
                await expect(managePageComponentPage.getPage().locator('text=Create meeting')).toBeVisible();
            });            




            // await test.step('9. Admin: Fills in the meeting details: Title, Description, Type (in person or online), Start Time, Duration, Location, Registration type, Online Meeting URL (only for online meeting)', async () => {
            //     // create unique title and description for verification later
            //     updatedTitle = `Create Meeting Title - ${Date.now()}`;
            //     await formMeetingPage.fillTitle(updatedTitle);

//                 // Update meeting description
//                 updatedDescription = `Updated meeting description with new details - ${Date.now()}`;
//                 await formMeetingPage.fillDescription(updatedDescription);

//                 // Change meeting type to online
//                 updatedMeetingType = 'online';
//                 await formMeetingPage.selectMeetingType(updatedMeetingType);

//                 // Update start time (set to tomorrow)
//                 const tomorrow = new Date();
//                 tomorrow.setDate(tomorrow.getDate() + 1);
//                 updatedStartDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
//                 updatedStartTime = '14:00'; // 2 PM
//                 await formMeetingPage.setStartDateTime(updatedStartDate, updatedStartTime);

//                 // Update end time (3 hours after start)
//                 updatedEndTime = '17:00'; // 5 PM
//                 await formMeetingPage.setEndDateTime(updatedStartDate, updatedEndTime);

//                 // Update online meeting URL
//                 updatedOnlineMeetingUrl = 'https://meet.jit.si/updated-meeting-room';
//                 await formMeetingPage.fillOnlineMeetingUrl(updatedOnlineMeetingUrl);

//                 // Update location hints
//                 updatedLocationHints = 'Meeting password: 123456';
//                 await formMeetingPage.fillLocationHints(updatedLocationHints);

//                 // Set registration type to "on this platform"
//                 updatedRegistrationType = 'on_this_platform';
//                 await formMeetingPage.selectRegistrationType(updatedRegistrationType);

//                 // Enable comments
//                 await formMeetingPage.setCommentsEnabled(true);
//             });
//             await test.step('10. Admin: Clicks on "Save Event" to update  the event.', async () => {
//                 // Click the Update button to save changes
//                 await formMeetingPage.submitForm();
//                 await formMeetingPage.getPage().waitForLoadState('networkidle');
//             });

//             await test.step('11. System: Validates the event details for completeness and correctness.', async () => {
//                 // Check if there are validation errors
//                 const hasValidationErrors = await formMeetingPage.hasValidationErrors();
//                 expect(hasValidationErrors).toBe(false);
//             });

//             await test.step('12. System: Saves the event and makes it available for citizens to view.', async () => {
//                 // Verify we're redirected back to meetings list or meeting details
//                 const currentUrl = await formMeetingPage.getCurrentUrl();
//                 expect(currentUrl).toMatch(/\/admin.*\/meetings/);
//             });

//             await test.step('13. System: Notifies the City Administrator that the event has been successfully updated.', async () => {
//                 // Check for success notification/message
//                 const successMessage = formMeetingPage
//                     .getPage()
//                     .locator('.flash.success, .alert.success, [role="alert"]');

//                 await expect(successMessage).toBeVisible();
//             });

//             await test.step('Result.', async () => {
//                 // Final verification: navigate back to meetings and verify our meeting was updated
//                 if (!(await meetingsPage.isOnMeetingsPage())) {
//                     await meetingsPage.navigateToMeetings();
//                 }

//                 // Verify the meetings page loads successfully
//                 await meetingsPage.waitForMeetingsLoad();

//                 // Meeting should still exist in the list
//                 const meetingCount = await meetingsPage.getMeetingCount();
//                 expect(meetingCount).toBeGreaterThan(0);

//                 // Find and edit the meeting we just updated by title to verify changes were saved
//                 const meetingIndex = await meetingsPage.findMeetingByTitle(updatedTitle);
//                 expect(meetingIndex).toBeGreaterThanOrEqual(0);

//                 // Click edit on the meeting we just updated
//                 await meetingsPage.clickEdit(meetingIndex);
//                 await meetingsPage.getPage().waitForLoadState('networkidle');

//                 // Verify the edit form loads
//                 await formMeetingPage.verifyEditMeetingPageVisible();

//                 // Verify all the updated values are correctly saved in the form
//                 const currentTitle = await formMeetingPage.getTitle();
//                 expect(currentTitle).toBe(updatedTitle);

//                 const currentDescription = await formMeetingPage.getDescription();
//                 expect(currentDescription).toContain(updatedDescription);

//                 const currentMeetingType = await formMeetingPage.getMeetingType();
//                 expect(currentMeetingType).toBe(updatedMeetingType);

//                 const currentRegistrationType = await formMeetingPage.getRegistrationType();
//                 expect(currentRegistrationType).toBe(updatedRegistrationType);

//                 const currentOnlineMeetingUrl = await formMeetingPage.getOnlineMeetingUrl();
//                 expect(currentOnlineMeetingUrl).toBe(updatedOnlineMeetingUrl);

//                 const currentLocationHints = await formMeetingPage.getLocationHints();
//                 expect(currentLocationHints).toBe(updatedLocationHints);

//                 // Verify comments are enabled
//                 const commentsEnabled = await formMeetingPage.getCommentsEnabledValue();
//                 expect(commentsEnabled).toBe(true);
//             });
//         });
//     });
//     test.describe('Alternative Flow', () => {
//         test('should handle validation failures for all meeting types', async ({ page }) => {
//             await processAdminPage.navigateToProcesses();
//             await processAdminPage.getPage().waitForLoadState('load');
//             await processAdminPage.editFirstProcess();
//             await processAdminPage.getPage().waitForLoadState('load');
//             await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
//             meetingsPage = new MeetingsPage(page);
//             await meetingsPage.verifyMeetingsPageVisible();
//             await meetingsPage.clickEdit(0);
//             await meetingsPage.getPage().waitForLoadState('networkidle');

//             const meetingTypes = [
//                 {
//                     type: 'online',
//                     requiredFields: [
//                         {
//                             name: 'title',
//                             selector: '#meeting_title_en',
//                             fill: async v => await formMeetingPage.fillTitle(v),
//                             valid: 'Valid Title'
//                         },
//                         {
//                             name: 'type_of_meeting',
//                             selector: '#meeting_type_of_meeting',
//                             fill: async v => await formMeetingPage.selectMeetingType(v),
//                             valid: 'online'
//                         },
//                         {
//                             name: 'registration_type',
//                             selector: '#meeting_registration_type',
//                             fill: async v => await formMeetingPage.selectRegistrationType(v),
//                             valid: 'on_this_platform'
//                         }
//                     ]
//                 },
//                 {
//                     type: 'in_person',
//                     requiredFields: [
//                         {
//                             name: 'title',
//                             selector: '#meeting_title_en',
//                             fill: async v => await formMeetingPage.fillTitle(v),
//                             valid: 'Valid Title'
//                         },
//                         {
//                             name: 'type_of_meeting',
//                             selector: '#meeting_type_of_meeting',
//                             fill: async v => await formMeetingPage.selectMeetingType(v),
//                             valid: 'in_person'
//                         },
//                         {
//                             name: 'registration_type',
//                             selector: '#meeting_registration_type',
//                             fill: async v => await formMeetingPage.selectRegistrationType(v),
//                             valid: 'on_this_platform'
//                         },
//                         {
//                             name: 'address',
//                             selector: '#meeting_address',
//                             fill: async v => await formMeetingPage.fillAddress(v),
//                             valid: 'Test Address'
//                         },
//                         {
//                             name: 'location_en',
//                             selector: '#meeting_location_en',
//                             fill: async v => await formMeetingPage.fillLocation(v),
//                             valid: 'Test Location'
//                         }
//                     ]
//                 },
//                 {
//                     type: 'hybrid',
//                     requiredFields: [
//                         {
//                             name: 'title',
//                             selector: '#meeting_title_en',
//                             fill: async v => await formMeetingPage.fillTitle(v),
//                             valid: 'Valid Title'
//                         },
//                         {
//                             name: 'type_of_meeting',
//                             selector: '#meeting_type_of_meeting',
//                             fill: async v => await formMeetingPage.selectMeetingType(v),
//                             valid: 'hybrid'
//                         },
//                         {
//                             name: 'registration_type',
//                             selector: '#meeting_registration_type',
//                             fill: async v => await formMeetingPage.selectRegistrationType(v),
//                             valid: 'on_this_platform'
//                         },
//                         {
//                             name: 'address',
//                             selector: '#meeting_address',
//                             fill: async v => await formMeetingPage.fillAddress(v),
//                             valid: 'Test Address'
//                         },
//                         {
//                             name: 'location_en',
//                             selector: '#meeting_location_en',
//                             fill: async v => await formMeetingPage.fillLocation(v),
//                             valid: 'Test Location'
//                         }
//                     ]
//                 }
//             ];

//             // getValidDate is now imported from utils

//             for (const { type, requiredFields } of meetingTypes) {
//                 await test.step(`Alternative flow for meeting type: ${type}`, async () => {
//                     // First, fill all required fields with valid values
//                     for (const field of requiredFields) {
//                         await field.fill(field.valid);
//                     }
//                     // Use TypeScript literal values for meeting type
//                     if (type === 'online') {
//                         await formMeetingPage.selectMeetingType('online');
//                     } else if (type === 'in_person') {
//                         await formMeetingPage.selectMeetingType('in_person');
//                     } else {
//                         await formMeetingPage.selectMeetingType('hybrid');
//                     }
//                     await formMeetingPage.selectRegistrationType('on_this_platform');

//                     for (const field of requiredFields) {
//                         // Clear only the current field
//                         await field.fill('');
//                         await formMeetingPage.submitForm();
//                         const page = formMeetingPage.getPage();
//                         // Look for a visible error next to or inside the field label
//                         const errorSpanVisible = page.locator(`${field.selector} ~ span.form-error.is-visible`);
//                         const errorSpanGeneric = page.locator(`${field.selector} ~ span.form-error`);
//                         const errorSmallVisible = page.locator(
//                             `label[for="${field.selector.replace('#', '')}"] small.form-error.is-visible`
//                         );
//                         const errorSmallGeneric = page.locator(
//                             `label[for="${field.selector.replace('#', '')}"] small.form-error`
//                         );
//                         let errorFound = false;
//                         if ((await errorSpanVisible.count()) > 0 && (await errorSpanVisible.isVisible())) {
//                             await expect(errorSpanVisible).toBeVisible();
//                             errorFound = true;
//                         } else if ((await errorSpanGeneric.count()) > 0 && (await errorSpanGeneric.isVisible())) {
//                             await expect(errorSpanGeneric).toBeVisible();
//                             errorFound = true;
//                         } else if ((await errorSmallVisible.count()) > 0 && (await errorSmallVisible.isVisible())) {
//                             await expect(errorSmallVisible).toBeVisible();
//                             errorFound = true;
//                         } else if ((await errorSmallGeneric.count()) > 0 && (await errorSmallGeneric.isVisible())) {
//                             await expect(errorSmallGeneric).toBeVisible();
//                             errorFound = true;
//                         }
//                         expect(errorFound).toBe(true);
//                         // Fix the field
//                         await field.fill(field.valid);
//                         await formMeetingPage.submitForm();
//                         // If the page returned to the meetings list, reopen the meeting
//                         const currentUrl = await formMeetingPage.getCurrentUrl();
//                         if (/\/admin.*\/meetings/.test(currentUrl)) {
//                             await meetingsPage.clickEdit(0);
//                             await formMeetingPage.getPage().waitForLoadState('networkidle');
//                         }
//                         // After fixing, no error should be visible
//                         if ((await errorSpanVisible.count()) > 0) {
//                             await expect(errorSpanVisible).not.toBeVisible();
//                         }
//                         if ((await errorSpanGeneric.count()) > 0) {
//                             await expect(errorSpanGeneric).not.toBeVisible();
//                         }
//                         if ((await errorSmallVisible.count()) > 0) {
//                             await expect(errorSmallVisible).not.toBeVisible();
//                         }
//                         if ((await errorSmallGeneric.count()) > 0) {
//                             await expect(errorSmallGeneric).not.toBeVisible();
//                         }
//                     }
//                     // At the end, all fields should be valid
//                     const hasValidationErrors = await formMeetingPage.hasValidationErrors();
//                     expect(hasValidationErrors).toBe(false);
//                 });
//             }
         });
     });
 });
