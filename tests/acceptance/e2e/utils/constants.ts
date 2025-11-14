/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Simone Bianchelli
 */

import path = require('path');

// Constants for test organization
export const STORAGE_STATE = {
	USER: path.resolve(__dirname, '../../../acceptance/e2e/auth/user-state.json'),
	ADMIN: path.resolve(__dirname, '../../../acceptance/e2e/auth/admin-state.json'),
	ACCOUNT_DELETION_USER: path.resolve(__dirname, '../../../acceptance/e2e/auth/account-deletion-user-state.json'),
	USER_WITHOUT_MESSAGES: path.resolve(__dirname, '../../../acceptance/e2e/auth/user-without-messages-state.json'),
	KEYCLOAK_ADMIN: path.resolve(__dirname, '../../../acceptance/e2e/auth/keycloak-admin-state.json'),
	KEYCLOAK_USER: path.resolve(__dirname, '../../../acceptance/e2e/auth/keycloak-user-state.json')
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
	COOKIES: {
		BANNER: '#dc-dialog-wrapper.cookies__container',
		BANNER_WRAPPER: '#dc-dialog-wrapper',
		ACCEPT_ALL_BUTTON: '#dc-dialog-accept',
		ACCEPT_ESSENTIAL_BUTTON: '#dc-dialog-reject',
		REJECT_ALL_BUTTON: 'button[data-testid="reject-all-cookies"]', // Keep as fallback
		SETTINGS_BUTTON: '#dc-dialog-settings',
		DIALOG: '[data-dialog-target="dc-modal"]',
		MODAL: '#dc-modal',
		MODAL_ACCEPT_BUTTON: '#dc-modal-accept',
		MODAL_REJECT_BUTTON: '#dc-modal-reject',
		MODAL_SAVE_BUTTON: '#dc-modal-save',
		PREFERENCES_CHECKBOX: '#dc-preferences',
		ANALYTICS_CHECKBOX: '#dc-analytics',
		MARKETING_CHECKBOX: '#dc-marketing',
		PREFERENCES_TOGGLE: 'label[for="dc-preferences"]',
		ANALYTICS_TOGGLE: 'label[for="dc-analytics"]',
		MARKETING_TOGGLE: 'label[for="dc-marketing"]',
		SAVE_BUTTON: '#dc-modal-save'
	},

	SUCCESS_MESSAGE: '[data-testid="success-message"]',
	ERROR_MESSAGE: '[data-testid="error-message"]',
	ADMIN_BAR: '#admin-bar'
} as const;

export const TEST_ASSETS = {
	TEST_IMAGE: path.resolve(__dirname, '../test-assets/test.jpg'),
	TEST_CSV: path.resolve(__dirname, '../test-assets/private-participants.csv'),
	NOT_VALID_FILE: path.resolve(__dirname, '../test-assets/not.valid.file')
} as const;

export const BASE_URLS = {
	USED: process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app',
	LOCAL: 'http://localhost:3000',
	STAGING: process.env.STAGING_URL || 'https://staging.example.com',
	PRODUCTION: process.env.PROD_URL || 'https://production.example.com'
} as const;

export const EMAIL_URLS = {
	LETTER_OPENER: `${process.env.FE_BASE_URL || 'http://localhost:3000'}/letter_opener/`,
	OVH_MAIL: process.env.OVH_URL || 'https://www.ovhcloud.com/es-es/mail/'
} as const;

export const GRAFANA_URLS = {
	BASE: process.env.GRAFANA_BASE_URL || 'https://part-int.ldttoolbox.app/analytics/grafana',
	LOGIN: `${process.env.GRAFANA_BASE_URL || 'https://part-int.ldttoolbox.app/analytics/grafana'}/login`,
	API_ORG: `${process.env.GRAFANA_BASE_URL || 'https://part-int.ldttoolbox.app/analytics/grafana'}/api/org`
} as const;
