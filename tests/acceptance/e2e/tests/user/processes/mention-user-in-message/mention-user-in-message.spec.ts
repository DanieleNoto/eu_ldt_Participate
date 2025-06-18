import { HomePage } from '@pages/pages/public/HomePage';
import { DebatesOverviewPage } from '@pages/pages/public/processes/DebatesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { DebateDetailPage } from '@pages/pages/user/processes/DebateDetailPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows citizens to mention or tag other users in debate messages
 *
 * User Story: As a Citizen, I want to mention other users in messages so that I can direct their attention to posts.
 *
 * Requirements: PAR R12e
 *
 * Prerequisites:
 * - The user has an active account on the platform and is logged in.
 * - The debate allows participation and tagging of other users.
 */
test.describe('Mention user in a message', () => {
	test.use({ storageState: STORAGE_STATE.USER });
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
		test('should allows citizens to mention or tag other users in debate messages', async () => {
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
			await test.step('7. User: Clicks on "Add Comment" to contribute to the debate.', async () => {
				await debateDetailPage.clickCommentButton();
			});
			await test.step('8. User: Types a message in the provided text box and uses the "@" symbol to mention a specific user.', async () => {
				// Debug dello stato iniziale
				await debateDetailPage.debugTributeState();

				// Prima clicca nel textarea per assicurarsi che sia attivo
				const textarea = debateDetailPage.getPage().locator('textarea[data-tribute="true"]:visible');
				await textarea.click();

				// Assicurati che il textarea sia vuoto
				await textarea.clear();

				// Attendi un momento per assicurarsi che il focus sia impostato
				await debateDetailPage.getPage().waitForTimeout(500);

				console.log('Attempting to trigger mention suggestions...');

				// Approccio diretto: inserisci @ character direttamente
				await textarea.fill('@');
				await debateDetailPage.getPage().waitForTimeout(300);
				await textarea.type('a');

				// Attendi che Tribute.js processi l'input
				await debateDetailPage.getPage().waitForTimeout(1000);
				await textarea.type('d');

				// Verifica che il testo sia corretto
				const textValue = await textarea.inputValue();
				console.log('Text after typing:', textValue);
			});
			await test.step('9. System: Displays a dropdown of usernames that match the characters being typed.', async () => {
				// Prima verifica se il container esiste e il suo stato
				const container = debateDetailPage.getPage().locator('.tribute-container li[role="option"]');
				const exists = await container.count();
				console.log('Tribute container exists:', exists > 0);

				if (exists > 0) {
					const isVisible = await container.isVisible();
					const ariaExpanded = await container.getAttribute('aria-expanded');
					console.log('Container visible:', isVisible);
					console.log('Aria-expanded:', ariaExpanded);

					// Se non è visibile, prova trigger alternativi
					if (!isVisible) {
						console.log('Container not visible, trying alternative approaches...');

						// Approccio 2: Dispatch events manuali
						await debateDetailPage
							.getPage()
							.locator('textarea[data-tribute="true"]')
							.dispatchEvent('input', {
								data: '@a',
								inputType: 'insertText'
							});

						await debateDetailPage.getPage().waitForTimeout(3000);

						// Verifica di nuovo
						const isVisibleAfterDispatch = await container.isVisible();
						console.log('Visible after dispatch event:', isVisibleAfterDispatch);

						if (!isVisibleAfterDispatch) {
							// Approccio 3: Press keys one by one
							await debateDetailPage.getPage().locator('textarea[data-tribute="true"]').clear();
							await debateDetailPage.getPage().locator('textarea[data-tribute="true"]').press('Shift+2'); // @ symbol
							await debateDetailPage.getPage().waitForTimeout(300);
							await debateDetailPage.getPage().locator('textarea[data-tribute="true"]').press('a');
							await debateDetailPage.getPage().waitForTimeout(1000);
						}
					}
				}

				// Verifica finale con timeout più lungo
				try {
					await debateDetailPage.expectMentionSuggestionsToBeVisible();

					const suggestionsCount = await debateDetailPage.getMentionSuggestionsCount();
					console.log('Number of mention suggestions:', suggestionsCount);
					expect(suggestionsCount).toBeGreaterThan(0);

					const suggestions = await debateDetailPage.getMentionSuggestions();
					console.log('Available suggestions:', suggestions);
				} catch (error) {
					console.log('Mention suggestions failed to appear, checking page state...');

					// Debug: controlla il contenuto del textarea
					const textareaValue = await debateDetailPage
						.getPage()
						.locator('textarea[data-tribute="true"]')
						.inputValue();
					console.log('Textarea value:', textareaValue);

					// Debug: controlla se ci sono errori JS
					const consoleLogs = await debateDetailPage.getPage().evaluate(() => {
						return window.console;
					});

					// Debug: controlla l'HTML del form
					const formHTML = await debateDetailPage.getPage().locator('form.new_comment').innerHTML();
					console.log('Form HTML snippet:', formHTML.substring(0, 500));

					// Rilancia l'errore
					throw error;
				}
			});
			await test.step('10. User: Selects the user from a list of matching names that appears when typing.', async () => {
				// Seleziona il primo utente dalla lista (probabilmente "admin")
				await debateDetailPage.selectMentionSuggestionByIndex(0);

				// Verifica che la mention sia stata inserita nel testo
				const commentText = await debateDetailPage.getCommentText();
				console.log('Comment text after selection:', commentText);
				expect(commentText).toContain('@');
			});
			await test.step('11. User: Completes the message and clicks on "Submit Comment."', async () => {
				// Completa il messaggio
				await debateDetailPage.typeCommentWithMentions(' This is a test comment with mention!');

				// Seleziona un'opinione
				await debateDetailPage.setOpinionNeutral();

				// Invia il commento
				await debateDetailPage.submitComment();
			});
			await test.step('12. System: Publishes the comment and sends a notification to the mentioned user to inform them about the tag.', async () => {
				// Verifica che il commento sia stato pubblicato
				await debateDetailPage.expectCommentToBeVisible('This is a test comment with mention!');
			});
			await test.step('Result.', async () => {
				await debateDetailPage.orderCommentsByRecent();
				// Verifica finale che il commento contenga la mention
				const lastComment = await debateDetailPage.getCommentTextByIndex(0);
				console.log('Published comment:', lastComment);
				expect(lastComment).toContain('@');
				expect(lastComment).toContain('This is a test comment with mention!');
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should allows post when users to mention are not found', async () => {
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
			await test.step('7. User: Clicks on "Add Comment" to contribute to the debate.', async () => {
				await debateDetailPage.clickCommentButton();
			});
			await test.step('8a. User: Types the "@" symbol and begins typing the user\'s name.', async () => {
				// Debug dello stato iniziale
				await debateDetailPage.debugTributeState();

				// Prima clicca nel textarea per assicurarsi che sia attivo
				const textarea = debateDetailPage.getPage().locator('textarea[data-tribute="true"]:visible');
				await textarea.click();

				// Assicurati che il textarea sia vuoto
				await textarea.clear();

				// Attendi un momento per assicurarsi che il focus sia impostato
				await debateDetailPage.getPage().waitForTimeout(500);

				console.log('Attempting to trigger mention suggestions...');

				// Approccio diretto: inserisci @ character direttamente
				await textarea.fill('@');
				await debateDetailPage.getPage().waitForTimeout(300);
				await textarea.type('not');

				// Attendi che Tribute.js processi l'input
				await debateDetailPage.getPage().waitForTimeout(1000);
				await textarea.type('existinguser');

				// Verifica che il testo sia corretto
				const textValue = await textarea.inputValue();
				console.log('Text after typing:', textValue);
				textarea.clear();
			});
			await test.step('9.a System: No dropdown will be showed.', async () => {
				// Prima verifica se il container esiste e il suo stato
				const container = debateDetailPage.getPage().locator('.tribute-container li[role="option"]');
				const exists = await container.count();
				console.log('Tribute container exists:', exists > 0);
				expect(exists).toBe(0);
				expect(container).not.toBeVisible();
			});
			await test.step('11. User: Completes the message and clicks on "Submit Comment."', async () => {
				// Completa il messaggio
				await debateDetailPage.typeCommentWithMentions('This is a test comment without mention!');

				// Seleziona un'opinione
				await debateDetailPage.setOpinionAgainst();

				// Invia il commento
				await debateDetailPage.submitComment();
			});
			await test.step('12. System: Publishes the comment and sends a notification to the mentioned user to inform them about the tag.', async () => {
				// Verifica che il commento sia stato pubblicato
				await debateDetailPage.expectCommentToBeVisible('This is a test comment with mention!');
			});
			await test.step('Result.', async () => {
				// Verifica finale che il commento contenga la mention
				await debateDetailPage.orderCommentsByRecent();
				await debateDetailPage.getPage().waitForTimeout(1500);
				const lastComment = await debateDetailPage.getCommentTextByIndex(0);
				console.log('Published comment:', lastComment);
				expect(lastComment).not.toContain('@');
				expect(lastComment).toContain('This is a test comment without mention!');
			});
		});
	});
});
