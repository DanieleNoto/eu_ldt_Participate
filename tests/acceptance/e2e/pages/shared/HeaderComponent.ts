import { BasePage } from '@pages/base/BasePage';
import { Locator, Page } from '@playwright/test';
import { TEST_SELECTORS } from '@utils/constants';

export class HeaderComponent extends BasePage {
	buttonLogin: Locator;
	buttonLogout: Locator;
	linkMyInformation: Locator;

	constructor(page: Page) {
		super(page);
		this.buttonLogin = this.page.locator('a[href*="sign_in"], a[href*="login"]');
		this.buttonLogout = this.page.getByTestId('logout-button-header');
		this.linkMyInformation = this.page.getByTestId('my-information-link-header');
	}

	async goToLoginPage() {
		const desktopLogin = this.page.locator(TEST_SELECTORS.HEADER.DESKTOP_LOGIN);
		const mobileLogin = this.page.locator(TEST_SELECTORS.HEADER.MOBILE_LOGIN);

		if (await desktopLogin.isVisible()) {
			await desktopLogin.click();
		} else if (await mobileLogin.isVisible()) {
			await mobileLogin.click();
		} else {
			// Fallback al terzo elemento
			await this.page.getByLabel('My account').getByRole('link', { name: 'Log in' }).click();
		}
		await this.page.waitForLoadState('networkidle');
	}
}
