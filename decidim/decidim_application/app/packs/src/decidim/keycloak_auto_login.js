// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Gianfranco Cedro
/**
 * Keycloak Auto-Login Handler
 *
 * This module handles automatic Keycloak authentication when a user
 * is redirected to the login page with auto-login enabled.
 */

document.addEventListener('DOMContentLoaded', function () {
	// Check if we're on the login page
	const isLoginPage =
		window.location.pathname.includes('/users/sign_in') || document.querySelector('.login__info') !== null;

	if (!isLoginPage) {
		console.log('[Keycloak] Not on login page, skipping auto-login check');
		return;
	}

	// Check if auto-login is enabled via meta tag, URL parameter, or window flag
	const autoLoginMeta = document.querySelector('meta[name="keycloak-auto-login"]');
	const urlParams = new URLSearchParams(window.location.search);
	const autoLoginParam = urlParams.get('keycloak_auto_login');
	const autoLoginFlag = window.keycloakAutoLogin === true;

	// Check if there's a CSRF error message on the page
	const csrfError =
		document.body.textContent.includes('Csrf detected') ||
		document.body.textContent.includes('CSRF detected') ||
		document.body.textContent.includes('csrf_detected');

	if (!autoLoginMeta && !autoLoginParam && !autoLoginFlag && !csrfError) {
		console.log(
			'[Keycloak] Auto-login not enabled - no meta tag, URL parameter, session flag, or CSRF error found'
		);
		return;
	}

	if (csrfError) {
		console.log('[Keycloak] CSRF error detected - attempting auto-login retry');
	} else {
		console.log('[Keycloak] Auto-login enabled - attempting auto-login');
	}

	/**
	 * Find and click the Keycloak authentication button
	 * Retries multiple times with delays to handle dynamic content loading
	 *
	 * @param {number} retryCount - Current retry attempt number
	 * @returns {boolean} - True if button was found and clicked, false otherwise
	 */
	function findAndClickKeycloakButton(retryCount = 0) {
		const maxRetries = 10;
		const selectors = [
			'.login__omniauth-button--keycloakopenid',
			'a[href*="keycloakopenid"]',
			'[data-provider="keycloakopenid"]',
			'.button--keycloakopenid',
			'.omniauth-button-keycloakopenid',
			'a[href*="keycloak"]',
			'[data-turbo="false"][href*="keycloak"]',
			'[class*="keycloak"]',
			'[id*="keycloak"]'
		];

		console.log('Looking for Keycloak button, attempt', retryCount + 1);

		// Try to find button using predefined selectors
		for (const selector of selectors) {
			const element = document.querySelector(selector);
			if (element) {
				console.log('Found Keycloak button with selector:', selector, element);
				element.click();
				return true;
			}
		}

		// Fallback: search for any button/link containing "keycloak" in text or href
		const allButtons = document.querySelectorAll('a, button');
		for (const button of allButtons) {
			const text = button.textContent?.toLowerCase() || '';
			const href = button.href?.toLowerCase() || '';
			if (text.includes('keycloak') || href.includes('keycloak')) {
				console.log('Found Keycloak button by text/href:', button);
				button.click();
				return true;
			}
		}

		// Retry if max attempts not reached
		if (retryCount < maxRetries) {
			setTimeout(() => findAndClickKeycloakButton(retryCount + 1), 500);
			return false;
		}

		// Log debug information if button not found after all retries
		console.log('Keycloak button not found after', maxRetries, 'retries');
		console.log('Available omniauth buttons:', document.querySelectorAll('.login__omniauth-button'));
		console.log('Available links:', document.querySelectorAll('a[href*="omniauth"]'));
		console.log('All buttons on page:', document.querySelectorAll('button'));
		console.log('All links on page:', document.querySelectorAll('a'));

		return false;
	}

	console.log('Attempting Keycloak auto-login');

	// Try immediately first
	if (!findAndClickKeycloakButton()) {
		// If not found immediately, wait a bit and try again
		setTimeout(() => findAndClickKeycloakButton(0), 100);
	}
});
