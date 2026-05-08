// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
//   # Simone Bianchelli
document.addEventListener('DOMContentLoaded', function () {
	initializeToolsDropdown();
});

function initializeToolsDropdown() {
	const toolsButton = document.getElementById('tools-dropdown-button');
	const toolsDropdown = document.getElementById('tools-dropdown');
	const userDropdown = document.getElementById('user-dropdown');

	if (toolsButton && toolsDropdown) {
		// Ensure dropdown starts hidden
		toolsDropdown.classList.add('hidden');
		toolsButton.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();

			const isVisible = !toolsDropdown.classList.contains('hidden');
			if (isVisible) {
				toolsDropdown.classList.add('hidden');
			} else {
				toolsDropdown.classList.remove('hidden');
			}

			// Close user dropdown when opening tools dropdown
			if (userDropdown && !toolsDropdown.classList.contains('hidden')) {
				userDropdown.classList.add('hidden');
			}

			if (!isVisible) {
				loadApplications();
			}
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', function (e) {
			if (!toolsButton.contains(e.target) && !toolsDropdown.contains(e.target)) {
				toolsDropdown.classList.add('hidden');
			}
		});
	} else {
		// Retry after a longer delay in case elements are inserted later
		setTimeout(function () {
			initializeToolsDropdown();
		}, 500);
	}

	function loadApplications() {
		// Show loading state
		toolsDropdown.innerHTML = '<div class="loading-spinner">Loading...</div>';

		// Call backend API to fetch applications (handles JWT + Tool0 communication)
		fetch('/admin/admin_header/applications')
			.then(response => {
				if (!response.ok) {
					throw new Error(`Failed to load applications: ${response.status}`);
				}
				return response.json();
			})
			.then(data => {
				renderApplications(data);
			})
			.catch(error => {
				renderError(error.message);
			});
	}

	function renderApplications(data) {
		if (!data.groups || data.groups.length === 0) {
			const emptyDiv = document.createElement('div');
			emptyDiv.className = 'p-4 text-center text-gray-600 text-sm';
			emptyDiv.textContent = 'No applications available';
			toolsDropdown.innerHTML = '';
			toolsDropdown.appendChild(emptyDiv);
			return;
		}

		// Wraps SVG markup in a fixed 24×24 span, forcing the SVG element's own
		// width/height attributes to 24 so the icon can't overflow its container.
		function buildSvgSpan(svgMarkup) {
			const span = document.createElement('span');
			span.style.cssText = 'display:inline-flex;flex-shrink:0;width:24px;height:24px;overflow:hidden;';
			span.innerHTML = svgMarkup;
			const svgEl = span.querySelector('svg');
			if (svgEl) {
				svgEl.setAttribute('width', '24');
				svgEl.setAttribute('height', '24');
				svgEl.style.cssText = 'width:24px;height:24px;';
			}
			return span;
		}

		// Helper to build an icon DOM element from whatever format Tool0 returns.
		// Supported formats:
		//   • data:image/svg+xml;base64,…  → decoded inline SVG
		//   • raw SVG markup (<svg …)       → inline SVG
		//   • any other data URI            → <img src="…">
		//   • http(s):// or absolute path   → <img src="…">
		// Returns null when the string is empty/unrecognised.
		function buildIconElement(iconString) {
			if (!iconString) return null;

			// base64-encoded SVG data URI → decode and inline
			if (iconString.startsWith('data:image/svg+xml;base64,')) {
				const base64 = iconString.slice('data:image/svg+xml;base64,'.length);
				try {
					return buildSvgSpan(atob(base64));
				} catch (e) {
					console.error('Error decoding SVG icon:', e);
				}
			}

			// Raw SVG markup
			if (iconString.trimStart().startsWith('<svg')) {
				return buildSvgSpan(iconString);
			}

			// Any remaining data URI (PNG, ICO, JPEG, …) or plain URL / absolute path
			if (
				iconString.startsWith('data:') ||
				iconString.startsWith('http://') ||
				iconString.startsWith('https://') ||
				iconString.startsWith('/')
			) {
				const img = document.createElement('img');
				img.src = iconString;
				img.alt = '';
				img.className = 'application-icon';
				img.style.cssText = 'width:24px;height:24px;flex-shrink:0;object-fit:contain;';
				return img;
			}

			return null;
		}

		// Helper to render a single application item (returns DOM element)
		function renderAppItem(app) {
			const item = document.createElement('div');
			item.className = 'application-item';

			const link = document.createElement('a');
			link.href = escapeHtml(app.url);
			link.target = '_blank';
			link.className = 'application-link';

			// Mark "Participate" as selected (check by name)
			if (app.name && app.name.toLowerCase().includes('participate')) {
				link.classList.add('selected');
			}

			const iconElement = buildIconElement(app.icon);
			if (iconElement) {
				link.appendChild(iconElement);
			} else {
				// Fallback: generic grid icon (not a hamburger)
				const iconSpan = document.createElement('span');
				iconSpan.innerHTML =
					'<svg fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>';
				link.appendChild(iconSpan);
			}

			const nameSpan = document.createElement('span');
			nameSpan.textContent = app.name;
			link.appendChild(nameSpan);

			item.appendChild(link);
			return item;
		}

		// Helper to render a group with optional separator (returns DOM element)
		function renderGroup(group, index) {
			if (!group.applications || group.applications.length === 0) return null;

			const sortedApps = group.applications.sort((a, b) => (a.order || 0) - (b.order || 0));
			const groupId = `tools-group-${index}`;

			const groupDiv = document.createElement('div');
			groupDiv.className = 'application-group';

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'group-header-toggle';
			btn.setAttribute('data-group', groupId);
			btn.setAttribute('aria-expanded', 'true');

			const nameSpan = document.createElement('span');
			nameSpan.textContent = group.name;
			btn.appendChild(nameSpan);

			const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			arrow.setAttribute('data-arrow', groupId);
			arrow.setAttribute('viewBox', '0 0 24 24');
			arrow.innerHTML = '<path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>';
			btn.appendChild(arrow);

			groupDiv.appendChild(btn);

			const appsContainer = document.createElement('div');
			appsContainer.className = 'group-applications';
			appsContainer.id = groupId;

			sortedApps.forEach(app => {
				appsContainer.appendChild(renderAppItem(app));
			});

			groupDiv.appendChild(appsContainer);
			return groupDiv;
		}

		// Clear and rebuild the dropdown
		toolsDropdown.innerHTML = '';
		const sortedGroups = data.groups.sort((a, b) => (a.order || 0) - (b.order || 0));
		sortedGroups.forEach((grp, idx) => {
			const groupElement = renderGroup(grp, idx);
			if (groupElement) {
				toolsDropdown.appendChild(groupElement);
				if (idx < sortedGroups.length - 1) {
					const hr = document.createElement('hr');
					toolsDropdown.appendChild(hr);
				}
			}
		});

		// Add toggle logic for group dropdowns
		document.querySelectorAll('.group-header-toggle').forEach(btn => {
			btn.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				const groupId = btn.getAttribute('data-group');
				const groupDiv = document.getElementById(groupId);
				const isExpanded = btn.getAttribute('aria-expanded') === 'true';

				if (isExpanded) {
					groupDiv.classList.add('collapsed');
					btn.setAttribute('aria-expanded', 'false');
				} else {
					groupDiv.classList.remove('collapsed');
					btn.setAttribute('aria-expanded', 'true');
				}
			});
		});
	}

	function renderError(message = 'Failed to load applications') {
		const errorDiv = document.createElement('div');
		errorDiv.className = 'error-message';
		errorDiv.textContent = message;
		toolsDropdown.innerHTML = '';
		toolsDropdown.appendChild(errorDiv);
	}

	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}
}
