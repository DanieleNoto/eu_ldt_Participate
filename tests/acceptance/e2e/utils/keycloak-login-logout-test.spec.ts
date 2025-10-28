import { test, expect } from '@playwright/test';
import { DecidimKeycloakAuthHelper } from '../utils/decidim-keycloak-auth';
import { TEST_SELECTORS } from '../utils/constants';

test.describe('Test Keycloak Login and Logout', () => {
    let decidimAuth: DecidimKeycloakAuthHelper;

    test.describe('Test as ADMIN', () => {
        test.beforeEach(async ({ page }) => {
            const adminEmail = process.env.TEST_ADMIN_EMAIL;
            const adminPassword = process.env.TEST_ADMIN_PASSWORD;
            
            if (!adminEmail || !adminPassword) {
                throw new Error('TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD not set in .env file');
            }
    
    decidimAuth = new DecidimKeycloakAuthHelper();
    await decidimAuth.injectSessionIntoPage(page, adminEmail, adminPassword);
});

        test.afterEach(async () => {
            await decidimAuth.dispose();
        });

        test('verify admin authentication on Decidim', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');

            console.log('Current URL:', page.url());
            expect(page.url()).toContain('part-int.ldttoolbox.app');
            expect(page.url()).not.toContain('/users/sign_in');

            // Verify user is logged in
            await expect(page.locator(TEST_SELECTORS.HEADER.USER_MENU)).toBeVisible();

            console.log('Admin authenticated successfully');
        });
    });

    test.describe('Test as USER', () => {
        test.beforeEach(async ({ page }) => {
            const userEmail = process.env.TEST_USER_EMAIL;
            const userPassword = process.env.TEST_USER_PASSWORD;
            
            if (!userEmail || !userPassword) {
                throw new Error('TEST_USER_EMAIL or TEST_USER_PASSWORD not set in .env file');
            }

            decidimAuth = new DecidimKeycloakAuthHelper();
            await decidimAuth.injectSessionIntoPage(page, userEmail, userPassword);
        });

        test.afterEach(async () => {
            await decidimAuth.dispose();
        });

        test('verify user authentication on Decidim', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');

            console.log('Current URL:', page.url());
            expect(page.url()).toContain('part-int.ldttoolbox.app');
            expect(page.url()).not.toContain('/users/sign_in');

            // Verify user is logged in
            await expect(page.locator(TEST_SELECTORS.HEADER.USER_MENU)).toBeVisible();

            console.log('User authenticated successfully');
        });
    });
});