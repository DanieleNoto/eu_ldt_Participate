/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Simone Bianchelli
 */

import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { MeetingsPage } from '@pages/pages/user/processes/MeetingsPage';
import { tryAnalyze, saveAccessibilityResults } from '@utils/helpers';

/**
 * [PAR-USA02] - QA tests execution for W3C WCAG 2.0, 2.1, and 2.2 Level AA compliance
 * Accessibility tests for User Section
 * Minimum requirement: WCAG 2.1 Level AA (test fails only for 2.0/2.1 violations)
 * WCAG 2.2 violations are reported as warnings only
 * The tool must comply with accessibility guidelines for people with disabilities using WAI-ARIA
 */

test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
	await page.close();
	await context.close();
});

test.describe('[PAR-USA03] Accessibility - Footer Navigation', () => {
	test.use({ storageState: STORAGE_STATE.USER });

	let homePage: HomePage;
	let processDetailPage: ProcessDetailPage;
	let meetingsPage: MeetingsPage;

	const processSlug = 'test';

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		processDetailPage = new ProcessDetailPage(page);
		meetingsPage = new MeetingsPage(page);
	});

	test('should have a minimum of a WCAG 2.1 AA level on login + homepage + footer navigation links', async ({
		page
	}) => {
		await test.step('Visit homepage and accessibility check', async () => {
			await homePage.navigateToHomePage();
			await page.waitForLoadState('networkidle');
			await homePage.expectToBeOnHomePage();
			console.log(`✅ Visiting: ${page.url()} (name: user_homepage)`);
			await tryAnalyze(homePage.getPage(), 'user_homepage');
		});

		const footerRoutes = [
			{ pattern: '/processes', name: 'processes' },
			{ pattern: '/assemblies', name: 'assemblies' },
			{ pattern: '/calendar/calendar', name: 'calendar' },
			{ pattern: '/account', name: 'account' },
			{ pattern: '/profiles/user_test', name: 'profile' },
			{ pattern: '/notifications', name: 'notifications' },
			{ pattern: '/conversations', name: 'conversations' },
			{ pattern: '/last_activities', name: 'last_activities' },
			{ pattern: '/meetings/', name: 'meetings' },
			{ pattern: '/open-data', name: 'open_data' },
			{ pattern: '/pages/help', name: 'help' },
			{ pattern: '/pages/terms-of-service', name: 'privacy_policy' },
			{ pattern: '/locale?locale=de', name: 'locale_de' },
			{ pattern: '/locale?locale=es', name: 'locale_es' },
			{ pattern: '/locale?locale=fr', name: 'locale_fr' }
		];

		for (const route of footerRoutes) {
			await test.step(`Visit footer link ${route.name} and accessibility check`, async () => {
				await page.goto(route.pattern);
				await page.waitForLoadState('networkidle');
				console.log(`✅ Visiting: ${page.url()} (name: ${route.name})`);
				await tryAnalyze(page, route.name);
			});

			if (route.name === 'processes') {
				await test.step('Open process detail and accessibility check', async () => {
					await page.goto(`/processes/${processSlug}`);
					await processDetailPage.waitForPageLoad();
					await expect(page).toHaveURL(new RegExp(`/processes/${processSlug}`));
					console.log(`✅ Visiting: ${page.url()} (name: process_detail)`);
					await tryAnalyze(processDetailPage.getPage(), 'process_detail');
				});
			}

			if (route.name === 'account') {
				await test.step('Open notifications settings and accessibility check', async () => {
					await page.goto('/notifications_settings');
					await page.waitForLoadState('networkidle');
					console.log(`✅ Visiting: ${page.url()} (name: notifications_settings)`);
					await tryAnalyze(page, 'notifications_settings');
				});
				await test.step('Open download your data and accessibility check', async () => {
					await page.goto('/download_your_data');
					await page.waitForLoadState('networkidle');
					console.log(`✅ Visiting: ${page.url()} (name: download_your_data)`);
					await tryAnalyze(page, 'download_your_data');
				});
				await test.step('Open account delete and accessibility check', async () => {
					await page.goto('/account/delete');
					await page.waitForLoadState('networkidle');
					console.log(`✅ Visiting: ${page.url()} (name: account_delete)`);
					await tryAnalyze(page, 'account_delete');
				});
			}

			if (route.name === 'meetings') {
				await test.step('Open meeting detail and accessibility check', async () => {
					await meetingsPage.expectOnMeetingsPage();
					await meetingsPage.clickMeetingCardByIndex(0);
					await page.waitForLoadState('networkidle');
					console.log(`✅ Visiting: ${page.url()} (name: meetings_detail)`);
					await tryAnalyze(page, 'meetings_detail');
				});
			}
		}
	});

	test.afterAll(async () => {
		await saveAccessibilityResults();
	});
});
