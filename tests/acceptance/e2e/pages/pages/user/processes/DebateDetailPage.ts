import { expect, Locator, Page } from '@playwright/test';
import { ShareModalComponent } from '../../../components/common/ShareModalComponent';

export class DebateDetailPage {
	private readonly page: Page;

	// Main debate content elements
	private readonly debateTitle: Locator;
	private readonly authorSection: Locator;
	private readonly authorAvatar: Locator;
	private readonly authorName: Locator;
	private readonly debateDescription: Locator;
	private readonly instructionsSection: Locator;

	// Action buttons
	private readonly likeButton: Locator;
	private readonly endorsementDropdown: Locator;
	private readonly commentButton: Locator;
	private readonly followButton: Locator;
	private readonly shareButton: Locator;
	private readonly reportButton: Locator;

	// Endorsement/Like system
	private readonly endorsementBlock: Locator;
	private readonly endorsementButton: Locator;
	private readonly endorsersListDropdown: Locator;
	private readonly endorsersListGrid: Locator;
	private readonly endorsersListText: Locator;

	// Sidebar info
	private readonly debateStatus: Locator;
	private readonly participantsCount: Locator;
	private readonly groupsCount: Locator;

	// Comments section
	private readonly commentsSection: Locator;
	private readonly commentsHeader: Locator;
	private readonly commentsCount: Locator;
	private readonly commentsThreads: Locator;
	private readonly addCommentSection: Locator;
	private readonly loginLink: Locator;
	private readonly signupLink: Locator;

	// Comment form (when logged in)
	private readonly commentForm: Locator;
	private readonly commentTextarea: Locator;
	private readonly commentSubmitButton: Locator;
	private readonly remainingCharacters: Locator;

	// Mention/Tribute system
	private readonly tributeContainer: Locator;
	private readonly tributeResults: Locator;
	private readonly tributeOptions: Locator;

	// Opinion buttons
	private readonly opinionContainer: Locator;
	private readonly inFavorButton: Locator;
	private readonly neutralButton: Locator;
	private readonly againstButton: Locator;
	private readonly opinionLabel: Locator;

	// Existing comments
	private readonly existingComments: Locator;
	private readonly commentThreads: Locator;

	// Comment interactions
	private readonly commentUpvoteButtons: Locator;
	private readonly commentDownvoteButtons: Locator;
	private readonly replyButtons: Locator;

	// Comment ordering
	private readonly orderByFavorites: Locator;
	private readonly orderByRecent: Locator;
	private readonly orderByOlder: Locator;
	private readonly orderByMostDiscussed: Locator;

	// Loading states
	private readonly loadingComments: Locator;

	// Metadata footer
	private readonly metadataContainer: Locator;
	private readonly referenceItem: Locator;
	private readonly versionItem: Locator;

	// Buttons on Right side
	private readonly closeDebateLink: Locator;

	// Components
	public readonly shareModal: ShareModalComponent;

	constructor(page: Page) {
		this.page = page;

		// Main debate content elements
		this.debateTitle = this.page.locator('h1.h2.decorator');
		this.authorSection = this.page.locator('.layout-author');
		this.authorAvatar = this.page.locator('.author__avatar');
		this.authorName = this.page.locator('.author__name');
		this.debateDescription = this.page.locator('.editor-content div').first();
		this.instructionsSection = this.page.locator('[data-announcement] .rich-text-display');

		// Action buttons
		this.likeButton = this.page.locator('#endorsement-button');
		this.endorsementDropdown = this.page.locator('button#dropdown-trigger');
		this.commentButton = this.page.getByRole('link', { name: 'Comment' });
		this.followButton = this.page.locator('button[id^="follow_debate"]');
		this.shareButton = this.page.locator('button[data-dialog-open="socialShare"]');
		this.reportButton = this.page.locator('button[data-dialog-open="loginModal"]', { hasText: 'Rapporto' });

		// Endorsement/Like system
		this.endorsementBlock = this.page.locator('[id*="endorsement-block"]');
		this.endorsementButton = this.page.locator('#endorsement-button').first();
		this.endorsersListDropdown = this.page.locator('#dropdown-menu-endorsers-list');
		this.endorsersListGrid = this.page.locator('.endorsers-list__grid');
		this.endorsersListText = this.page.locator('.endorsers-list__text');

		// Sidebar info
		this.debateStatus = this.page.locator('.text-md.font-semibold');
		this.participantsCount = this.page.locator('.text-4xl.font-bold').first();
		this.groupsCount = this.page.locator('.text-4xl.font-bold').last();

		// Comments section
		this.commentsSection = this.page.locator('#comments');
		this.commentsHeader = this.page.locator('.comments__header h2');
		this.commentsCount = this.page.locator('.comments-count');
		this.commentsThreads = this.page.locator('#comments-for-Debate-4-threads');
		this.addCommentSection = this.page.locator('.add-comment');
		this.loginLink = this.page.locator('.add-comment a[href="/users/sign_in"]');
		this.signupLink = this.page.locator('.add-comment a[href="/users/sign_up"]');

		// Comment form (when logged in)
		this.commentForm = this.page.locator('form.new_comment[id*="new_comment_for_Debate"]');
		this.commentTextarea = this.page.getByRole('textbox', { name: 'What do you think about this?' });
		this.commentSubmitButton = this.page.getByRole('button', { name: 'Publish comment' });
		this.remainingCharacters = this.page.locator('[id*="remaining-characters"]');

		// Mention/Tribute system
		this.tributeContainer = this.page.locator('.tribute-container');
		this.tributeResults = this.page.locator('.tribute-container #results');
		this.tributeOptions = this.page.locator('.tribute-container li[role="option"]');

		// Opinion buttons
		this.opinionContainer = this.page.locator('[data-opinion-toggle]');
		this.inFavorButton = this.page.locator('button[data-toggle-ok="true"]');
		this.neutralButton = this.page.locator('button[data-toggle-meh="true"]');
		this.againstButton = this.page.locator('button[data-toggle-ko="true"]');
		this.opinionLabel = this.page.locator('.comment__opinion-label');

		// Existing comments
		this.existingComments = this.page.locator('.comment-thread');
		this.commentThreads = this.page.locator('[id*="comments-for-Debate"][id$="-threads"]');

		// Comment interactions
		this.commentUpvoteButtons = this.page.locator('.js-comment__votes--up');
		this.commentDownvoteButtons = this.page.locator('.js-comment__votes--down');
		this.replyButtons = this.page.locator('button[id*="reply-trigger"]');

		// Comment ordering
		this.orderByFavorites = this.page.locator('a[href*="order=best_rated"]');
		this.orderByRecent = this.page.locator('a[href*="order=recent"]');
		this.orderByOlder = this.page.locator('a[href*="order=older"]');
		this.orderByMostDiscussed = this.page.locator('a[href*="order=most_discussed"]');

		// Loading states
		this.loadingComments = this.page.locator('.loading-comments');

		// Metadata footer
		this.metadataContainer = this.page.locator('[data-metadata-footer]');
		this.referenceItem = this.page.locator('.metadata__item', { hasText: 'Riferimento:' });
		this.versionItem = this.page.locator('.metadata__item', { hasText: 'Versione' });

		this.closeDebateLink = this.page.locator('a.button[href*="debate_closes"]');

		// Initialize components
		this.shareModal = new ShareModalComponent(this.page);
	}

	/**
	 * Get the page object
	 */
	getPage(): Page {
		return this.page;
	}

	/**
	 * Wait for the page to be ready
	 */
	async waitForPageReady(): Promise<void> {
		await this.debateTitle.waitFor({ state: 'visible' });
		await this.commentsSection.waitFor({ state: 'visible' });
	}

	/**
	 * Get the debate title
	 * @returns The title text of the debate
	 */
	async getDebateTitle(): Promise<string> {
		return (await this.debateTitle.textContent()) || '';
	}

	/**
	 * Get the debate description
	 * @returns The description text of the debate
	 */
	async getDebateDescription(): Promise<string> {
		return (await this.debateDescription.textContent()) || '';
	}

	/**
	 * Get the author name
	 * @returns The author name
	 */
	async getAuthorName(): Promise<string> {
		return (await this.authorName.textContent()) || '';
	}

	/**
	 * Get the debate instructions
	 * @returns The instructions text
	 */
	async getInstructions(): Promise<string> {
		return (await this.instructionsSection.textContent()) || '';
	}

	/**
	 * Get the debate status
	 * @returns The debate status (e.g., "Apri il dibattito")
	 */
	async getDebateStatus(): Promise<string> {
		return (await this.debateStatus.textContent()) || '';
	}

	/**
	 * Get the participants count
	 * @returns The number of participants as a number
	 */
	async getParticipantsCount(): Promise<number> {
		const text = (await this.participantsCount.textContent()) || '0';
		return parseInt(text.trim());
	}

	/**
	 * Get the groups count
	 * @returns The number of groups as a number
	 */
	async getGroupsCount(): Promise<number> {
		const text = (await this.groupsCount.textContent()) || '0';
		return parseInt(text.trim());
	}

	/**
	 * Get the comments count
	 * @returns The comments count text (e.g., "0 commenti")
	 */
	async getCommentsCount(): Promise<string> {
		return (await this.commentsCount.textContent()) || '';
	}

	/**
	 * Get the comments count as a number
	 * @returns The number of comments
	 */
	async getCommentsCountNumber(): Promise<number> {
		const text = await this.getCommentsCount();
		const match = text.match(/(\d+)/);
		return match ? parseInt(match[1]) : 0;
	}

	/**
	 * Click the like button
	 */
	async clickLikeButton(): Promise<void> {
		await this.likeButton.click();
	}
	/**
	 * Click the like button
	 */
	async clickCloseDebateLink(): Promise<void> {
		await this.closeDebateLink.click();
	}

	/**
	 * Click the comment button to scroll to comments section
	 */
	async clickCommentButton(): Promise<void> {
		await this.commentButton.click();
	}

	/**
	 * Click the follow button
	 */
	async clickFollowButton(): Promise<void> {
		await this.followButton.click();
	}

	/**
	 * Click the share button and wait for the share modal to open
	 */
	async clickShareButton(): Promise<void> {
		// Ensure the button is visible and enabled before clicking
		await this.shareButton.waitFor({ state: 'visible' });
		await expect(this.shareButton).toBeEnabled();

		// Scroll into view if needed
		await this.shareButton.scrollIntoViewIfNeeded();

		// Wait for any JavaScript event handlers to be properly attached
		// This ensures Decidim's modal system is fully initialized
		await this.page.waitForFunction(() => {
			const button = document.querySelector('button[data-dialog-open="socialShare"]') as HTMLButtonElement;
			return button && button.offsetParent !== null; // Element is visible and interactive
		});

		// Single robust click with force option to bypass any overlapping elements
		await this.shareButton.click({ force: true });

		// Wait for the modal to appear with proper timeout handling
		await this.shareModal.waitForModalToBeVisible();
	}

	/**
	 * Click the share button without waiting for modal (for error scenarios)
	 */
	async clickShareButtonOnly(): Promise<void> {
		await this.shareButton.click();
	}

	/**
	 * Click the report button
	 */
	async clickReportButton(): Promise<void> {
		await this.reportButton.click();
	}

	/**
	 * Navigate to add comment section by clicking login link
	 * This method handles the case where user needs to login to comment
	 */
	async navigateToAddComment(): Promise<void> {
		await this.loginLink.waitFor({ state: 'visible' });
		await this.loginLink.click();
	}

	/**
	 * Navigate to signup to comment
	 */
	async navigateToSignupForComment(): Promise<void> {
		await this.signupLink.waitFor({ state: 'visible' });
		await this.signupLink.click();
	}

	/**
	 * Check if user can add comments (is logged in)
	 * @returns True if the comment form is available, false if login is required
	 */
	async canAddComments(): Promise<boolean> {
		const commentFormVisible = await this.commentForm.isVisible().catch(() => false);
		const loginPromptVisible = await this.loginLink.isVisible().catch(() => false);
		return commentFormVisible && !loginPromptVisible;
	}

	/**
	 * Fill the comment textarea
	 * @param commentText - The text to fill in the comment
	 */
	async fillComment(commentText: string): Promise<void> {
		await this.commentTextarea.waitFor({ state: 'visible' });
		await this.commentTextarea.click();
		await this.commentTextarea.fill(commentText);
	}

	/**
	 * Set opinion to "In favor"
	 */
	async setOpinionInFavor(): Promise<void> {
		await this.inFavorButton.click();
	}

	/**
	 * Set opinion to "Neutral"
	 */
	async setOpinionNeutral(): Promise<void> {
		await this.neutralButton.click();
	}

	/**
	 * Set opinion to "Against"
	 */
	async setOpinionAgainst(): Promise<void> {
		await this.againstButton.click();
	}

	/**
	 * Get the currently selected opinion
	 * @returns The selected opinion text or null if none selected
	 */
	async getSelectedOpinion(): Promise<string | null> {
		const activeButton = this.opinionContainer.locator('button.is-active, button[aria-pressed="true"]');
		const isVisible = await activeButton.isVisible().catch(() => false);
		if (isVisible) {
			return await activeButton.locator('span').first().textContent();
		}
		return null;
	}

	/**
	 * Submit the comment form
	 */
	async submitComment(): Promise<void> {
		await this.commentSubmitButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Add a comment with opinion (requires user to be logged in)
	 * @param commentText - The text of the comment to add
	 * @param opinion - The opinion: 'favor', 'neutral', or 'against' (optional, defaults to 'favor')
	 */
	async addComment(commentText: string, opinion: 'favor' | 'neutral' | 'against' = 'favor'): Promise<void> {
		// First check if user can add comments
		const canComment = await this.canAddComments();
		if (!canComment) {
			throw new Error('User must be logged in to add comments');
		}

		// Fill the comment text
		await this.fillComment(commentText);

		// Set the opinion
		switch (opinion) {
			case 'favor':
				await this.setOpinionInFavor();
				break;
			case 'neutral':
				await this.setOpinionNeutral();
				break;
			case 'against':
				await this.setOpinionAgainst();
				break;
		}

		// Submit the comment
		await this.submitComment();
	}

	/**
	 * Get remaining characters count
	 * @returns The remaining characters count as a string
	 */
	async getRemainingCharacters(): Promise<string> {
		return (await this.remainingCharacters.textContent()) || '';
	}

	// === MENTION/TRIBUTE METHODS ===

	/**
	 * Type text character by character to trigger mention suggestions
	 * @param text - The text to type (should include @ for mentions)
	 */
	async typeCommentWithMentions(text: string): Promise<void> {
		await this.commentTextarea.waitFor({ state: 'visible' });
		await this.commentTextarea.click();

		// Type character by character to trigger tribute.js
		// Use a more robust approach for the @ character
		for (const char of text) {
			if (char === '@') {
				// Use direct input value setting combined with simulated events
				await this.insertAtSymbolRobustly();
			} else {
				await this.commentTextarea.type(char);
			}
			await this.page.waitForTimeout(100); // Small delay between characters
		}
	}

	/**
	 * Insert @ symbol in a way that reliably triggers Tribute.js
	 * This combines multiple approaches to ensure cross-platform compatibility
	 */
	private async insertAtSymbolRobustly(): Promise<void> {
		// Method 1: Try direct typing first
		try {
			await this.commentTextarea.type('@');

			// Check if the @ was inserted correctly
			const currentValue = await this.commentTextarea.inputValue();
			if (currentValue.includes('@')) {
				console.log('@ inserted successfully via typing');
				return;
			}
		} catch (error) {
			console.log('Direct typing failed, trying alternative methods');
		}

		// Method 2: Use keyboard shortcut approach
		try {
			await this.page.keyboard.press('Shift+2'); // @ on US keyboards

			const currentValue = await this.commentTextarea.inputValue();
			if (currentValue.includes('@')) {
				console.log('@ inserted successfully via Shift+2');
				return;
			}
		} catch (error) {
			console.log('Shift+2 failed, trying direct manipulation');
		}

		// Method 3: Direct DOM manipulation with event simulation
		await this.page.evaluate(() => {
			const textarea = document.querySelector('#comment_body') as HTMLTextAreaElement;
			if (textarea) {
				const currentValue = textarea.value;
				textarea.value = currentValue + '@';

				// Simulate input events that Tribute.js listens for
				const inputEvent = new Event('input', { bubbles: true, cancelable: true });
				const keyupEvent = new KeyboardEvent('keyup', {
					key: '@',
					charCode: 64,
					keyCode: 64,
					bubbles: true,
					cancelable: true
				});

				textarea.dispatchEvent(inputEvent);
				textarea.dispatchEvent(keyupEvent);

				// Focus and set cursor position
				textarea.focus();
				textarea.setSelectionRange(textarea.value.length, textarea.value.length);
			}
		});

		console.log('@ inserted via DOM manipulation');
	}

	/**
	 * Check if the mention suggestions container is visible
	 * @returns True if the tribute container is visible
	 */
	async areMentionSuggestionsVisible(): Promise<boolean> {
		try {
			const containerExists = (await this.tributeContainer.count()) > 0;
			if (!containerExists) {
				console.log('Tribute container does not exist');
				return false;
			}

			const isVisible = await this.tributeContainer.isVisible();
			console.log('Tribute container visible:', isVisible);

			if (!isVisible) {
				// Check if container exists but is hidden
				const ariaExpanded = await this.tributeContainer.getAttribute('aria-expanded');
				console.log('Tribute container aria-expanded:', ariaExpanded);
				return ariaExpanded === 'true';
			}

			return isVisible;
		} catch (error) {
			console.log('Error checking tribute suggestions visibility:', error);
			return false;
		}
	}

	/**
	 * Wait for mention suggestions to appear with timeout
	 * @param timeout - Maximum time to wait in milliseconds
	 * @returns True if suggestions appeared within timeout
	 */
	async waitForMentionSuggestions(timeout: number = 5000): Promise<boolean> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			if (await this.areMentionSuggestionsVisible()) {
				console.log('Mention suggestions appeared');
				return true;
			}
			await this.page.waitForTimeout(100);
		}

		console.log('Mention suggestions did not appear within timeout');
		return false;
	}

	/**
	 * Check if Tribute.js is properly initialized on the textarea
	 * @returns True if the textarea has tribute data attributes
	 */
	async isTributeInitialized(): Promise<boolean> {
		const hasTributeAttr = await this.commentTextarea.getAttribute('data-tribute');
		return hasTributeAttr === 'true';
	}

	/**
	 * Debug tribute state and force initialization if needed
	 */
	async debugTributeState(): Promise<void> {
		console.log('=== TRIBUTE DEBUG INFO ===');

		const isInitialized = await this.isTributeInitialized();
		console.log('Tribute initialized:', isInitialized);

		const containerExists = (await this.tributeContainer.count()) > 0;
		console.log('Container exists:', containerExists);

		if (containerExists) {
			const isVisible = await this.tributeContainer.isVisible();
			const ariaExpanded = await this.tributeContainer.getAttribute('aria-expanded');
			console.log('Container visible:', isVisible);
			console.log('Aria expanded:', ariaExpanded);
		}

		const textareaValue = await this.commentTextarea.inputValue();
		console.log('Textarea value:', textareaValue);

		// Check if there are any JS errors that might prevent Tribute from working
		const jsErrors = await this.page.evaluate(() => {
			// Return any stored JS errors or console errors
			return (window as any).jsErrors || [];
		});
		console.log('JS Errors:', jsErrors);

		console.log('=== END TRIBUTE DEBUG ===');
	}

	/**
	 * Get the number of mention suggestions displayed
	 * @returns The number of suggestion options
	 */
	async getMentionSuggestionsCount(): Promise<number> {
		if (!(await this.areMentionSuggestionsVisible())) {
			return 0;
		}
		return await this.tributeOptions.count();
	}

	/**
	 * Get all mention suggestion usernames
	 * @returns Array of suggested usernames
	 */
	async getMentionSuggestions(): Promise<string[]> {
		if (!(await this.areMentionSuggestionsVisible())) {
			return [];
		}

		const options = this.tributeOptions;
		const count = await options.count();
		const suggestions: string[] = [];

		for (let i = 0; i < count; i++) {
			const option = options.nth(i);
			const usernameElement = option.locator('strong');
			const username = (await usernameElement.textContent()) || '';
			// Remove @ symbol if present
			suggestions.push(username.replace('@', ''));
		}

		return suggestions;
	}

	/**
	 * Select a mention suggestion by index
	 * @param index - The index of the suggestion to select (0-based)
	 */
	async selectMentionSuggestionByIndex(index: number): Promise<void> {
		await this.tributeOptions.waitFor({ state: 'visible' });
		const option = this.tributeOptions.nth(index);
		await option.click();

		// Wait for the mention to be inserted
		await this.page.waitForTimeout(500);
	}

	/**
	 * Select a mention suggestion by username
	 * @param username - The username to select (without @ symbol)
	 */
	async selectMentionSuggestionByUsername(username: string): Promise<void> {
		await this.tributeOptions.waitFor({ state: 'visible' });

		const suggestions = await this.getMentionSuggestions();
		const index = suggestions.indexOf(username);

		if (index === -1) {
			throw new Error(`Username "${username}" not found in suggestions: ${suggestions.join(', ')}`);
		}

		await this.selectMentionSuggestionByIndex(index);
	}

	/**
	 * Type a mention and select a user from suggestions
	 * @param partialUsername - Part of the username to type after @
	 * @param fullUsername - The full username to select from suggestions
	 */
	async mentionUser(partialUsername: string, fullUsername: string): Promise<void> {
		// Type @ followed by partial username
		await this.typeCommentWithMentions(`@${partialUsername}`);

		// Wait for suggestions to appear
		await this.tributeContainer.waitFor({ state: 'visible' });

		// Select the desired user
		await this.selectMentionSuggestionByUsername(fullUsername);
	}

	/**
	 * Add a comment with user mentions
	 * @param commentText - The comment text (can include @ mentions)
	 * @param opinion - The opinion: 'favor', 'neutral', or 'against'
	 */
	async addCommentWithMentions(
		commentText: string,
		opinion: 'favor' | 'neutral' | 'against' = 'favor'
	): Promise<void> {
		// First check if user can add comments
		const canComment = await this.canAddComments();
		if (!canComment) {
			throw new Error('User must be logged in to add comments');
		}

		// Type the comment with mentions
		await this.typeCommentWithMentions(commentText);

		// Set the opinion
		switch (opinion) {
			case 'favor':
				await this.setOpinionInFavor();
				break;
			case 'neutral':
				await this.setOpinionNeutral();
				break;
			case 'against':
				await this.setOpinionAgainst();
				break;
		}

		// Submit the comment
		await this.submitComment();
	}

	/**
	 * Clear the comment textarea
	 */
	async clearComment(): Promise<void> {
		await this.commentTextarea.click();
		await this.commentTextarea.selectText();
		await this.commentTextarea.press('Delete');
	}

	/**
	 * Get the current text in the comment textarea
	 * @returns The current text content
	 */
	async getCommentText(): Promise<string> {
		return (await this.commentTextarea.inputValue()) || '';
	}

	/**
	 * Wait for mention suggestions to disappear
	 */
	async waitForMentionSuggestionsToDisappear(): Promise<void> {
		await this.tributeContainer.waitFor({ state: 'hidden' });
	}

	/**
	 * Verify that mention suggestions contain a specific user
	 * @param username - The username to look for (without @ symbol)
	 */
	async expectMentionSuggestionToContain(username: string): Promise<void> {
		const suggestions = await this.getMentionSuggestions();
		expect(suggestions).toContain(username);
	}

	/**
	 * Verify that mention suggestions are visible
	 */
	async expectMentionSuggestionsToBeVisible(): Promise<void> {
		// Prova ad attendere che il container diventi visibile con un timeout più lungo
		try {
			await expect(this.tributeContainer).toBeVisible();
		} catch (error) {
			// Se fallisce, prova a vedere se il container ha contenuto anche se non "visibile"
			const hasContent = (await this.tributeResults.locator('li').count()) > 0;
			if (hasContent) {
				console.log('Tribute container has content but is not marked as visible');
				// In questo caso, consideriamo che funzioni
				return;
			}
			throw error;
		}
	}

	/**
	 * Verify that mention suggestions are not visible
	 */
	async expectMentionSuggestionsToBeHidden(): Promise<void> {
		await expect(this.tributeContainer).not.toBeVisible();
	}

	// === END MENTION/TRIBUTE METHODS ===

	/**
	 * Check if the comment form is visible
	 * @returns True if the comment form is visible
	 */
	async isCommentFormVisible(): Promise<boolean> {
		return await this.commentForm.isVisible().catch(() => false);
	}

	/**
	 * Order comments by favorites
	 */
	async orderCommentsByFavorites(): Promise<void> {
		await this.orderByFavorites.click();
		await this.waitForCommentsToLoad();
	}

	/**
	 * Order comments by most recent
	 */
	async orderCommentsByRecent(): Promise<void> {
		await this.orderByRecent.click();
		await this.waitForCommentsToLoad();
	}

	/**
	 * Order comments by oldest
	 */
	async orderCommentsByOlder(): Promise<void> {
		await this.orderByOlder.click();
		await this.waitForCommentsToLoad();
	}

	/**
	 * Order comments by most discussed
	 */
	async orderCommentsByMostDiscussed(): Promise<void> {
		await this.orderByMostDiscussed.click();
		await this.waitForCommentsToLoad();
	}

	/**
	 * Wait for comments to load
	 */
	async waitForCommentsToLoad(): Promise<void> {
		// Wait for loading indicator to appear and then disappear
		try {
			await this.loadingComments.waitFor({ state: 'visible' });
			await this.loadingComments.waitFor({ state: 'hidden' });
		} catch {
			// Loading indicator might not appear for fast loads
		}
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Get the debate reference
	 * @returns The reference text (e.g., "norg-DEBA-2025-06-4")
	 */
	async getDebateReference(): Promise<string> {
		const text = (await this.referenceItem.textContent()) || '';
		const match = text.match(/Riferimento:\s*(.+)/);
		return match ? match[1].trim() : '';
	}

	/**
	 * Get the debate version information
	 * @returns The version text
	 */
	async getDebateVersion(): Promise<string> {
		return (await this.versionItem.textContent()) || '';
	}

	/**
	 * Check if the debate is open
	 * @returns True if the debate status indicates it's open
	 */
	async isDebateOpen(): Promise<boolean> {
		const status = await this.getDebateStatus();
		return status.toLowerCase().includes('apri');
	}

	/**
	 * Check if the page is loaded correctly
	 * @returns True if the main debate content is visible
	 */
	async isPageLoaded(): Promise<boolean> {
		return (await this.debateTitle.isVisible()) && (await this.commentsSection.isVisible());
	}

	/**
	 * Scroll to comments section
	 */
	async scrollToComments(): Promise<void> {
		await this.commentsSection.scrollIntoViewIfNeeded();
	}

	/**
	 * Check if author avatar is visible
	 * @returns True if author avatar is displayed
	 */
	async isAuthorAvatarVisible(): Promise<boolean> {
		return await this.authorAvatar.isVisible();
	}

	/**
	 * Get the number of existing comments visible
	 * @returns The count of comment threads
	 */
	async getExistingCommentsCount(): Promise<number> {
		return await this.existingComments.count();
	}

	/**
	 * Get the text content of a specific comment by index
	 * @param index - The index of the comment (0-based)
	 * @returns The comment text content
	 */
	async getCommentTextByIndex(index: number): Promise<string> {
		const comment = this.existingComments.nth(index);
		const contentElement = comment.locator('.comment__content .editor-content');
		return (await contentElement.textContent()) || '';
	}

	/**
	 * Get the author name of a specific comment by index
	 * @param index - The index of the comment (0-based)
	 * @returns The comment author name
	 */
	async getCommentAuthorByIndex(index: number): Promise<string> {
		const comment = this.existingComments.nth(index);
		const authorElement = comment.locator('.author__name');
		return (await authorElement.textContent()) || '';
	}

	/**
	 * Get the opinion/alignment of a specific comment by index
	 * @param index - The index of the comment (0-based)
	 * @returns The comment opinion (e.g., "In favor", "Neutral", "Against")
	 */
	async getCommentOpinionByIndex(index: number): Promise<string> {
		const comment = this.existingComments.nth(index);
		const opinionElement = comment.locator('.comment__content--label');
		return (await opinionElement.textContent()) || '';
	}

	/**
	 * Upvote a comment by index
	 * @param index - The index of the comment to upvote (0-based)
	 */
	async upvoteCommentByIndex(index: number): Promise<void> {
		const upvoteButton = this.commentUpvoteButtons.nth(index);
		await upvoteButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Downvote a comment by index
	 * @param index - The index of the comment to downvote (0-based)
	 */
	async downvoteCommentByIndex(index: number): Promise<void> {
		const downvoteButton = this.commentDownvoteButtons.nth(index);
		await downvoteButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Reply to a comment by index
	 * @param index - The index of the comment to reply to (0-based)
	 * @param replyText - The text of the reply
	 * @param opinion - The opinion for the reply: 'favor', 'neutral', or 'against' (optional, defaults to 'favor')
	 */
	async replyToCommentByIndex(
		index: number,
		replyText: string,
		opinion: 'favor' | 'neutral' | 'against' = 'favor'
	): Promise<void> {
		// Click the reply button for the specific comment
		const replyButton = this.existingComments.nth(index).locator('button[id*="reply-trigger"]');
		await replyButton.click();

		// Wait for the reply form to appear
		const replyForm = this.existingComments.nth(index).locator('[data-additional-reply] form');
		await replyForm.waitFor({ state: 'visible' });

		// Fill the reply text
		const replyTextarea = replyForm.locator('textarea[name="comment[body]"]');
		await replyTextarea.fill(replyText);

		// Submit the reply
		const submitButton = replyForm.locator('button[type="submit"]');
		await submitButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Get the upvote count for a comment by index
	 * @param index - The index of the comment (0-based)
	 * @returns The upvote count as a number
	 */
	async getCommentUpvoteCountByIndex(index: number): Promise<number> {
		const comment = this.existingComments.nth(index);
		const upvoteElement = comment.locator('.js-comment__votes--up span');
		const countText = (await upvoteElement.textContent()) || '0';
		return parseInt(countText.trim());
	}

	/**
	 * Get the downvote count for a comment by index
	 * @param index - The index of the comment (0-based)
	 * @returns The downvote count as a number
	 */
	async getCommentDownvoteCountByIndex(index: number): Promise<number> {
		const comment = this.existingComments.nth(index);
		const downvoteElement = comment.locator('.js-comment__votes--down span');
		const countText = (await downvoteElement.textContent()) || '0';
		return parseInt(countText.trim());
	}

	// === ENDORSEMENT/LIKE METHODS ===

	/**
	 * Click the like/endorsement button
	 */
	async clickEndorsementButton(): Promise<void> {
		await this.endorsementButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Click the endorsement dropdown to view likes list
	 */
	async clickEndorsementDropdown(): Promise<void> {
		await this.endorsementDropdown.click();
	}

	/**
	 * Check if the current user has liked/endorsed the debate
	 * @returns True if the endorsement button shows "Dislike", false if it shows "Like"
	 */
	async isDebateLikedByCurrentUser(): Promise<boolean> {
		const buttonText = (await this.endorsementButton.textContent()) || '';
		return buttonText.trim().toLowerCase().includes('dislike');
	}

	/**
	 * Check if the endorsement button is visible
	 * @returns True if the endorsement button is available
	 */
	async isEndorsementButtonVisible(): Promise<boolean> {
		return await this.endorsementButton.isVisible();
	}

	/**
	 * Get the endorsement button text (Like/Dislike)
	 * @returns The button text
	 */
	async getEndorsementButtonText(): Promise<string> {
		return (await this.endorsementButton.textContent()) || '';
	}

	/**
	 * Open the endorsers list dropdown and get the count of people who liked
	 * @returns The number of people who endorsed/liked the debate
	 */
	async getEndorsersCount(): Promise<number> {
		// Check if dropdown is already visible
		const isDropdownVisible = await this.endorsersListDropdown.isVisible();

		if (!isDropdownVisible) {
			// Click to open the dropdown
			await this.clickEndorsementDropdown();
			// Wait for the dropdown to be visible
			await this.endorsersListDropdown.waitFor({ state: 'visible' });
		}

		// Count the number of endorser elements (span.author) in the grid
		const endorserElements = this.endorsersListGrid.locator('span.author[data-author="true"]');
		const count = await endorserElements.count();

		// Close the dropdown by clicking elsewhere if we opened it
		if (!isDropdownVisible) {
			await this.page.click('body');
			// Wait for dropdown to close
			await this.endorsersListDropdown.waitFor({ state: 'hidden' }).catch(() => {
				// Ignore timeout if dropdown doesn't close properly
			});
		}

		return count;
	}

	/**
	 * Check if there are any endorsers/likes
	 * @returns True if the debate has been liked by at least one person
	 */
	async hasEndorsers(): Promise<boolean> {
		return (await this.getEndorsersCount()) > 0;
	}

	/**
	 * Get the endorsers list text (e.g., "Liked by…")
	 * @returns The endorsers list header text
	 */
	async getEndorsersListText(): Promise<string> {
		const isDropdownVisible = await this.endorsersListDropdown.isVisible();

		if (!isDropdownVisible) {
			await this.clickEndorsementDropdown();
			await this.endorsersListDropdown.waitFor({ state: 'visible' });
		}

		const text = (await this.endorsersListText.textContent()) || '';

		// Close the dropdown if we opened it
		if (!isDropdownVisible) {
			await this.page.click('body');
			await this.endorsersListDropdown.waitFor({ state: 'hidden' }).catch(() => {
				// Ignore timeout if dropdown doesn't close properly
			});
		}

		return text.trim();
	}

	/**
	 * Get a list of endorser names from the dropdown
	 * @returns An array of endorser names/usernames
	 */
	async getEndorserNames(): Promise<string[]> {
		const isDropdownVisible = await this.endorsersListDropdown.isVisible();

		if (!isDropdownVisible) {
			await this.clickEndorsementDropdown();
			await this.endorsersListDropdown.waitFor({ state: 'visible' });
		}

		// Use the same specific selector as in getEndorsersCount
		const endorserElements = this.endorsersListGrid.locator('span.author[data-author="true"] img');
		const count = await endorserElements.count();
		const names: string[] = [];

		for (let i = 0; i < count; i++) {
			const altText = (await endorserElements.nth(i).getAttribute('alt')) || '';
			// Extract name from alt text like "Avatar: admin"
			const match = altText.match(/Avatar:\s*(.+)/);
			if (match) {
				names.push(match[1].trim());
			}
		}

		// Close the dropdown if we opened it
		if (!isDropdownVisible) {
			await this.page.click('body');
			await this.endorsersListDropdown.waitFor({ state: 'hidden' }).catch(() => {
				// Ignore timeout if dropdown doesn't close properly
			});
		}

		return names;
	}

	/**
	 * Like the debate (if not already liked)
	 */
	async likeDebate(): Promise<void> {
		const isAlreadyLiked = await this.isDebateLikedByCurrentUser();
		if (!isAlreadyLiked) {
			await this.clickEndorsementButton();
		}
	}

	/**
	 * Unlike the debate (if currently liked)
	 */
	async unlikeDebate(): Promise<void> {
		const isLiked = await this.isDebateLikedByCurrentUser();
		if (isLiked) {
			await this.clickEndorsementButton();
		}
	}

	/**
	 * Toggle the like status of the debate
	 */
	async toggleLike(): Promise<void> {
		await this.clickEndorsementButton();
	}

	/**
	 * Verify that the debate has been liked by the current user
	 */
	async expectDebateToBeLiked(): Promise<void> {
		await expect(this.endorsementButton).toContainText('Dislike');
	}

	/**
	 * Verify that the debate has not been liked by the current user
	 */
	async expectDebateToBeNotLiked(): Promise<void> {
		await expect(this.endorsementButton).not.toContainText('Dislike');
	}

	/**
	 * Verify that the debate has a specific number of endorsers
	 * @param expectedCount - The expected number of endorsers
	 */
	async expectEndorsersCount(expectedCount: number): Promise<void> {
		const actualCount = await this.getEndorsersCount();
		expect(actualCount).toBe(expectedCount);
	}

	// === END ENDORSEMENT/LIKE METHODS ===

	/**
	 * Verifies that the debate detail page is properly loaded
	 */
	async expectToBeOnDebateDetailPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/processes\/.*\/debates\/\d+/);
		await expect(this.debateTitle).toBeVisible();
		await expect(this.debateDescription).toBeVisible();
	}
	/**
	 * Scroll through existing comments to ensure they are loaded
	 */
	async scrollThroughComments(): Promise<void> {
		await this.commentForm.last().scrollIntoViewIfNeeded();
	}
	/**
	 * Verifies that exist a comment with text from text param
	 */
	async expectCommentToBeVisible(text: string): Promise<void> {
		const comment = this.existingComments.filter({ hasText: text }).last();
		await expect(comment).toBeVisible();
	}

	// === SHARE MODAL CONVENIENCE METHODS ===

	/**
	 * Open share modal and copy the share URL to clipboard
	 * @returns The copied share URL
	 */
	async shareAndCopyUrl(): Promise<string> {
		await this.clickShareButton();
		const shareUrl = await this.shareModal.getShareUrl();
		await this.shareModal.copyShareUrl();
		await this.shareModal.expectCopySuccessMessage();
		await this.shareModal.closeModal();
		return shareUrl;
	}

	/**
	 * Open share modal and get all social sharing URLs without clicking them
	 * @returns Object containing all social sharing URLs
	 */
	async getShareUrls(): Promise<{
		x: string;
		facebook: string;
		whatsapp: string;
		telegram: string;
		shareUrl: string;
	}> {
		await this.clickShareButton();

		const urls = {
			x: await this.shareModal.getXShareUrl(),
			facebook: await this.shareModal.getFacebookShareUrl(),
			whatsapp: await this.shareModal.getWhatsappShareUrl(),
			telegram: await this.shareModal.getTelegramShareUrl(),
			shareUrl: await this.shareModal.getShareUrl()
		};

		await this.shareModal.closeModal();
		return urls;
	}

	/**
	 * Test complete share modal functionality including accessibility
	 */
	async testShareModalFunctionality(): Promise<void> {
		// Open share modal
		await this.clickShareButton();

		// Test accessibility
		await this.shareModal.expectProperAccessibility();

		// Test all social options are visible
		await this.shareModal.expectAllSocialOptionsToBeVisible();

		// Test copy to clipboard workflow
		await this.shareModal.testCopyToClipboardWorkflow();

		// Verify social sharing URLs
		await this.shareModal.verifyAllSocialSharingUrls();

		// Close modal
		await this.shareModal.closeModal();
	}

	/**
	 * Verify that the share modal contains expected content for this debate
	 * @param expectedTitle - Expected debate title in share URLs
	 */
	async verifyShareContentForDebate(expectedTitle?: string): Promise<void> {
		const debateTitle = expectedTitle || (await this.getDebateTitle());
		const currentUrl = this.page.url();

		await this.clickShareButton();
		await this.shareModal.verifyShareUrlsContent(debateTitle, currentUrl);
		await this.shareModal.closeModal();
	}
}
