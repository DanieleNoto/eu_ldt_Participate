/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Page } from '@playwright/test';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';

interface ToolApplication {
	order: number;
	name: string;
	url: string;
	icon: string;
}

interface ToolGroup {
	name: string;
	order: number;
	applications: ToolApplication[];
}

interface AdminHeaderResponse {
	groups: ToolGroup[];
}

export class IntegratedEnvironmentPage extends AuthenticatedPage {
	private readonly ldtAdminHeader = this.page.locator('.ldt-admin-header');
	private readonly ldtLogo = this.page.locator('#ldt-logo');
	private readonly toolsButton = this.page.locator('#tools-dropdown-button');
	private readonly helpButton = this.page.locator('#help-link');
	private readonly userButton = this.page.locator('#user-dropdown-button');
	private readonly toolsDropdown = this.page.locator('#tools-dropdown');
	private readonly applicationLinks = this.page.locator('.application-link');

	constructor(page: Page) {
		super(page);
	}

	/**
	 * Verify LDT Admin Header is present
	 */
	async verifyLDTAdminHeaderPresent(): Promise<boolean> {
		return await this.ldtAdminHeader.isVisible();
	}

	/**
	 * Verify LDT Logo is present
	 */
	async verifyLDTLogoPresent(): Promise<boolean> {
		return await this.ldtLogo.isVisible();
	}

	/**
	 * Verify Tools button is present
	 */
	async verifyToolsButtonPresent(): Promise<boolean> {
		return await this.toolsButton.isVisible();
	}

	/**
	 * Verify Help button is present
	 */
	async verifyHelpButtonPresent(): Promise<boolean> {
		return await this.helpButton.isVisible();
	}

	/**
	 * Verify User button is present
	 */
	async verifyUserButtonPresent(): Promise<boolean> {
		return await this.userButton.isVisible();
	}

	/**
	 * Click on Tools button to open dropdown
	 */
	async clickToolsButton(): Promise<void> {
		await this.toolsButton.click();
		await this.toolsDropdown.waitFor({ state: 'visible' });
		await this.page.waitForLoadState('domcontentloaded');
	}

	/**
	 * Fetch tools from API endpoint
	 */
	async fetchToolsFromAPI(): Promise<AdminHeaderResponse> {
		const response = await this.page.request.get('/admin/admin_header/applications');

		if (!response.ok()) {
			throw new Error(`API request failed with status ${response.status()}`);
		}

		const data: AdminHeaderResponse = await response.json();
		console.log(`Fetched ${data.groups.length} tool groups from API`);

		return data;
	}

	/**
	 * Get all available tools from UI
	 */
	async getAvailableToolsFromUI(): Promise<Array<{ name: string; href: string }>> {
		const tools: Array<{ name: string; href: string }> = [];
		const linksCount = await this.applicationLinks.count();

		for (let i = 0; i < linksCount; i++) {
			const link = this.applicationLinks.nth(i);
			const name = await link.locator('span:last-of-type').textContent();
			const href = await link.getAttribute('href');

			if (name && href) {
				tools.push({
					name: name.trim(),
					href: href
				});
			}
		}

		return tools;
	}

	/**
	 * Verify tools match between API and UI
	 */
	async verifyToolsMatchAPIandUI(): Promise<{
		apiTools: string[];
		uiTools: string[];
		missing: string[];
		extra: string[];
	}> {
		// Fetch from API
		const apiData = await this.fetchToolsFromAPI();
		const apiTools: string[] = [];

		apiData.groups.forEach(group => {
			group.applications.forEach(app => {
				apiTools.push(app.name);
			});
		});

		console.log(`API Tools (${apiTools.length}): ${apiTools.join(', ')}`);

		// Fetch from UI
		const uiTools = await this.getAvailableToolsFromUI();
		const uiToolNames = uiTools.map(t => t.name);

		console.log(`UI Tools (${uiToolNames.length}): ${uiToolNames.join(', ')}`);

		// Compare
		const missing = apiTools.filter(tool => !uiToolNames.includes(tool));
		const extra = uiToolNames.filter(tool => !apiTools.includes(tool));

		if (missing.length === 0 && extra.length === 0) {
			console.log('All tools match between API and UI');
		} else {
			if (missing.length > 0) {
				console.log(`Missing tools in UI: ${missing.join(', ')}`);
			}
			if (extra.length > 0) {
				console.log(`Extra tools in UI: ${extra.join(', ')}`);
			}
		}

		return {
			apiTools,
			uiTools: uiToolNames,
			missing,
			extra
		};
	}

	/**
	 * Get tool groups from API
	 */
	async getToolGroupsFromAPI(): Promise<string[]> {
		const apiData = await this.fetchToolsFromAPI();
		return apiData.groups.map(group => group.name);
	}

	/**
	 * Verify all tools open in new tab
	 */
	async verifyToolsOpenInNewTab(): Promise<{
		allOpenInNewTab: boolean;
		failedTools: Array<{ name: string; opensInNewTab: boolean }>;
	}> {
		const tools = await this.getAvailableToolsFromUI();
		const failedTools: Array<{ name: string; opensInNewTab: boolean }> = [];

		for (const tool of tools) {
			const toolLink = this.page.locator(`.application-link:has(span:has-text("${tool.name}"))`);
			const target = await toolLink.getAttribute('target');
			const opensInNewTab = target === '_blank';

			if (!opensInNewTab) {
				failedTools.push({ name: tool.name, opensInNewTab });
				console.log(`${tool.name}: Does not open in new tab`);
			} else {
				console.log(`${tool.name}: Opens in new tab`);
			}
		}

		const allOpenInNewTab = failedTools.length === 0;
		return { allOpenInNewTab, failedTools };
	}

	/**
	 * Verify all tools are visible in UI
	 */
	async verifyAllToolsVisible(): Promise<{
		allVisible: boolean;
		failedTools: string[];
	}> {
		const tools = await this.getAvailableToolsFromUI();
		const failedTools: string[] = [];

		for (const tool of tools) {
			try {
				const toolLink = this.page.locator(`.application-link:has(span:has-text("${tool.name}"))`);
				await toolLink.waitFor({ state: 'attached' });
				const isVisible = await toolLink.isVisible();

				if (!isVisible) {
					failedTools.push(tool.name);
					console.log(`${tool.name}: Not visible`);
				} else {
					console.log(`${tool.name}: Is visible`);
				}
			} catch (error) {
				failedTools.push(tool.name);
				if (error instanceof Error) {
					console.warn(`${tool.name}: Check failed - ${error.message}`);
				} else {
					console.warn(`${tool.name}: Check failed - Unknown error`);
				}
			}
		}

		return {
			allVisible: failedTools.length === 0,
			failedTools
		};
	}

	/**
	 * Verify tools accessibility via HTTP request
	 */
	async verifyToolsAccessible(): Promise<{
		accessible: boolean;
		loaded: boolean;
		results: Array<{
			name: string;
			url: string;
			httpStatus: number;
			pageLoaded: boolean;
		}>;
	}> {
		const apiData = await this.fetchToolsFromAPI();
		const results = [];

		for (const group of apiData.groups) {
			for (const app of group.applications) {
				let httpStatus = 0;
				let pageLoaded = false;

				try {
					const response = await this.page.request.get(app.url);
					httpStatus = response.status();
					pageLoaded = httpStatus === 200;
				} catch (error) {
					if (error instanceof Error) {
						console.warn(`${app.name}: Request failed - ${error.message}`);
					} else {
						console.warn(`${app.name}: Request failed - Unknown error`);
					}
					httpStatus = 0;
					pageLoaded = false;
				}

				results.push({
					name: app.name,
					url: app.url,
					httpStatus,
					pageLoaded
				});

				const status = pageLoaded ? 'PASS' : 'FAIL';
				console.log(`${status} ${app.name}: HTTP ${httpStatus}`);
			}
		}

		const allAccessible = results.every(r => r.httpStatus === 200);
		const allLoaded = results.every(r => r.pageLoaded);

		return {
			accessible: allAccessible,
			loaded: allLoaded,
			results
		};
	}

	/**
	 * Logout from the application
	 */
	async logout(): Promise<void> {
		await this.userButton.click();
		const logoutLink = this.page.getByRole('link', { name: 'Log out' });
		await logoutLink.waitFor({ state: 'visible' });
		await logoutLink.click();
	}
}
