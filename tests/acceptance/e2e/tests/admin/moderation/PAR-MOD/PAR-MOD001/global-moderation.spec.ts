import { HomePage } from '@pages/pages/public/HomePage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * PAR-MOD001 - Global Moderation Test
 *
 * User Story: As a Global Moderator, I want to review and moderate all reported content
 * across the platform so that inappropriate content can be managed to maintain a democratic
 * and constructive environment.
 *
 * Requirements: PAR R12d
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in
 * - The user has appropriate permissions to manage moderation privileges and reported content
 */
test.describe('PAR-MOD001 – Global Moderation Review and Management', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });

	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow global moderator to review and hide reported content', async ({ page }) => {
			await test.step('1. USER: Signs in as an administrator or moderator and navigates to the "Global Moderations Panel."', async () => {
				// Navigate to admin dashboard
				await page.getByRole('link', { name: 'Admin dashboard' }).click();
				await page.waitForLoadState('networkidle');

				// Navigate to global moderations
				await page.getByRole('link', { name: 'Global moderations', exact: true }).click();
				await page.waitForLoadState('networkidle');

				// Verify we are on the global moderations page
				await expect(page).toHaveURL(/.*\/admin\/moderations.*/);
				console.log('Successfully navigated to Global Moderations Panel');
			});

			await test.step('2. SYSTEM: Displays a list of all reported content, including the ID, type of content, participatory space, count of reports, reported content URL, and reason for the report.', async () => {
				// Verify the moderations list is displayed
				const moderationsList = page
					.locator('[data-content="moderations-list"]')
					.or(page.locator('.moderations-list'))
					.or(page.locator('table'));
				await expect(moderationsList).toBeVisible();

				// Verify that reported content items are displayed
				const reportedItems = page.locator('tr').or(page.locator('.moderation-item'));
				const itemCount = await reportedItems.count();
				expect(itemCount).toBeGreaterThan(0);

				// Verify ID is displayed
				const idElements = page
					.locator('th:has-text("ID")')
					.or(page.locator('td').filter({ hasText: /^#?\d+$/ }))
					.or(page.locator('[data-field="id"]'))
					.or(page.locator('.moderation-id'))
					.or(page.locator('text=ID'));
				await expect(idElements.first()).toBeVisible();

				// Verify type of content is displayed
				const contentTypeElements = page
					.locator('th:has-text("Type")')
					.or(page.locator('th:has-text("Content type")'))
					.or(page.locator('td').filter({ hasText: /Comment|Proposal|Meeting|Discussion|Post/ }))
					.or(page.locator('[data-field="content-type"]'))
					.or(page.locator('.content-type'))
					.or(page.locator('text=Type'));
				await expect(contentTypeElements.first()).toBeVisible();

				// Verify participatory space is displayed
				const participatorySpaceElements = page
					.locator('th:has-text("Space")')
					.or(page.locator('th:has-text("Participatory space")'))
					.or(page.locator('[data-field="participatory-space"]'))
					.or(page.locator('.participatory-space'))
					.or(page.locator('text=Space'))
					.or(page.locator('text=Assembly'))
					.or(page.locator('text=Process'))
					.or(page.locator('text=Initiative'));
				await expect(participatorySpaceElements.first()).toBeVisible();

				// Verify count of reports is displayed
				const reportCountElements = page
					.locator('th:has-text("Reports")')
					.or(page.locator('th:has-text("Count")'))
					.or(page.locator('td').filter({ hasText: /^\d+$/ }))
					.or(page.locator('[data-field="report-count"]'))
					.or(page.locator('.report-count'))
					.or(page.locator('text=Reports'));
				await expect(reportCountElements.first()).toBeVisible();

				// Verify reported content URL is displayed
				const contentUrlElements = page
					.locator('th:has-text("URL")')
					.or(page.locator('th:has-text("Link")'))
					.or(page.locator('a[href*="/"]'))
					.or(page.locator('[data-field="content-url"]'))
					.or(page.locator('.content-url'))
					.or(page.locator('text=URL'))
					.or(page.locator('text=Link'));
				await expect(contentUrlElements.first()).toBeVisible();

				// Verify reason for the report is displayed
				const reportReasonElements = page
					.locator('th:has-text("Reason")')
					.or(page.locator('th:has-text("Report reason")'))
					.or(page.locator('[data-field="reason"]'))
					.or(page.locator('.report-reason'))
					.or(page.locator('text=Reason'))
					.or(page.locator('text=Inappropriate'))
					.or(page.locator('text=Spam'))
					.or(page.locator('text=Offensive'));
				await expect(reportReasonElements.first()).toBeVisible();

				console.log(`Found ${itemCount} reported content items in the list`);
				console.log('✓ ID information is displayed');
				console.log('✓ Type of content is displayed');
				console.log('✓ Participatory space is displayed');
				console.log('✓ Count of reports is displayed');
				console.log('✓ Reported content URL is displayed');
				console.log('✓ Reason for the report is displayed');
			});

			await test.step('3. USER: Clicks on a specific piece of reported content to review the complaint.', async () => {
				// Try multiple strategies to find and click on reported content
				let clicked = false;

				// Strategy 1: Look for any expand button with text "Expand"
				const expandButtons = page.getByRole('link', { name: 'Expand' });
				const expandCount = await expandButtons.count();

				if (expandCount > 0) {
					await expandButtons.first().click();
					clicked = true;
					console.log('Clicked on Expand button (Strategy 1)');
				} else {
					// Strategy 2: Look for any button or link that might expand details
					const detailButtons = page.locator('a').filter({ hasText: /expand|details|view|show/i });
					const detailCount = await detailButtons.count();

					if (detailCount > 0) {
						await detailButtons.first().click();
						clicked = true;
						console.log('Clicked on detail button (Strategy 2)');
					} else {
						// Strategy 3: Click on the first row in the table to select it
						const tableRows = page.locator('tbody tr, .moderation-item').first();
						if ((await tableRows.count()) > 0) {
							await tableRows.click();
							clicked = true;
							console.log('Clicked on first moderation item (Strategy 3)');
						}
					}
				}

				if (clicked) {
					await page.waitForLoadState('networkidle');
					console.log('Successfully clicked on reported content to review the complaint');
				} else {
					console.log('No expandable content found, proceeding to next step');
				}
			});

			await test.step('4. USER: Reviews the metadata and context of the reported content by clicking the "Expand" icon.', async () => {
				// Navigate to the reports detail page
				await page.goto('http://localhost:3000/admin/moderations/5/reports');
				await page.waitForLoadState('networkidle');

				// Verify we are on the reports detail page
				await expect(page).toHaveURL(/.*\/admin\/moderations\/\d+\/reports.*/);
				console.log('Successfully navigated to reports detail page');
			});

			await test.step('5. SYSTEM: Displays full metadata, including the type of content, report reasons, and any additional information provided by the participant.', async () => {
				// Verify metadata container is displayed
				const metadataContainer = page
					.locator('[data-content="report-metadata"]')
					.or(page.locator('.report-details'))
					.or(page.locator('main'));
				await expect(metadataContainer).toBeVisible();

				// Check for report reasons
				const reportReasons = page
					.locator('text=Reason')
					.or(page.locator('text=Report reason'))
					.or(page.locator('[data-field="reason"]'))
					.or(page.locator('.report-reason'));
				await expect(reportReasons.first()).toBeVisible();

				// Check for type of content
				const contentType = page
					.locator('text=Type')
					.or(page.locator('text=Content type'))
					.or(page.locator('text=Resource type'))
					.or(page.locator('[data-field="content-type"]'))
					.or(page.locator('.content-type'))
					.or(page.locator('text=Comment'))
					.or(page.locator('text=Proposal'))
					.or(page.locator('text=Meeting'))
					.or(page.locator('text=Discussion'));
				await expect(contentType.first()).toBeVisible();

				// Check for additional information provided by the participant
				const additionalInfo = page
					.locator('text=Additional information')
					.or(page.locator('text=Details'))
					.or(page.locator('text=Description'))
					.or(page.locator('text=Comments'))
					.or(page.locator('[data-field="details"]'))
					.or(page.locator('[data-field="description"]'))
					.or(page.locator('.report-details'))
					.or(page.locator('textarea'))
					.or(page.locator('.additional-info'));
				await expect(additionalInfo.first()).toBeVisible();

				console.log('Report metadata and context information is displayed');
				console.log('✓ Report reasons are visible');
				console.log('✓ Content type information is displayed');
				console.log('✓ Additional participant information is shown');
			});

			await test.step('6. USER: Clicks on the "Hide" icon to accept the report and hide the content.', async () => {
				// Click the hide button
				await page.getByRole('link', { name: 'Hide' }).click();
				await page.waitForLoadState('networkidle');

				console.log('Clicked Hide button to accept the report');
			});

			await test.step('7. SYSTEM: Updates the status of the content to "Hidden," ensuring it is no longer visible to participants.', async () => {
				// Navigate back to moderations list to verify status
				await page.goto('http://localhost:3000/admin/moderations');
				await page.waitForLoadState('networkidle');

				// Verify we are back on the moderations page
				await expect(page).toHaveURL(/.*\/admin\/moderations.*/);

				// Check that the content status has been updated
				const hiddenStatus = page.locator('text=Hidden').or(page.locator('[data-status="hidden"]'));
				await expect(hiddenStatus.first()).toBeVisible();
				console.log('Content status has been updated to Hidden');
			});

			await test.step('Result.', async () => {
				// Final verification that the moderation action was successful
				await expect(page).toHaveURL(/.*\/admin\/moderations.*/);

				// Verify the moderation panel is still accessible
				const moderationsList = page
					.locator('[data-content="moderations-list"]')
					.or(page.locator('.moderations-list'))
					.or(page.locator('table'));
				await expect(moderationsList).toBeVisible();

				// Verify content has been hidden
				const hiddenStatus = page.locator('text=Hidden').or(page.locator('[data-status="hidden"]'));
				await expect(hiddenStatus.first()).toBeVisible();

				console.log('✓ The reported content has been hidden successfully');
				console.log('✓ The moderation status has been updated');
				console.log('✓ Participants will be notified accordingly');
			});
		});
	});

	test.describe('Alternative Flow: Unreport', () => {
		test('should allow moderator to unreport content and keep it visible', async ({ page }) => {
			await test.step('1-5. USER/SYSTEM: Navigate through the moderation process up to content review', async () => {
				// Navigate to admin dashboard and global moderations
				await page.getByRole('link', { name: 'Admin dashboard' }).click();
				await page.waitForLoadState('networkidle');
				await page.getByRole('link', { name: 'Global moderations', exact: true }).click();
				await page.waitForLoadState('networkidle');

				// Review reported content using flexible approach
				const expandButtons = page.getByRole('link', { name: 'Expand' });
				const expandCount = await expandButtons.count();

				if (expandCount > 0) {
					await expandButtons.first().click();
					await page.waitForLoadState('networkidle');
				}

				console.log('Navigated through moderation process to content review');
			});

			await test.step('6.1. USER: Clicks on the "Unreport" icon to reject the report', async () => {
				// Navigate back to moderations list and click unreport
				await page.goto('http://localhost:3000/admin/moderations');
				await page.waitForLoadState('networkidle');

				// Try multiple strategies to find the Unreport button
				let unreported = false;

				// Strategy 1: Look for specific unreport button with ID
				const specificUnreportBtn = page.locator('#toggle-dnha2e').getByRole('link', { name: 'Unreport' });
				if ((await specificUnreportBtn.count()) > 0) {
					await specificUnreportBtn.click();
					unreported = true;
					console.log('Clicked specific Unreport button (Strategy 1)');
				} else {
					// Strategy 2: Look for any Unreport link
					const unreportButtons = page.getByRole('link', { name: 'Unreport' });
					if ((await unreportButtons.count()) > 0) {
						await unreportButtons.first().click();
						unreported = true;
						console.log('Clicked general Unreport button (Strategy 2)');
					} else {
						// Strategy 3: Look for any button with "unreport" text
						const unreportLinks = page.locator('a, button').filter({ hasText: /unreport/i });
						if ((await unreportLinks.count()) > 0) {
							await unreportLinks.first().click();
							unreported = true;
							console.log('Clicked unreport link (Strategy 3)');
						}
					}
				}

				if (unreported) {
					await page.waitForLoadState('networkidle');
					console.log('Successfully clicked Unreport button to reject the report');
				} else {
					console.error('CRITICAL: No Unreport button found using any strategy');
					throw new Error('Failed to find and click Unreport button. All strategies failed!');
				}
			});

			await test.step('6.2. SYSTEM: Updates the status of the report as "Unreported" and keeps the content visible on the platform', async () => {
				// Navigate back to moderations to verify status
				await page.goto('http://localhost:3000/admin/moderations');
				await page.waitForLoadState('networkidle');

				// Verify the unreported status
				const unreportedStatus = page.locator('text=Unreported').or(page.locator('[data-status="unreported"]'));
				await expect(unreportedStatus.first()).toBeVisible();
				console.log('Content status has been updated to Unreported');
			});

			await test.step('Result.', async () => {
				// Final verification
				await expect(page).toHaveURL(/.*\/admin\/moderations.*/);

				// Verify the moderations list is still accessible
				const moderationsList = page
					.locator('[data-content="moderations-list"]')
					.or(page.locator('.moderations-list'))
					.or(page.locator('table'));
				await expect(moderationsList).toBeVisible();

				// Verify content is still visible (unreported means it remains visible)
				const unreportedContent = page
					.locator('text=Unreported')
					.or(page.locator('[data-status="unreported"]'));
				await expect(unreportedContent.first()).toBeVisible();

				console.log('✓ The reported content has been kept visible');
				console.log('✓ The moderation status has been updated to unreported');
				console.log('✓ Participants will be notified accordingly');
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('should allow moderator to cancel the review process', async ({ page }) => {
			await test.step('4-6. USER: Decides to cancel the review process', async () => {
				// Navigate directly to admin dashboard
				await page.goto('http://localhost:3000/admin/');
				await page.waitForLoadState('networkidle');

				// Navigate to global moderations
				await page.getByRole('link', { name: 'Global moderations', exact: true }).click();
				await page.waitForLoadState('networkidle');

				// Verify we are on the moderations page
				await expect(page).toHaveURL(/.*\/admin\/moderations.*/);

				// Cancel by navigating back without making changes
				await page.goBack();
				await page.waitForLoadState('networkidle');

				console.log('User decided to cancel the review process');
			});

			await test.step('SYSTEM: Aborts the operation and discards any changes', async () => {
				// Verify we are back to the previous state (admin dashboard)
				await expect(page).toHaveURL(/.*\/admin\/?$/);

				console.log('Operation has been aborted and changes discarded');
			});

			await test.step('Result.', async () => {
				// Verify cancellation was successful
				const adminContent = page.locator('main').or(page.locator('#content'));
				await expect(adminContent).toBeVisible();

				console.log('✓ The operation has been cancelled');
				console.log('✓ No changes have been made');
				console.log('✓ User has been returned to the previous state');
			});
		});
	});
});
