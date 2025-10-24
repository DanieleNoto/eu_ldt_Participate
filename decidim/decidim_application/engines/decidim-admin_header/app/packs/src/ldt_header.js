// Import images
import helpIconPath from '../images/decidim/admin_header/help.svg';
import logoPath from '../images/decidim/admin_header/ldt-logo.png';
import userIconPath from '../images/decidim/admin_header/user.svg';

document.addEventListener('DOMContentLoaded', () => {
	// Setup logo
	const container = document.getElementById('ldt-logo');
	if (container) {
		const img = document.createElement('img');
		img.src = logoPath;
		img.alt = 'LDT Logo';
		img.classList.add('ldt-logo');
		container.appendChild(img);
	}

	// Setup help icon and link (if help button exists)
	const helpLink = document.getElementById('help-link');
	const helpIcon = document.getElementById('help-icon');
	if (helpLink && helpIcon) {
		helpIcon.src = helpIconPath;
		// href is already set in the template from ENV['HELP_URL']
	}

	// Setup user icon
	const userIcon = document.getElementById('user-icon');
	if (userIcon) {
		userIcon.src = userIconPath;
	}

	// Setup user dropdown
	const userButton = document.getElementById('user-dropdown-button');
	const userDropdown = document.getElementById('user-dropdown');
	const toolsDropdown = document.getElementById('tools-dropdown');

	if (userButton && userDropdown) {
		// Toggle dropdown on button click
		userButton.addEventListener('click', (e) => {
			e.stopPropagation();
			userDropdown.classList.toggle('hidden');
			
			// Close tools dropdown when opening user dropdown
			if (toolsDropdown && !userDropdown.classList.contains('hidden')) {
				toolsDropdown.style.display = 'none';
			}
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', (e) => {
			if (!userButton.contains(e.target) && !userDropdown.contains(e.target)) {
				userDropdown.classList.add('hidden');
			}
		});
	}
});

