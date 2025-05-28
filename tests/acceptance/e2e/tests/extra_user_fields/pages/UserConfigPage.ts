import { Page, expect } from '@playwright/test';

export class UserConfigPage {
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

	async navigateToMyAccount() {
		await this.page.getByRole('button', { name: 'A', exact: true }).click();
		await this.page.getByRole('link', { name: 'My account' }).click();
		await this.page.goto('http://localhost:3000/account');
	}

	async modifyUserFields() {
		await this.page.locator('#user_date_of_birth_date').click();
		await this.page.locator('#user_date_of_birth_date').fill('10/04/1996');
		await this.page.getByLabel('Gender*Required field Male').selectOption('female');
		await this.page.getByLabel('Country*Required').selectOption('IT');
		await this.page.getByRole('textbox', { name: 'Postal code Required field' }).click();
		await this.page.getByRole('textbox', { name: 'Postal code Required field' }).fill('00144');
		await this.page.getByRole('textbox', { name: 'Phone Number Required field' }).click();
		await this.page.getByRole('textbox', { name: 'Phone Number Required field' }).fill('3258023921');
		await this.page.getByRole('textbox', { name: 'Location Required field' }).click();
		await this.page.getByRole('textbox', { name: 'Location Required field' }).fill('Rome');
		await this.page.getByRole('button', { name: 'Update account' }).click();
	}
}
