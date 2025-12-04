// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
//   # Simone Bianchelli
// Import images
// Images are provided by Decidim asset packs / ERB templates — do not import them here.

document.addEventListener('DOMContentLoaded', () => {
	// Logo and icons are inserted server-side by Rails templates (Decidim asset packs).
	// This script only controls interactive behaviour (dropdown toggles).

	// Setup user dropdown
	const userButton = document.getElementById('user-dropdown-button');
	const userDropdown = document.getElementById('user-dropdown');
	const toolsDropdown = document.getElementById('tools-dropdown');

	if (userButton && userDropdown) {
		// Toggle dropdown on button click
		userButton.addEventListener('click', e => {
			e.stopPropagation();
			userDropdown.classList.toggle('hidden');

			// Close tools dropdown when opening user dropdown
			if (toolsDropdown && !userDropdown.classList.contains('hidden')) {
				toolsDropdown.style.display = 'none';
			}
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', e => {
			if (!userButton.contains(e.target) && !userDropdown.contains(e.target)) {
				userDropdown.classList.add('hidden');
			}
		});
	}
});
