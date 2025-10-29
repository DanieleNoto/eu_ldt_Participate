import { request, APIRequestContext, Page } from '@playwright/test';
import { randomUUID } from 'crypto';
import { GRAFANA_URLS } from './constants';

const DEFAULT_DEVICE_ID = process.env.GRAFANA_DEVICE_ID || randomUUID();

export class GrafanaAuthHelper {
  private apiContext: APIRequestContext | null = null;

  /**
   * Authenticate to Grafana and get storage state (cookies + origins)
   */
  async authenticateAndGetSession(username?: string, password?: string): Promise<any> {
    const user = username || process.env.GRAFANA_ADMIN_USERNAME || 'admin';
    const pass = password || process.env.GRAFANA_ADMIN_PASSWORD || 'admin';

    // Use ORIGIN as base so cookies are associated with the correct domain/origin
    this.apiContext = await request.newContext({
      baseURL: GRAFANA_URLS.ORIGIN,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json'
      }
    });

    const deviceId = process.env.GRAFANA_DEVICE_ID || DEFAULT_DEVICE_ID;

    const res = await this.apiContext.post(GRAFANA_URLS.LOGIN, {
      data: { user, password: pass },
      headers: { 'x-grafana-device-id': deviceId },
      maxRedirects: 10
    });

    if (!res.ok()) {
      const body = await res.text().catch(() => '');
      await this.dispose();
      throw new Error(`Grafana login failed: ${res.status()} - ${body}`);
    }

    const storageState = await this.apiContext.storageState();
    // keep apiContext so caller can dispose later via dispose(); return storageState
    return storageState;
  }

  /**
   * Inject Grafana session cookies into the given Playwright page context
   */
  async injectSessionIntoPage(page: Page, username?: string, password?: string): Promise<void> {
    const storageState = await this.authenticateAndGetSession(username, password);

    if (!storageState || !Array.isArray(storageState.cookies) || storageState.cookies.length === 0) {
      await this.dispose();
      throw new Error('No cookies received from Grafana authentication');
    }

    const origin = GRAFANA_URLS.ORIGIN;
    const normalized = storageState.cookies.map((c: any) => {
      const cookie: any = {
        name: c.name,
        value: c.value,
        path: c.path ?? '/',
        httpOnly: !!c.httpOnly,
        secure: !!c.secure,
        sameSite: c.sameSite ?? 'Lax'
      };
      if (c.domain && c.domain !== '') cookie.domain = c.domain;
      else cookie.url = origin;
      if (typeof c.expires === 'number' && c.expires > 0) cookie.expires = c.expires;
      return cookie;
    });

    await page.context().addCookies(normalized);

    // debug: list cookies in context (remove in production)
    // console.log('Cookies injected:', await page.context().cookies());
  }

  /**
   * Dispose API request context used for authentication
   */
  async dispose(): Promise<void> {
    if (this.apiContext) {
      try {
        await this.apiContext.dispose();
      } catch {
        // ignore dispose errors
      }
      this.apiContext = null;
    }
  }
}



// import { Page, APIRequestContext, request } from '@playwright/test';
// import { GRAFANA_URLS } from './constants';

// /**
//  * Helper class for Grafana authentication via API
//  */
// export class GrafanaAuthHelper {
// 	private apiContext: APIRequestContext | null = null;

// 	/**
// 	 * Authenticate to Grafana and get session cookies
// 	 * @param username - Grafana username (default from env)
// 	 * @param password - Grafana password (default from env)
// 	 * @returns Storage state with cookies
// 	 */
// 	async authenticateAndGetSession(username?: string, password?: string): Promise<any> {
// 		// Get credentials directly from environment variables
// 		const user = username || process.env.GRAFANA_ADMIN_USERNAME || 'admin';
// 		const pass = password || process.env.GRAFANA_ADMIN_PASSWORD || 'admin';

// 		// Create API context to track cookies
// 		this.apiContext = await request.newContext({
// 			baseURL: GRAFANA_URLS.BASE
// 		});

// 		// Login via POST to /login endpoint
// 		const loginResponse = await this.apiContext.post('/login', {
// 			data: {
// 				user: user,
// 				password: pass
// 			}
// 		});

// 		if (!loginResponse.ok()) {
// 			const body = await loginResponse.text();
// 			throw new Error(`Grafana login failed: ${loginResponse.status()} - ${body}`);
// 		}

// 		// Extract cookies from the API context
// 		const storageState = await this.apiContext.storageState();

// 		return storageState;
// 	}

// 	/**
// 	 * Inject Grafana session cookies into browser page
// 	 * @param page - Playwright page
// 	 * @param username - Optional username
// 	 * @param password - Optional password
// 	 */
// 	async injectSessionIntoPage(page: Page, username?: string, password?: string): Promise<void> {
// 		const sessionData = await this.authenticateAndGetSession(username, password);

// 		// Add cookies to the browser context
// 		if (sessionData.cookies && sessionData.cookies.length > 0) {
// 			await page.context().addCookies(sessionData.cookies);
// 		} else {
// 			throw new Error('No cookies received from Grafana authentication');
// 		}
// 	}

// 	/**
// 	 * Dispose the API context
// 	 */
// 	async dispose() {
// 		if (this.apiContext) {
// 			await this.apiContext.dispose();
// 			this.apiContext = null;
// 		}
// 	}
// }
