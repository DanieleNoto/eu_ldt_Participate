/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import type { Page } from '@playwright/test';
import { DecidimLoginPage } from '../pages/pages/auth/DecidimKeycloakLoginPage';
import * as fs from 'fs';
import * as path from 'path';

const STORAGE_DIR = path.resolve(__dirname, '../auth');

/**
 * Helper class for Decidim/Keycloak authentication via browser
 */
export class DecidimKeycloakAuthHelper {
	private loginPage: DecidimLoginPage | null = null;

	/**
	 * Get storage file path
	 */
	private getStorageFilePath(email: string): string {
		const fileName = email.includes('admin') ? 'keycloak-admin-state.json' : 'keycloak-user-state.json';
		return path.join(STORAGE_DIR, fileName);
	}

	/**
	 * Authenticate via browser with session caching.
	 * If forceLogin is true, always perform fresh login.
	 */
	async injectSessionIntoPage(
		page: Page,
		username: string,
		password: string,
		forceLogin: boolean = false,
		checkUrl: string = '/account'
	): Promise<void> {
		// Clear existing cookies
		await page.context().clearCookies();

		this.loginPage = new DecidimLoginPage(page);
		const storageFile = this.getStorageFilePath(username);

		if (!forceLogin && fs.existsSync(storageFile)) {
			console.log(`Loading existing Keycloak session from ${path.basename(storageFile)}`);
			try {
				const storageState = JSON.parse(fs.readFileSync(storageFile, 'utf-8'));
				await page.context().addCookies(storageState.cookies);

				await page.goto(checkUrl);
				await page.waitForLoadState('load');
				if (!page.url().includes('/users/sign_in')) {
					console.log('Existing Keycloak session is still valid');
					return;
				}
				console.log('Keycloak session expired, re-authenticating');
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.log(`Failed to load Keycloak session, performing fresh login: ${errorMessage}`);
			}
		}

		// Peform Keycloak login
		await this.loginPage.loginWithKeycloak(username, password);

		// Save session state for reuse
		const storageState = await page.context().storageState();
		if (!fs.existsSync(STORAGE_DIR)) {
			fs.mkdirSync(STORAGE_DIR, { recursive: true });
		}
		fs.writeFileSync(storageFile, JSON.stringify(storageState, null, 2));
		console.log(`Keycloak session saved to ${path.basename(storageFile)}`);
	}

	/**
	 * Dispose and optionally logout
	 * @param cleanup - If true, performs logout before cleanup
	 */
	async dispose(cleanup: boolean = false): Promise<void> {
		if (cleanup && this.loginPage) {
			try {
				await this.loginPage.performLogout();
				console.log('Logout successful');
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.log(`Logout failed or already logged out: ${errorMessage}`);
			}
		}

		console.log('Cleanup completed');
	}
}
