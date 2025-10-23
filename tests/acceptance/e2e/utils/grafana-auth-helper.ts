import { Page, APIRequestContext, request } from '@playwright/test';
import { GRAFANA_URLS } from './constants';

/**
 * Helper class for Grafana authentication via API
 */
export class GrafanaAuthHelper {
	private apiContext: APIRequestContext | null = null;

	/**
	 * Authenticate to Grafana and get session cookies
	 * @param username - Grafana username (default from env)
	 * @param password - Grafana password (default from env)
	 * @returns Storage state with cookies
	 */
	async authenticateAndGetSession(username?: string, password?: string): Promise<any> {
		// Get credentials directly from environment variables
		const user = username || process.env.GRAFANA_ADMIN_USERNAME || 'admin';
		const pass = password || process.env.GRAFANA_ADMIN_PASSWORD || 'admin';

		// Create API context to track cookies
		this.apiContext = await request.newContext({
			baseURL: GRAFANA_URLS.BASE
		});

		// Login via POST to /login endpoint
		const loginResponse = await this.apiContext.post('/login', {
			data: {
				user: user,
				password: pass
			}
		});

		if (!loginResponse.ok()) {
			const body = await loginResponse.text();
			throw new Error(`Grafana login failed: ${loginResponse.status()} - ${body}`);
		}

		// Extract cookies from the API context
		const storageState = await this.apiContext.storageState();

		return storageState;
	}

	/**
	 * Inject Grafana session cookies into browser page
	 * @param page - Playwright page
	 * @param username - Optional username
	 * @param password - Optional password
	 */
	async injectSessionIntoPage(page: Page, username?: string, password?: string): Promise<void> {
		const sessionData = await this.authenticateAndGetSession(username, password);

		// Add cookies to the browser context
		if (sessionData.cookies && sessionData.cookies.length > 0) {
			await page.context().addCookies(sessionData.cookies);
		} else {
			throw new Error('No cookies received from Grafana authentication');
		}
	}

	/**
	 * Dispose the API context
	 */
	async dispose() {
		if (this.apiContext) {
			await this.apiContext.dispose();
			this.apiContext = null;
		}
	}
}
