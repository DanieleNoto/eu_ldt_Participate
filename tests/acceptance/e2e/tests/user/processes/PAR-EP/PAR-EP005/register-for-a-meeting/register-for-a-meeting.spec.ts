import { test } from '@playwright/test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { FormMeetingPage } from '@pages/pages/admin/processes/detail/meetings/FormMeetingPage';
import { MeetingsPage } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { STORAGE_STATE } from '@utils/constants';
import { ensureLoggedIn } from '@utils/auth-helper';
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { MeetingDetailPage } from '@pages/pages/user/processes/MeetingDetailPage';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test suite for Allows citizens to register for a meeting in advance.
 *
 * User Story: As a Citizen, I want to register for a meeting in advance so that I can confirm my participation and receive reminders or updates about the meeting.
 *
 * Requirements: PAR R14f, PAR R13b
 *
 * Prerequisites:
 * - The citizen has an active account on the platform and is logged in.
 * - Meetings are created and published by the City Administrator and are open for registration.
 */

test.describe('[PAR-EP005] – Flow meeting admin + user + participatory', () => {
    // All tests run as USER
    test.use({ storageState: STORAGE_STATE.USER });

    // Variables for USER-side objects
    let homePage: HomePage;
    let processesOverviewPage: ProcessesOverviewPage;
    let processDetailPage: ProcessDetailPage;
    let meetingDetailPage: MeetingDetailPage;

async function ensureStateExists(browser: any, statePath: string, userType: keyof typeof STORAGE_STATE) {
  try {
    if (fs.existsSync(statePath) && fs.statSync(statePath).size > 0) return;
  } catch {
    // continueremo a rigenerare
  }

  const tmpCtx = await browser.newContext();
  const tmpPage = await tmpCtx.newPage();
  await tmpPage.goto(process.env.BASE_URL ?? 'http://localhost:3000');
  await ensureLoggedIn(tmpPage, userType); // la tua funzione di login
  await tmpCtx.storageState({ path: statePath });
  await tmpCtx.close();
}





    test.beforeEach(async ({ page, browser }, testInfo) => {
         // --- PARTICIPATORY PRE-REQUISITE ---
    
          // ... admin setup già esistente ...

  // Assicura che il file esista, altrimenti lo crea
  await ensureStateExists(browser, STORAGE_STATE.USER_WITHOUT_MESSAGES, 'USER_WITHOUT_MESSAGES');

  // Ora puoi aprire il context per l'utenza participatory (o USER_WITHOUT_MESSAGES)
  const participatoryContext = await browser.newContext({ storageState: STORAGE_STATE.USER_WITHOUT_MESSAGES });
  const participatoryPage = await participatoryContext.newPage();
  await ensureLoggedIn(participatoryPage, 'USER_WITHOUT_MESSAGES'); // fallback di verifica
  // salva le variabili se ti serve usarle durante il test
  (testInfo as any).participatoryContext = participatoryContext;
  (testInfo as any).participatoryPage = participatoryPage;

  // Se non ti serve continuare con participatory aperto, chiudilo qui;
  // altrimenti manterlo aperto e chiuderlo in afterEach.
    
    
    
    
    
    
    
    
    
    
    
    
        // //  // Crea un context separato per l'utenza participatory e assicurati sia autenticata
        // // const participatoryContext = await browser.newContext({ storageState: STORAGE_STATE.USER_WITHOUT_MESSAGES });
        // // const participatoryPage = await participatoryContext.newPage();
        // // await ensureLoggedIn(participatoryPage, 'USER_WITHOUT_MESSAGES');

        // Se hai pagine/wrappers specifici per participatory puoi inizializzarli qui:
        // const participatoryHome = new ParticipatoryHomePage(participatoryPage);
        // await participatoryHome.navigateToSomewhere();

        // Chiudi context participatory dopo il setup (o mantienilo aperto se ti serve durante i test)
        // // await participatoryPage.close();
        // // await participatoryContext.close();

        // // --- ADMIN PRE-REQUISITE ---
        // const adminContext = await browser.newContext({ storageState: STORAGE_STATE.ADMIN });
        // const adminPage = await adminContext.newPage();
        // await ensureLoggedIn(adminPage, 'ADMIN');

        // const adminHomePage = new AdminHomePage(adminPage);
        // const processAdminPage = new ProcessAdminPage(adminPage);
        // const updateProcessPage = new UpdateProcessAdminPage(adminPage);
        // const meetingsPageAdmin = new MeetingsPage(adminPage);
        // const formMeetingPage = new FormMeetingPage(adminPage);

        // await test.step('Setup: Admin edits an existing meeting', async () => {
        //     await adminHomePage.navigateToAdminHomePage();
        //     await processAdminPage.navigateToProcesses();
        //     await processAdminPage.getPage().waitForLoadState('networkidle');

        //     await processAdminPage.editProcess('Officia aut dolor aut eos.');
        //     await processAdminPage.getPage().waitForLoadState('networkidle');

        //     await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
        //     await meetingsPageAdmin.verifyMeetingsPageVisible();
        //     const index = await meetingsPageAdmin.findMeetingByTitle('Exercitationem dolorem.');
        //     await meetingsPageAdmin.clickEdit(index);
        //     await meetingsPageAdmin.getPage().waitForLoadState('networkidle');

        //     // Conditional: Main flow vs alternate flow
        //     if (testInfo.title.includes('Main Flow')) {
        //         // Start date: 3 days before today
        //         const startDate = new Date();
        //         startDate.setDate(startDate.getDate() - 3);
        //         await formMeetingPage.selectCustomDate(startDate, 0, 0);
        //         // End date: 3 weeks later today
        //         const endDate = new Date();
        //         endDate.setDate(endDate.getDate() + 21);
        //         await formMeetingPage.selectCustomDate(endDate, 1, 1);
        //     } else {
        //         //Start data to date start time + 5 minutes
        //         const startDate = new Date();
        //         await formMeetingPage.selectCustomDate(startDate, 0, 0);
        //         const hour = startDate.getHours();
        //         const minute = startDate.getMinutes();
        //         await formMeetingPage.selectCustomTime(0, hour, minute, 5);
        //         const endDate = new Date(startDate);
        //         endDate.setDate(endDate.getDate() + 21);
        //         await formMeetingPage.selectCustomDate(endDate, 1, 1);
        //     }

        //     await formMeetingPage.submitForm();
        //     await formMeetingPage.getPage().waitForLoadState('networkidle');
        // });

        // Close context admin
        // await adminPage.close();
        // await adminContext.close();



        // --- USER INIT ---
        homePage = new HomePage(page);
        processesOverviewPage = new ProcessesOverviewPage(page);
        processDetailPage = new ProcessDetailPage(page);
        meetingDetailPage = new MeetingDetailPage(page);
        await homePage.navigateToHomePage();
    });

    test('Main Flow: Register for a meeting', async () => {
	await test.step('USER Register the meeting', async () => {
		//let joined: any;
		await test.step('1. User: Navigates to the "Processes" section on the platform', async () => {
			// Navigate to processes section
			await homePage.goToProcessesFromHomeMenu();
			await processesOverviewPage.getPage().waitForLoadState('networkidle');
		});
		await test.step('2. System: Displays the details of the selected process, including the title, description, phases, key objectives.', async () => {
			await processesOverviewPage.expectToBeOnProcessesOverviewPage();
		});
		await test.step('3. User: Scrolls through the process details to understand the context and purpose of the process and navigates to “Meetings', async () => {
			await processesOverviewPage.navigateToProcessByTitle('Officia aut dolor aut eos.');
			await processesOverviewPage.getPage().waitForLoadState('networkidle');
			await processDetailPage.navigateToMeetingsPage();
		});
		await test.step('4. System: Displays a list of available meetings, including relevant details such as title, date, time, location, and availability.', async () => {
			await processDetailPage.expectUrlContainsMeetings();
		});
		await test.step('5. User: Selects a specific meeting to view more details.', async () => {
			const index = await processDetailPage.findMeetingCardIndexByTitle('Test on available slots');
			await processDetailPage.clickMeetingCardByIndex(index);
		});
		// await test.step('6. System: Displays the meeting details page, including a button labelled "Join Online Meeting."', async () => {
		// 	await meetingDetailPage.expectOnMeetingDetailPage();
		// 	await meetingDetailPage.expectJoinLinkVisible();
		// 	meetingDetailPage.takeScreenshot('JoinLinkVisible');
		// });
		// await test.step('7. User: Clicks on the "Join Online Meeting" button to join the online meeting.', async () => {
		// const [newPage] = await Promise.all([
    	// 	meetingDetailPage.getPage().context().waitForEvent('page'),
   		// 	meetingDetailPage.clickJoinMeetingButton()
		// 	]);
		//     await newPage.waitForLoadState('domcontentloaded');
    	// await newPage.screenshot({
       	// 	path: `test-results/screenshots/join-meeting-${Date.now()}.png`,
       	// 	fullPage: true
    	// 	});	
		// });
		// await test.step('8. System: Redirects the citizen to the meeting link using the provided video conferencing tool.', async () => {
		// 	joined = await meetingDetailPage.verifyJoinMeetingResult();
		// });
		// await test.step('Result: The citizen successfully joins the online meeting and can participate in discussions and activities.', async () => {
		// 	if (joined.success) {
		// 		console.log(`Join successful: scenario = ${joined.outcome}`);
				
		// 	} else {
		// 		throw new Error(`Join KO: outcome = ${joined.outcome}`);
		// 	}
		// });
	});
});
});