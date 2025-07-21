import { HomePage } from '@pages/pages/public/HomePage';
import { DebatesOverviewPage } from '@pages/pages/public/processes/DebatesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { DebateDetailPage } from '@pages/pages/user/processes/DebateDetailPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for ENDORSE a debate topic
 *
 * User Story: As a Citizen, I want to endorse a debate so that I can show my support for a discussion and signal its importance to others.
 *
 * Requirements: PAR R12
 *
 * Prerequisites:
 * - The user has an active account on the platform and is logged in.
 * - The debate allows endorsements (not blocked by permissions or debate settings).
 * - The debate is open for participation (not closed).
 */
test.describe('[PAR-DAD005] – Endorse a debate', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let processesOverviewPage: ProcessesOverviewPage;
	let debatesOverviewPage: DebatesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let debateDetailPage: DebateDetailPage;
	// let closeDebatePage: CloseDebatePage;
	// let debatesPage: DebatesPage;
	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		debatesOverviewPage = new DebatesOverviewPage(page);
		debateDetailPage = new DebateDetailPage(page);
		// closeDebatePage = new CloseDebatePage(page);
		// debatesPage = new DebatesPage(page);
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow user to endorse a debate', async () => {
			let likesCount = 0;
			let resultLikesCount = 0;
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
				await debatesOverviewPage.getDebateTitleByIndex(0);
				await debatesOverviewPage.clickDebateByIndex(0);
			});
			await test.step('6. System: Displays the selected debate, including the title, description, instructions, and current comments or posts.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step('7. User: Clicks on the "Like" button to show support for the debate', async () => {
				// Prima verifica se il debate è già piaciuto dall'utente
				const isAlreadyLiked = await debateDetailPage.isDebateLikedByCurrentUser();
				console.log('Is already liked by user:', isAlreadyLiked);

				// Prendi il conteggio iniziale
				likesCount = await debateDetailPage.getEndorsersCount();
				console.log('Initial likes count:', likesCount);

				// Se già piaciuto, rimuovi prima il like per fare un test pulito
				if (isAlreadyLiked) {
					await debateDetailPage.clickEndorsementButton();
					// Attendi che il sistema processi il unlike
					await debateDetailPage.getPage().waitForLoadState('networkidle');
					// Riprendi il conteggio dopo aver rimosso il like
					likesCount = await debateDetailPage.getEndorsersCount();
					console.log('Likes count after unlike:', likesCount);

					// Verifica che ora il button non mostri più "Dislike"
					const isStillLiked = await debateDetailPage.isDebateLikedByCurrentUser();
					console.log('Is still liked after unlike:', isStillLiked);
				}

				// Ora metti il like
				console.log('About to click like button...');
				await debateDetailPage.clickEndorsementButton();

				// Attendi che il sistema processi il like
				await debateDetailPage.getPage().waitForLoadState('networkidle');

				// Verifica che ora il button mostri "Dislike"
				const isNowLiked = await debateDetailPage.isDebateLikedByCurrentUser();
				console.log('Is now liked after click:', isNowLiked);
			});
			await test.step('8. System: Registers the endorsement and updates the endorsement count for the debate.', async () => {
				// Attendi un po' di più per assicurarsi che l'operazione sia completata
				await debateDetailPage.getPage().waitForTimeout(1000);
				await debateDetailPage.getPage().waitForLoadState('networkidle');

				// Debug delle informazioni di endorsement
				await debateDetailPage.debugEndorsementInfo();

				// Verifica che ora il debate sia piaciuto dall'utente
				const isNowLiked = await debateDetailPage.isDebateLikedByCurrentUser();
				console.log('Final: Is now liked by user:', isNowLiked);

				// Prendi il nuovo conteggio
				resultLikesCount = await debateDetailPage.getEndorsersCount();
				console.log('Final likes count:', resultLikesCount);

				// Se il like non ha funzionato, prova a forzarlo
				if (!isNowLiked) {
					console.log('WARNING: Like did not register properly, attempting to force like...');
					await debateDetailPage.likeDebate();
					await debateDetailPage.getPage().waitForLoadState('networkidle');
					resultLikesCount = await debateDetailPage.getEndorsersCount();
					console.log('Final likes count after force like:', resultLikesCount);
				}
			});
			await test.step('Result.', async () => {
				console.log('=== FINAL VERIFICATION ===');
				console.log('Initial likes count:', likesCount);
				console.log('Final likes count:', resultLikesCount);
				console.log('Expected: final count should be initial count + 1');

				// Verifica finale dello stato del like
				const finalLikeState = await debateDetailPage.isDebateLikedByCurrentUser();
				console.log('Final like state:', finalLikeState);

				// Il debate dovrebbe essere piaciuto dall'utente
				expect(finalLikeState).toBe(true);

				// Il conteggio finale dovrebbe essere maggiore di quello iniziale
				if (resultLikesCount === likesCount) {
					console.log('ERROR: Counts are equal - this suggests the like was not registered properly');

					// Prova a prendere il conteggio una volta di più
					const retryCount = await debateDetailPage.getEndorsersCount();
					console.log('Retry count:', retryCount);

					if (retryCount > likesCount) {
						resultLikesCount = retryCount;
						console.log('Updated final count after retry:', resultLikesCount);
					}
				}

				expect(resultLikesCount).toBeGreaterThan(likesCount);
				// Specificamente, dovrebbe essere +1
				expect(resultLikesCount).toBe(likesCount + 1);
			});
		});
	});
});
