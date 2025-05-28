import { Page, expect } from '@playwright/test';

export class AdminConfigPage {
	constructor(private page: Page) {}

	async navigateToHomePage() {
		await this.page.goto('http://localhost:3000/');
	}

	async clickLoginLink() {
		await this.page.getByLabel('Log in', { exact: true }).click();
	}

	async navigateToSignIn() {
		await this.page.goto('http://localhost:3000/users/sign_in');
	}

	async acceptCookies() {
		await this.page.getByRole('button', { name: 'Accept all' }).click();
	}

	async loginAsAdmin(email: string = 'admin@admin.com', password: string = 'decidim123456789') {
		await this.page.getByRole('textbox', { name: 'Email Required field' }).click();
		await this.page.getByRole('textbox', { name: 'Email Required field' }).fill(email);
		await this.page.getByRole('textbox', { name: 'Password Required field' }).click();
		await this.page.getByRole('textbox', { name: 'Password Required field' }).fill(password);
		await this.page.getByRole('button', { name: 'Log in' }).click();
	}

	async navigateToAdminDashboard() {
		await this.page.goto('http://localhost:3000/');
		await this.page.getByRole('link', { name: 'Admin dashboard' }).click();
	}

	async navigateToSettings() {
		await this.page.goto('http://localhost:3000/admin/');
		await this.page.getByRole('link', { name: 'Settings' }).click();
	}

	async navigateToExtraUserFields() {
		await this.page.goto('http://localhost:3000/admin/organization/edit');
		await this.page.getByRole('link', { name: 'Manage extra user fields' }).click();
	}

	async enableAllExtraUserFields() {
		await this.page.goto('http://localhost:3000/admin/extra_user_fields/');
		await this.page.getByRole('checkbox', { name: 'Enable extra user fields' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable date of birth field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable country field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable postal code field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable gender field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable phone number field' }).check();
		await this.page.getByRole('checkbox', { name: 'Enable location field' }).check();
	}

	async saveConfiguration() {
		await this.page.getByRole('button', { name: 'Save configuration' }).click();
	}

	async navigateToExtraUserFieldsManagement() {
		await this.page.goto('http://localhost:3000/admin/extra_user_fields/extra_user_fields');
	}

	async simulateServerErrorOnSave() {
		// Intercept only XHR/fetch requests to the save endpoint
		await this.page.route('**/admin/extra_user_fields/extra_user_fields', route => {
			const method = route.request().method();
			const resourceType = route.request().resourceType();

			if (
				(method === 'POST' || method === 'PUT' || method === 'PATCH') &&
				(resourceType === 'xhr' || resourceType === 'fetch')
			) {
				route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Internal Server Error' })
				});
			} else {
				route.continue();
			}
		});
	}

	async simulateNetworkErrorOnSave() {
		// Intercept only XHR/fetch requests to the save endpoint
		await this.page.route('**/admin/extra_user_fields/extra_user_fields', route => {
			const method = route.request().method();
			const resourceType = route.request().resourceType();

			if (
				(method === 'POST' || method === 'PUT' || method === 'PATCH') &&
				(resourceType === 'xhr' || resourceType === 'fetch')
			) {
				route.abort('failed');
			} else {
				route.continue();
			}
		});
	}

	async waitForErrorMessage() {
		return await this.page.waitForSelector('[role="alert"], .alert-danger, .error-message');
	}

	async getErrorMessage() {
		const errorElement = await this.page.locator('[role="alert"], .alert-danger, .error-message').first();
		return await errorElement.textContent();
	}
	async clearNetworkInterception() {
		await this.page.unroute('**/admin/extra_user_fields/extra_user_fields');
	}

	async retrySave() {
		await this.clearNetworkInterception();
		await this.saveConfiguration();
	}

	async checkSuccessMessage() {
		return await expect(this.page.getByText('Extra user fields correctly')).toBeVisible();
	}
}
