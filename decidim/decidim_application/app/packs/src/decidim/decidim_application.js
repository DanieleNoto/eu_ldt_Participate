// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Gianfranco Cedro
//   # Marco Pinnella
//   # Simone Bianchelli
// This file is compiled inside Decidim core pack. Code can be added here and will be executed
// as part of that pack

// Initialize Decidim.config early to prevent undefined values when assets are precompiled
window.Decidim = window.Decidim || {};
window.Decidim.config = window.Decidim.config || {
	_data: {},
	get: function (key) {
		return this._data[key];
	},
	set: function (config) {
		Object.assign(this._data, config);
	}
};

// Set critical default values that must exist before any Decidim code runs
// These will be overridden by server-side config loaded from the layout
if (!window.Decidim.config.get('consent_cookie_name')) {
	window.Decidim.config.set({ consent_cookie_name: 'decidim-consent' });
}

// Disable PWA and unregister service worker in development
localStorage.setItem('pwaInstallPromptSeen', true);
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'production') {
	navigator.serviceWorker.getRegistrations().then(function (registrations) {
		for (let registration of registrations) {
			registration.unregister();
		}
	});
}

// Load images
require.context('../../images', true);

// Import custom styles
import '../../stylesheets/decidim/decidim_application.scss';

// Import Keycloak auto-login functionality
import './keycloak_auto_login';

import * as ActiveStorage from '@rails/activestorage';

ActiveStorage.start();

const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
	this._isDirectUpload = url && url.includes('/rails/active_storage/direct_uploads');
	return originalXHROpen.apply(this, [method, url, ...rest]);
};
const originalXHRSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function (...args) {
	if (this._isDirectUpload) {
		const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute('content');
		if (csrfToken) {
			this.setRequestHeader('X-CSRF-Token', csrfToken);
		}
	}
	return originalXHRSend.apply(this, args);
};

const rootScope = typeof globalThis === 'undefined' ? undefined : globalThis;

if (rootScope) {
	rootScope.Decidim = rootScope.Decidim || {};
	rootScope.Decidim.currentDialogs = rootScope.Decidim.currentDialogs || {};

	// Fix cookie domain for consent cookies in compiled assets mode
	// Ensure cookies are saved with proper domain instead of "undefined"
	if (typeof document !== 'undefined' && typeof globalThis.window !== 'undefined') {
		const hostname = globalThis.window.location.hostname;
		// For localhost or IP addresses, don't set domain (use default)
		// For actual domains, use the hostname
		const cookieDomain = hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname) ? '' : hostname;
		rootScope.Decidim.cookieDomain = cookieDomain;
	}
}

// Skip the newsletter modal gate when the dialog cannot be initialized
const ensureNewsletterModalFallback = () => {
	if (typeof document === 'undefined') {
		return;
	}

	const modalId = 'sign-up-newsletter-modal';
	const registerForm = document.getElementById('register-form');
	const omniauthForm = document.getElementById('omniauth-register-form');
	if (!registerForm && !omniauthForm) {
		return;
	}

	let modal = document.getElementById(modalId);
	const dialogs = rootScope?.Decidim?.currentDialogs;
	const shouldBypassModal = !modal || !dialogs?.[modalId];
	if (!shouldBypassModal) {
		return;
	}

	if (!modal) {
		modal = document.createElement('div');
		modal.id = modalId;
		modal.hidden = true;
		if (document.body) {
			document.body.appendChild(modal);
		}
	}

	if (modal) {
		modal.dataset.continue = 'true';
	}
};

if (typeof document !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', ensureNewsletterModalFallback, { once: true });
	} else {
		ensureNewsletterModalFallback();
	}
}
