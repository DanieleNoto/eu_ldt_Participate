import { test, expect } from '@playwright/test';
import { GrafanaAuthHelper } from '../../../../../../utils/grafana-auth-helper';
import { GrafanaDashboardPage } from '../../../../../../pages/pages/admin/reports/GrafanaDashboardPage';
import { GRAFANA_URLS } from '@utils/constants';

/**
 * User Story: As a System Administrator, I want to aggregate feedback by demographics so that I can understand different community segments.
 *
 * Requirements: PAR R18
 *
 * Prerequisites:
 * - The system administrator has an active account on the platform and is logged in.
 * - The platform has sufficient data on community engagement and communication activities
*/

/** SPDX-License-Identifier: EUPL-1.2
* Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
* Authors:
* Denise Scarcelli
*/

test.describe('[PAR-RG002] - View reports and analytics', () => {
    let grafanaAuth: GrafanaAuthHelper;
    let grafanaDashboardPage: GrafanaDashboardPage;

    test.beforeEach(async ({ page }) => {
        grafanaAuth = new GrafanaAuthHelper();
        await grafanaAuth.injectSessionIntoPage(page);

        grafanaDashboardPage = new GrafanaDashboardPage(page);
    });

    test.afterEach(async () => {
        await grafanaAuth.dispose();
    });

	test.describe('Main Flow', () => {
		test('Admin can view and interact with reports', async ({ page }) => {
			await test.step('1. User: Navigates to the "Grafana Dashboard"', async () => {
            //await grafanaAuth.injectSessionIntoPage(page);
            await page.goto(`${GRAFANA_URLS.BASE}/dashboards`);
            await page.waitForLoadState('networkidle');
            await page.waitForFunction(() => document.title && document.title.includes('Dashboards'), { timeout: 10000 });
            await expect(page).toHaveTitle('Dashboards - Grafana', { timeout: 5000 });
            const nav = page.locator('nav');
            await nav.waitFor({ state: 'visible', timeout: 10000 });
            await expect(nav).toBeVisible();
            await expect(page.getByText('Create and manage dashboards to visualize your data')).toBeVisible();
				
                
                
                //await grafanaDashboardPage.navigateGrafanaDashboard();
			});
        });
    });
});