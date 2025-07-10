import { HomePage } from '@pages/pages/public/HomePage';
import { DebatesOverviewPage } from '@pages/pages/public/processes/DebatesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { DebateDetailPage } from '@pages/pages/user/processes/DebateDetailPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for partecipate in a debate topic
 *
 * User Story: As a Citizen, I want to participate in debates so that I can share my views
 * and engage in discussions on specific process’s topics.
 *
 * Requirements: PAR R12a, PAR R12b
 *
 * Prerequisites:
 * - The authorized user (City Administrator or Moderator) has an active account on the platform and is logged in.
 * - The authorized user has permissions to create debates.
 * - The debate component is available and configured properly on Process.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
});
test.describe('[PAR-DAD003] – Participate in a debate', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let processesOverviewPage: ProcessesOverviewPage;
	let debatesOverviewPage: DebatesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let debateDetailPage: DebateDetailPage;
	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		debatesOverviewPage = new DebatesOverviewPage(page);
		debateDetailPage = new DebateDetailPage(page);
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
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
				await debatesOverviewPage.clickDebateByIndex(0);
			});
			await test.step('6. System: Displays the selected debate, including the title, description, instructions, and current comments or posts.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step("7. User: Scrolls through the existing comments to review other participants' contributions.", async () => {
				await debateDetailPage.scrollThroughComments();
			});
			await test.step('8. User: Clicks on "Add Comment" to contribute to the debate.', async () => {
				await debateDetailPage.clickCommentButton();
			});
			await test.step('9. User: Types in their comment in the provided text box.', async () => {
				await debateDetailPage.fillComment('This is a test comment.');
			});
			await test.step('10. User: Clicks "Submit Comment".', async () => {
				await debateDetailPage.submitComment();
			});
			await test.step('11. System: Validates the form input for completeness, correctness, and permission checks.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step('12. System: Publishes the comment, making it visible to all participants of the debate.', async () => {
				await debateDetailPage.expectCommentToBeVisible('This is a test comment.');
			});
			await test.step('13. User: Engages further by liking comments or replying to other posts.', async () => {
				await debateDetailPage.upvoteCommentByIndex(0);
			});
			await test.step('Result.', async () => {
				const commentsCount = await debateDetailPage.getExistingCommentsCount();
				expect(commentsCount).toBeGreaterThan(0);
			});
		});
	});
});
