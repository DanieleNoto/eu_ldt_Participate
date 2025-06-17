import { expect, Locator, Page } from '@playwright/test';

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
	private readonly commentButton: Locator;
	private readonly followButton: Locator;
	private readonly shareButton: Locator;
	private readonly reportButton: Locator;

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

	constructor(page: Page) {
		this.page = page;

		// Main debate content elements
		this.debateTitle = this.page.locator('h1.h2.decorator');
		this.authorSection = this.page.locator('.layout-author');
		this.authorAvatar = this.page.locator('.author__avatar');
		this.authorName = this.page.locator('.author__name');
		this.debateDescription = this.page.locator('.editor-content .rich-text-display').first();
		this.instructionsSection = this.page.locator('[data-announcement] .rich-text-display');

		// Action buttons
		this.likeButton = this.page.locator('#endorsement-button');
		this.commentButton = this.page.locator('a[href="#comments"]', { hasText: 'Comment' });
		this.followButton = this.page.locator('button[id^="follow_debate"]');
		this.shareButton = this.page.locator('button[data-dialog-open="socialShare"]');
		this.reportButton = this.page.locator('button[data-dialog-open="loginModal"]', { hasText: 'Rapporto' });

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
		this.commentTextarea = this.page.locator('textarea[id*="add-comment-Debate"][name="comment[body]"]');
		this.commentSubmitButton = this.page.locator('button[type="submit"]', { hasText: 'Publish comment' });
		this.remainingCharacters = this.page.locator('[id*="remaining-characters"]');

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
	 * Click the share button
	 */
	async clickShareButton(): Promise<void> {
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
			await this.loadingComments.waitFor({ state: 'visible', timeout: 2000 });
			await this.loadingComments.waitFor({ state: 'hidden', timeout: 10000 });
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

	/**
	 * Verifies that the debate detail page is properly loaded
	 */
	async expectToBeOnDebateDetailPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/processes\/.*\/debates\/\d+/);
		await expect(this.debateTitle).toBeVisible();
		await expect(this.debateDescription).toBeVisible();
		await expect(this.instructionsSection).toBeVisible();
		await expect(this.existingComments.first()).toBeVisible();
	}
	/**
	 * Scroll through existing comments to ensure they are loaded
	 */
	async scrollThroughComments(): Promise<void> {
		await this.existingComments.last().scrollIntoViewIfNeeded();
	}
	/**
	 * Verifies that exist a comment with text from text param
	 */
	async expectCommentToBeVisible(text: string): Promise<void> {
		const comment = this.existingComments.locator(`text=${text}`).last();
		await expect(comment).toBeVisible();
	}
}
