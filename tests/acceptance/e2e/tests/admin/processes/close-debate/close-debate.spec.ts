import { CloseDebatePage } from '@pages/pages/admin/processes/detail/debates/CloseDebatePage';
import { DebatesPage } from '@pages/pages/admin/processes/detail/debates/DebatesPage';
import { HomePage } from '@pages/pages/public/HomePage';
import { DebatesOverviewPage } from '@pages/pages/public/processes/DebatesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { DebateDetailPage } from '@pages/pages/user/processes/DebateDetailPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for closing a debate topic
 *
 * User Story: As an authorized user (City Administrator, Moderator, or debate creator), I want to close a debate and add conclusions so that participants are informed of the outcome and further participation is restricted.
 *
 * Requirements: PAR R12
 *
 * Prerequisites:
 * - The user has an active account on the platform and is logged in.
 * - The debate is currently active and open for participation.
 * - If the debate was created by a participant, only that participant has the permissions to close it.
 */
test.describe('Closing a debate', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let processesOverviewPage: ProcessesOverviewPage;
	let debatesOverviewPage: DebatesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let debateDetailPage: DebateDetailPage;
	let closeDebatePage: CloseDebatePage;
	let debatesPage: DebatesPage;
	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		debatesOverviewPage = new DebatesOverviewPage(page);
		debateDetailPage = new DebateDetailPage(page);
		closeDebatePage = new CloseDebatePage(page);
		debatesPage = new DebatesPage(page);
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		let debateName: string;
		let conclusionText = 'This is a test conclusion.';
		test('should allow user to participate in a debate', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');

				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
				await processesOverviewPage.navigateToProcessByIndex(0);
			});
			await test.step('2. System: Displays the details of the selected process', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
			await test.step('3. User: Navigate to the “Debates” section of the process', async () => {
				await processDetailPage.navigateToDebatesPage();
			});
			await test.step('4. System: Loads all the debates related to the navigated process', async () => {
				await debatesOverviewPage.expectToBeOnDebatesOverviewPage();
			});
			await test.step('5. User: Selects a debate from the list of available debates.', async () => {
				debateName = await debatesOverviewPage.getDebateTitleByIndex(0);
				await debatesOverviewPage.clickDebateByIndex(0);
			});
			await test.step('6. System: Displays the selected debate, including the title, description, instructions, and current comments or posts.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step('7. User: Clicks on the "Close Debate" button.', async () => {
				await debateDetailPage.clickCloseDebateLink();
			});
			await test.step('8. System: Displays the "Close Debate" form, including the required field for conclusions', async () => {
				await closeDebatePage.expectToBeOnCloseDebatePage();
			});
			await test.step('9. User: Fills in the Conclusions field with a summary of the discussion and outcomes.', async () => {
				await closeDebatePage.fillConclusion(conclusionText);
			});
			await test.step('10. User: Clicks on "Close Debate" to submit the form. ', async () => {
				await closeDebatePage.clickCloseDebate();
			});
			await test.step('11. System: Validates the form input for completeness, correctness, and permission checks.', async () => {
				await debatesPage.expectSuccessFlashMessage('Debate successfully closed.');
			});
			await test.step('12. System: Saves the conclusions, closes the debate, and prevents further edits or comments.', async () => {
				expect(await debatesPage.isDebateClosedByTitle(debateName)).toBeTruthy();
			});
			await test.step('13. System: Updates the debate status to "Closed" and displays the conclusions with the date and time it was closed.', async () => {
				expect(await debatesPage.isDebateClosedByTitle(debateName)).toBeTruthy();
			});
			await test.step('Result.', async () => {
				const index = await debatesPage.getIndexByTitle(debateName);

				// Gestisci l'apertura della nuova tab quando si clicca sul preview
				const [newPage] = await Promise.all([
					debatesPage.getPage().waitForEvent('popup'),
					debatesPage.clickPreviewButtonByIndex(index)
				]);

				// Attendi che la nuova pagina sia completamente caricata
				await newPage.waitForLoadState('networkidle');

				// Verifica che la sezione di successo con l'annuncio della chiusura sia presente nella nuova tab
				const successFlashSection = newPage.locator('.flash.success[data-announcement]');
				await expect(successFlashSection).toBeVisible();

				// Verifica il titolo che contiene informazioni sulla chiusura e le conclusioni
				const conclusionHeaderLocator = successFlashSection.locator('.flash__title');
				await expect(conclusionHeaderLocator).toBeVisible();
				await expect(conclusionHeaderLocator).toContainText('conclusions');

				// Verifica che il messaggio contenga il testo della conclusione
				const conclusionMessageLocator = successFlashSection.locator('.flash__message');
				await expect(conclusionMessageLocator).toBeVisible();
				await expect(conclusionMessageLocator).toContainText(conclusionText);

				// Chiudi la nuova tab
				await newPage.close();
			});
		});
	});
	test.describe('Alternative Flow', () => {
		let debateName: string;
		let conclusionText = 'No';
		test('should allow system to show validation fail', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');

				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
				await processesOverviewPage.navigateToProcessByIndex(0);
			});
			await test.step('2. System: Displays the details of the selected process', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
			await test.step('3. User: Navigate to the “Debates” section of the process', async () => {
				await processDetailPage.navigateToDebatesPage();
			});
			await test.step('4. System: Loads all the debates related to the navigated process', async () => {
				await debatesOverviewPage.expectToBeOnDebatesOverviewPage();
			});
			await test.step('5. User: Selects a debate from the list of available debates.', async () => {
				debateName = await debatesOverviewPage.getDebateTitleByIndex(0);
				await debatesOverviewPage.clickDebateByIndex(0);
			});
			await test.step('6. System: Displays the selected debate, including the title, description, instructions, and current comments or posts.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step('7. User: Clicks on the "Close Debate" button.', async () => {
				await debateDetailPage.clickCloseDebateLink();
			});
			await test.step('8. System: Displays the "Close Debate" form, including the required field for conclusions', async () => {
				await closeDebatePage.expectToBeOnCloseDebatePage();
			});
			await test.step('9. User: Fills in the Conclusions field with a summary of the discussion and outcomes.', async () => {
				await closeDebatePage.fillConclusion(conclusionText);
			});
			await test.step('10. User: Clicks on "Close Debate" to submit the form. ', async () => {
				await closeDebatePage.clickCloseDebate();
			});
			await test.step('11. System: Detects missing or incorrect data in the Conclusions field.', async () => {
				expect(await closeDebatePage.isConclusionValidationVisible()).toBeTruthy();
			});
			await test.step('12. System: Highlights the invalid field and displays an appropriate error message.', async () => {
				expect(await closeDebatePage.isConclusionValidationVisible()).toBeTruthy();
			});
			await test.step('13. User: Corrects the errors and resubmits the form.', async () => {
				await closeDebatePage.fillConclusion('This is a valid conclusion.');
				await closeDebatePage.clickCloseDebate();
				expect(await debatesPage.isDebateClosedByTitle(debateName)).toBeTruthy();
			});
		});
	});
});
