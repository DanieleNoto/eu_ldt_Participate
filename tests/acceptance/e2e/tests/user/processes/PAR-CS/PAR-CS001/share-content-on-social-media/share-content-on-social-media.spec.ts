/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { DebatesOverviewPage } from '@pages/pages/public/processes/DebatesOverviewPage';
import { DebateDetailPage } from '@pages/pages/user/processes/DebateDetailPage';
import { test, expect } from '@fixtures/parallel-test';

/**
 * Test suite for sharing content on social media platforms
 *
 * User Story: As a user, I want to share content on social media so that we can reach a wider audience.
 *
 * Requirements: PAR R19
 *
 * Prerequisites:
 * - The user has an active account on the platform and is logged in (not required for public content).
 */

test.describe('[PAR-CS001] – Share content on social media', () => {
	let homePage: HomePage;
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let debatesOverviewPage: DebatesOverviewPage;
	let debateDetailPage: DebateDetailPage;

	test.beforeEach(async ({ userPage }) => {
		homePage = new HomePage(userPage);
		processesOverviewPage = new ProcessesOverviewPage(userPage);
		processDetailPage = new ProcessDetailPage(userPage);
		debatesOverviewPage = new DebatesOverviewPage(userPage);
		debateDetailPage = new DebateDetailPage(userPage);
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow user to share debate content on social media platforms', async () => {
			await test.step('1. User: Navigates to the content they want to share', async () => {
				// Navigate to processes section to find content to share
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('load');

				// Verify we are on the processes overview page
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();

				// Navigate to a specific process
				await processesOverviewPage.navigateToProcessByIndex(0);
				await processDetailPage.expectToBeOnProcessDetailPage();

				// Navigate to debates section
				await processDetailPage.navigateToDebatesPage();
				await debatesOverviewPage.expectToBeOnDebatesOverviewPage();

				// Select a specific debate to share
				const debateTitle = await debatesOverviewPage.getDebateTitleByIndex(0);
				console.log('Selected debate for sharing:', debateTitle);
				await debatesOverviewPage.clickDebateByIndex(0);

				// Verify we are on the debate detail page with content to share
				await debateDetailPage.expectToBeOnDebateDetailPage();
				const contentTitle = await debateDetailPage.getDebateTitle();
				console.log('Content to be shared:', contentTitle);
				expect(contentTitle).not.toBe('');
			});

			await test.step('2. User: Clicks on the "Share" button associated with the content', async () => {
				// Click the share button on the debate content using the page object method
				await debateDetailPage.clickShareButton();
				console.log('Share button clicked successfully');
			});

			await test.step('3. System: Displays sharing options, including social media platforms like Facebook, Twitter, WhatsApp, Telegram', async () => {
				// Verify the share modal is visible
				await debateDetailPage.shareModal.waitForModalToBeVisible();
				expect(await debateDetailPage.shareModal.isModalVisible()).toBe(true);

				// Verify modal title is displayed
				const modalTitle = await debateDetailPage.shareModal.getModalTitle();
				console.log('Share modal title:', modalTitle);
				expect(modalTitle).not.toBe('');

				// Verify all social media sharing options are available
				await debateDetailPage.shareModal.expectAllSocialOptionsToBeVisible();

				// Get count of available social options
				const socialOptionsCount = await debateDetailPage.shareModal.getSocialOptionsCount();
				console.log('Number of social media platforms available:', socialOptionsCount);
				expect(socialOptionsCount).toBeGreaterThanOrEqual(4); // Facebook, X, WhatsApp, Telegram + optional QR
			});

			await test.step('4. User: Selects the social media platform they wish to share the content on', async () => {
				// Test selection of different social media platforms
				console.log('Verifying social media platform URLs are properly generated...');

				// Verify X (Twitter) sharing URL
				const xShareUrl = await debateDetailPage.shareModal.getXShareUrl();
				console.log('X (Twitter) share URL:', xShareUrl);
				expect(xShareUrl).toContain('twitter.com/intent/tweet');

				// Verify Facebook sharing URL
				const facebookShareUrl = await debateDetailPage.shareModal.getFacebookShareUrl();
				console.log('Facebook share URL:', facebookShareUrl);
				expect(facebookShareUrl).toContain('facebook.com/sharer');

				// Verify WhatsApp sharing URL
				const whatsappShareUrl = await debateDetailPage.shareModal.getWhatsappShareUrl();
				console.log('WhatsApp share URL:', whatsappShareUrl);
				expect(whatsappShareUrl).toContain('whatsapp.com/send');

				// Verify Telegram sharing URL
				const telegramShareUrl = await debateDetailPage.shareModal.getTelegramShareUrl();
				console.log('Telegram share URL:', telegramShareUrl);
				expect(telegramShareUrl).toContain('telegram.me/share');
			});

			await test.step('5. System: Generates a link enriched with metadata', async () => {
				// Get the share URL from the input field
				const shareUrl = await debateDetailPage.shareModal.getShareUrl();
				console.log('Generated share URL:', shareUrl);
				expect(shareUrl).not.toBe('');
				expect(shareUrl).toContain('http'); // Basic URL validation

				// Verify that social sharing URLs contain the enriched content URL
				const contentTitle = await debateDetailPage.getDebateTitle();
				console.log('Content title for metadata verification:', contentTitle);

				// Verify that share URLs include metadata (encoded content)
				await debateDetailPage.shareModal.verifyShareUrlsContent(contentTitle, shareUrl);
				console.log('Share URLs verified to contain enriched metadata');
			});

			await test.step('6. User: Clicks on the "Share" button for the chosen social media platform', async () => {
				// Verify all social sharing URLs are properly constructed
				await debateDetailPage.shareModal.verifyAllSocialSharingUrls();
				console.log('All social sharing URLs verified successfully');

				// Note: We don't actually click external links to avoid opening external sites during tests
				// Instead, we verify the URLs are correctly constructed and would redirect properly
			});

			await test.step("7. System: Redirects the user to the selected platform's sharing interface with the content preview", async () => {
				// Verify that clicking would open external links (we check href attributes)
				const xUrl = await debateDetailPage.shareModal.getXShareUrl();
				const facebookUrl = await debateDetailPage.shareModal.getFacebookShareUrl();
				const whatsappUrl = await debateDetailPage.shareModal.getWhatsappShareUrl();
				const telegramUrl = await debateDetailPage.shareModal.getTelegramShareUrl();

				// Verify URLs are properly formed for external redirection
				expect(xUrl).toMatch(/^https:\/\/twitter\.com\/intent\/tweet/);
				expect(facebookUrl).toMatch(/^https?:\/\/www\.facebook\.com\/sharer/);
				expect(whatsappUrl).toMatch(/^https:\/\/api\.whatsapp\.com\/send/);
				expect(telegramUrl).toMatch(/^https:\/\/telegram\.me\/share/);

				console.log('All platform redirect URLs verified for proper external redirection');

				// Close the share modal
				await debateDetailPage.shareModal.closeModal();
			});

			await test.step('Result.', async () => {
				// Verify the sharing workflow completed successfully
				expect(await debateDetailPage.shareModal.isModalVisible()).toBe(false);
				console.log('Share modal closed successfully');

				// Verify we can still access the original content
				const contentTitle = await debateDetailPage.getDebateTitle();
				expect(contentTitle).not.toBe('');
				console.log('Original content remains accessible after sharing workflow');

				console.log('✅ Content sharing on social media workflow completed successfully');
				console.log('✅ All social media platforms (Facebook, X, WhatsApp, Telegram) are properly configured');
				console.log('✅ Share URLs contain enriched metadata for improved social media preview');
			});
		});
	});
});
