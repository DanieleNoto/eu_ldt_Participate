/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 * Gianfranco Cedro
 */

import { Page } from '@playwright/test';

/**
 * Utility class for handling localization in Playwright tests
 */
export class LocalizationUtils {
	/**
	 * Detect current locale from URL parameters
	 * @param page - Playwright page instance
	 * @returns The detected locale or 'en' as default
	 */
	static getCurrentLocale(page: Page): string {
		const currentUrl = page.url();
		const urlParams = new URLSearchParams(currentUrl.split('?')[1] || '');
		const locale = urlParams.get('locale');
		const detectedLocale = locale || 'en'; // Default to 'en' if no locale parameter is found
		console.log(`Detected locale: ${detectedLocale} from URL: ${currentUrl}`);
		return detectedLocale;
	}

	/**
	 * Build localized field selector based on current page locale
	 * @param page - Playwright page instance
	 * @param baseFieldName - The base field name without locale suffix
	 * @returns Localized selector string
	 */
	static getLocalizedFieldSelector(page: Page, baseFieldName: string): string {
		const locale = this.getCurrentLocale(page);
		const selector = `#${baseFieldName}_${locale}`;
		console.log(`Generated localized selector: ${selector}`);
		return selector;
	}

	/**
	 * Get working localized selector with fallback to English
	 * This method checks if the localized field exists and falls back to English if not found
	 * @param page - Playwright page instance
	 * @param baseFieldName - The base field name without locale suffix
	 * @returns Promise resolving to the working selector
	 */
	static async getWorkingLocalizedSelector(page: Page, baseFieldName: string): Promise<string> {
		const localizedSelector = this.getLocalizedFieldSelector(page, baseFieldName);

		// First try the localized version
		const localizedElement = page.locator(localizedSelector);
		if ((await localizedElement.count()) > 0) {
			console.log(`Using localized selector: ${localizedSelector}`);
			return localizedSelector;
		}

		// Fallback to default English version
		const defaultSelector = `#${baseFieldName}_en`;
		console.log(`Falling back to default selector: ${defaultSelector}`);
		return defaultSelector;
	}

	/**
	 * Check if a specific locale is supported by testing field existence
	 * @param page - Playwright page instance
	 * @param baseFieldName - The base field name to test
	 * @param locale - The locale to test
	 * @returns Promise resolving to boolean indicating if locale is supported
	 */
	static async isLocaleSupported(page: Page, baseFieldName: string, locale: string): Promise<boolean> {
		const selector = `#${baseFieldName}_${locale}`;
		const element = page.locator(selector);
		const exists = (await element.count()) > 0;
		console.log(
			`Locale '${locale}' support check for '${baseFieldName}': ${exists ? 'supported' : 'not supported'}`
		);
		return exists;
	}

	/**
	 * Get all available locales for a specific field by testing common locale patterns
	 * @param page - Playwright page instance
	 * @param baseFieldName - The base field name to test
	 * @returns Promise resolving to array of supported locales
	 */
	static async getAvailableLocales(page: Page, baseFieldName: string): Promise<string[]> {
		const commonLocales = ['en', 'it', 'fr', 'de', 'es', 'pt', 'nl', 'pl', 'cs', 'sk'];
		const availableLocales: string[] = [];

		for (const locale of commonLocales) {
			const isSupported = await this.isLocaleSupported(page, baseFieldName, locale);
			if (isSupported) {
				availableLocales.push(locale);
			}
		}

		console.log(`Available locales for '${baseFieldName}': ${availableLocales.join(', ')}`);
		return availableLocales;
	}

	/**
	 * Navigate to a specific page with locale parameter
	 * @param page - Playwright page instance
	 * @param url - The base URL to navigate to
	 * @param locale - The locale to set
	 */
	static async navigateWithLocale(page: Page, url: string, locale: string): Promise<void> {
		const separator = url.includes('?') ? '&' : '?';
		const localizedUrl = `${url}${separator}locale=${locale}`;
		console.log(`Navigating to: ${localizedUrl}`);
		await page.goto(localizedUrl);
		await page.waitForLoadState('networkidle');
	}

	/**
	 * Get locale-specific test data
	 * @param locale - The locale to get test data for
	 * @returns Object containing localized test strings
	 */
	static getLocalizedTestData(locale: string): {
		title: string;
		subtitle: string;
		shortDescription: string;
		description: string;
		announcement: string;
		hashtag: string;
	} {
		const testData = {
			en: {
				title: 'Test Participatory Process',
				subtitle: 'Test process subtitle',
				shortDescription: 'Short description of the participatory process for testing',
				description: 'Complete description of the participatory process in English',
				announcement: 'Important announcement for the participatory process',
				hashtag: '#testprocess'
			}
		};

		return testData[locale as keyof typeof testData] || testData.en;
	}

	/**
	 * Validate that all localized fields exist for a given locale
	 * @param page - Playwright page instance
	 * @param fieldNames - Array of base field names to validate
	 * @param locale - The locale to validate
	 * @returns Promise resolving to validation result
	 */
	static async validateLocalizedFields(
		page: Page,
		fieldNames: string[],
		locale: string
	): Promise<{ valid: boolean; missingFields: string[] }> {
		const missingFields: string[] = [];

		for (const fieldName of fieldNames) {
			const isSupported = await this.isLocaleSupported(page, fieldName, locale);
			if (!isSupported) {
				missingFields.push(fieldName);
			}
		}

		const valid = missingFields.length === 0;
		console.log(`Locale validation for '${locale}': ${valid ? 'valid' : 'invalid'}`);
		if (!valid) {
			console.log(`Missing fields: ${missingFields.join(', ')}`);
		}

		return { valid, missingFields };
	}
}

/**
 * Helper function to get localized text based on key
 * @param key - The text key in dot notation
 * @param locale - Optional locale (defaults to 'it')
 * @returns Localized text
 */
export function getLocalizedText(key: string, locale: string = 'en'): string {
	const texts = {
		en: {
			accountDeletion: {
				warningMessage: 'This action cannot be undone',
				helpText: 'Please, fill in the reason you want to delete your account (optional).',
				deleteButton: 'Delete my account',
				successMessage: 'Your account was successfully deleted.',
				errorMessage: 'An error occurred while deleting the account',
				reasonLabel: 'Reason why you want to delete your account',
				confirmationTitle: 'Confirm account deletion',
				confirmationMessage: 'Are you sure you want to delete your account?',
				confirmButton: 'Yes, delete my account',
				cancelButton: 'Cancel'
			},
			session: {
				timeoutMessage: 'Session has expired for security reasons'
			}
		}
	};

	const keys = key.split('.');
	let result: any = texts[locale as keyof typeof texts] || texts.en;

	for (const k of keys) {
		result = result?.[k];
	}

	return result || key;
}
