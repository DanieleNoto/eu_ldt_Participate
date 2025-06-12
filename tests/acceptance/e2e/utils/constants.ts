// Constants for test organization
export const STORAGE_STATE = {
	USER: 'tests/acceptance/e2e/auth/user-state.json',
	ADMIN: 'tests/acceptance/e2e/auth/admin-state.json'
} as const;

export const TEST_TIMEOUTS = {
	DEFAULT: 30000,
	LONG: 60000,
	NAVIGATION: 120000
} as const;

export const TEST_SELECTORS = {
	LOGIN: {
		EMAIL_INPUT: '#session_user_email',
		PASSWORD_INPUT: '#session_user_password',
		LOGIN_BUTTON: '#session_new_user button[type="submit"]',
		LOGOUT_BUTTON: '[data-testid="logout-button"]',
		ALREADY_SIGNED_IN: 'div.flash.alert[text*="You are already signed in."]'
	},
	HEADER: {
		ADMIN_HEADER: '#admin-bar',
		LOGO: '[data-testid="header-logo"]',
		SEARCH_INPUT: '[data-testid="search-input"]',
		SEARCH_BUTTON: '[data-testid="search-button"]',
		LANGUAGE_SELECTOR: '[data-testid="language-selector"]',
		DESKTOP_LOGIN: 'a.main-bar__links-desktop__item[aria-label="Log in"]',
		MOBILE_LOGIN: 'a.main-bar__links-mobile__login',
		USER_MENU: '#trigger-dropdown-account',
		ACCOUNT_LINK: 'a[href$="account"], a[href$="account/"]'
	},
	USER_ACCOUNT: {
		UPDATE_ACCOUNT_BUTTON: 'form.edit_user button[type="submit"]'
	},

	SUCCESS_MESSAGE: '[data-testid="success-message"]',
	ERROR_MESSAGE: '[data-testid="error-message"]',
	ADMIN_BAR: '#admin-bar'
} as const;

export const BASE_URLS = {
	USED: process.env.FE_BASE_URL || 'http://localhost:3000',
	LOCAL: 'http://localhost:3000',
	STAGING: process.env.STAGING_URL || 'https://staging.example.com',
	PRODUCTION: process.env.PROD_URL || 'https://production.example.com'
} as const;
