/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Simone Bianchelli
 */

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
