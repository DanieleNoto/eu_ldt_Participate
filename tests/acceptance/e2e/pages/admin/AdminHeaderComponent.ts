import { AuthenticatedPage } from '@pages/base/AuthenticatedPage';
import { Page } from '@playwright/test';

export class AdminHeaderComponent extends AuthenticatedPage {
	constructor(page: Page) {
		super(page);
	}

	async navigateToAdminDashboard() {
		await this.page.getByRole('link', { name: 'Admin dashboard' }).click();
	}
}
