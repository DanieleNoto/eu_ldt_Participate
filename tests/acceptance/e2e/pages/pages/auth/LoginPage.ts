import { TEST_USERS } from '@config/test-users';
import { Locator, Page, expect } from '@playwright/test';
import { TEST_SELECTORS } from '@utils/constants';
import { ROUTES } from '@utils/routes';
import { BasePage } from '../../base/BasePage';

export class LoginPage extends BasePage {
	inputEmail: Locator;
	inputPassword: Locator;
	buttonLoginSubmit: Locator;
	adminHeaderComponent: Locator;

	constructor(page: Page) {
		super(page);
		this.inputEmail = this.page.locator(TEST_SELECTORS.LOGIN.EMAIL_INPUT);
		this.inputPassword = this.page.locator(TEST_SELECTORS.LOGIN.PASSWORD_INPUT);
		this.buttonLoginSubmit = this.page.locator(TEST_SELECTORS.LOGIN.LOGIN_BUTTON).first();
		this.adminHeaderComponent = this.page.locator(TEST_SELECTORS.HEADER.ADMIN_HEADER);
	}

	async goToThisPage() {
		await this.page.goto(ROUTES.loginPage.pattern);
		const isAlreadySignedIn = await this.checkUserAlreadySignIn();
		if (isAlreadySignedIn) {
			return; // If already signed in, no need to proceed
		}
		await this.inputEmail.waitFor({ state: 'visible' });
		await this.inputPassword.waitFor({ state: 'visible' });
		await this.buttonLoginSubmit.waitFor({ state: 'visible' });
	}

	async checkAdminAlreadySignIn() {
		return await this.adminHeaderComponent.isVisible();
	}

	async checkUserAlreadySignIn() {
		await this.page.waitForSelector(TEST_SELECTORS.HEADER.USER_MENU, { timeout: 10000 });
		return await this.page.locator(TEST_SELECTORS.HEADER.USER_MENU).isVisible();
	}

	async fillForm(email: string, password: string) {
		await this.inputEmail.fill(email);
		await this.inputPassword.fill(password);
	}

	async clickLoginLink() {
		await this.page.getByLabel('Log in', { exact: true }).click();
	}

	async clickLoginButton() {
		await this.buttonLoginSubmit.click();
	}

	// Complete login flow
	async login(email: string = 'admin@admin.com', password: string = 'decidim123456789') {
		await this.fillForm(email, password);
		await this.clickLoginButton();
	}

	async loginAsAdmin() {
		await this.login(TEST_USERS.ADMIN_USER.email, TEST_USERS.ADMIN_USER.password);
	}

	async loginAsUser() {
		await this.login(TEST_USERS.NORMAL_USER.email, TEST_USERS.NORMAL_USER.password);
	}

	// Validation methods
	async expectLoginSuccess() {
		await expect(this.page).toHaveURL(/\/(?!users\/sign_in)/);
	}

	async expectLoginError() {
		await expect(this.page.getByText('Invalid email or password')).toBeVisible();
	}

	async getLoginErrorMessage(): Promise<string | null> {
		try {
			const errorElement = await this.page.locator('.alert-danger, .error-message, [role="alert"]').first();
			return await errorElement.textContent();
		} catch {
			return null;
		}
	}

	// Form validation
	async expectEmailFieldError() {
		await expect(
			this.page.locator('#user_email').locator('xpath=following-sibling::*[contains(@class, "error")]')
		).toBeVisible();
	}

	async expectPasswordFieldError() {
		await expect(
			this.page.locator('#user_password').locator('xpath=following-sibling::*[contains(@class, "error")]')
		).toBeVisible();
	}

	// Logout
	async logout() {
		await this.page.getByRole('button', { name: 'A', exact: true }).click();
		await this.page.getByRole('link', { name: 'Log out' }).click();
	}
}
