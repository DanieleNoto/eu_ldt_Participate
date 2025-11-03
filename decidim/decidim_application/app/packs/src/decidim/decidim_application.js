// This file is compiled inside Decidim core pack. Code can be added here and will be executed
// as part of that pack

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
