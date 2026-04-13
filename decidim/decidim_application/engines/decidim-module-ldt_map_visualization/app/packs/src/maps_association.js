// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
// # Gianfranco Cedro
let selectedMap = null;

// Pagination state
let currentPage = 0;
let pageSize = 20;
let hasMore = false;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function () {
	console.log('DOMContentLoaded fired - initializing maps_association');

	// Setup event handlers
	initPagination();
	setupRadioHandlers();
	setupCancelHandler();
	setupSubmitHandler();
	setupInputValidation();
	console.log('Handlers setup complete');
});

function setupRadioHandlers() {
	// Wire up radio buttons to select map and show form
	document.querySelectorAll('.select-map-radio').forEach(radio => {
		radio.addEventListener('change', function () {
			if (this.checked) {
				const mapId = this.value;
				const row = this.closest('tr');

				// Extract map data from the table row
				selectedMap = {
					id: mapId,
					name: row.querySelector('[data-label="Name"]')?.textContent.trim() || '',
					owner: row.querySelector('[data-label="Owner"]')?.textContent.trim() || '',
					scope: row.querySelector('[data-label="Scope"]')?.textContent.trim() || '',
					description: row.querySelector('[data-label="Description"]')?.textContent.trim() || '',
					map_image: row.querySelector('img')?.src || null
				};

				console.log('Map selected:', selectedMap);
				showFormWithDetails(selectedMap);
			}
		});
	});
	console.log('Radio handlers registered for', document.querySelectorAll('.select-map-radio').length, 'radios');
}

function setupCancelHandler() {
	const cancelBtn = document.getElementById('reset-button');
	if (cancelBtn) {
		cancelBtn.addEventListener('click', function (e) {
			e.preventDefault();
			console.log('Cancel button clicked');

			// Clear selection
			selectedMap = null;
			document.querySelectorAll('.select-map-radio').forEach(r => (r.checked = false));

			// Clear map info
			const infoDiv = document.querySelector('[data-selected-map-info]');
			if (infoDiv) infoDiv.innerHTML = '';

			// Clear inputs
			const nameInput = document.getElementById('map-name');
			if (nameInput) nameInput.value = '';

			const mapIdField = document.getElementById('map-id-field');
			if (mapIdField) mapIdField.value = '';

			const mapDataField = document.getElementById('map-data-field');
			if (mapDataField) mapDataField.value = '';
		});
	}
}

function setupSubmitHandler() {
	// Find the form that contains our map-name field
	const nameInput = document.getElementById('map-name');
	const form = nameInput ? nameInput.closest('form') : null;

	if (form) {
		// Intercept form submission to validate
		form.addEventListener('submit', function (e) {
			const mapIdField = document.getElementById('map-id-field');
			const nameInput = document.getElementById('map-name');

			// Clear previous errors
			clearFieldErrors();

			let hasErrors = false;

			// Check if a map is selected
			if (!mapIdField || !mapIdField.value) {
				e.preventDefault();
				showError('Please select a map from the list above.');
				hasErrors = true;
			}

			// Check if name is filled
			if (!nameInput || !nameInput.value.trim()) {
				e.preventDefault();
				showFieldError(nameInput, 'name_required');
				hasErrors = true;
			}

			if (!hasErrors) {
				console.log('Form validation passed, submitting...');
				// Disable submit button to prevent double submission
				const submitBtn = document.getElementById('save-button');
				if (submitBtn) {
					submitBtn.disabled = true;
					submitBtn.textContent = 'Creating...';
				}
			}
			return !hasErrors;
		});
	}

	// Setup input event listeners to clear errors when user types
	setupInputValidation();
}

function showFormWithDetails(map) {
	// Set hidden fields
	const mapIdField = document.getElementById('map-id-field');
	if (mapIdField) mapIdField.value = map.id;

	const mapDataField = document.getElementById('map-data-field');
	if (mapDataField) mapDataField.value = JSON.stringify(map);

	// Update info div with map details
	const infoDiv = document.querySelector('[data-selected-map-info]');
	if (infoDiv) {
		infoDiv.innerHTML = `
      <div style="margin-bottom: 20px; padding: 15px; background-color: #f0f0f0; border-left: 4px solid #0066cc;">
        <h4>Selected Map</h4>
        <p><strong>Name:</strong> ${escapeHtml(map.name || 'N/A')}</p>
        <p><strong>ID:</strong> ${escapeHtml(map.id || 'N/A')}</p>
        <p><strong>Owner:</strong> ${escapeHtml(map.owner || 'N/A')}</p>
        <p><strong>Scope:</strong> ${escapeHtml(map.scope || 'N/A')}</p>
      </div>
    `;
	}

	// Focus on name input
	const nameInput = document.getElementById('map-name');
	if (nameInput) {
		nameInput.value = '';
		nameInput.focus();
	}
}

function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = String(text || '');
	return div.innerHTML;
}

// Form validation helper functions
function clearFieldErrors() {
	// Remove error classes from all inputs
	document.querySelectorAll('.form-control').forEach(input => {
		input.classList.remove('is-invalid-input');
	});

	// Hide all error messages
	document.querySelectorAll('.form-error').forEach(msg => {
		msg.classList.remove('is-visible');
	});
}

function showFieldError(inputElement, messageKey) {
	if (!inputElement) return;

	// Add error class to input
	inputElement.classList.add('is-invalid-input');

	// Find and show the corresponding error message
	const errorSpan = document.querySelector(`span[data-i18n="${messageKey}"]`);
	if (errorSpan) {
		// Create or update error message element
		let errorMsg = inputElement.parentNode.querySelector('.form-error');
		if (!errorMsg) {
			errorMsg = document.createElement('small');
			errorMsg.className = 'form-error';
			inputElement.parentNode.appendChild(errorMsg);
		}
		errorMsg.textContent = errorSpan.textContent;
		errorMsg.classList.add('is-visible');
	}

	// Focus the input
	inputElement.focus();
}

function showError(message) {
	// For general errors, show in a general error area
	const errorDiv = document.getElementById('error-state');
	if (errorDiv) {
		const errorMsg = errorDiv.querySelector('#error-message');
		if (errorMsg) {
			errorMsg.textContent = message;
			errorDiv.style.display = 'block';
		}
	} else {
		alert(message); // Fallback to alert if no error div
	}
}

function setupInputValidation() {
	// Clear errors when user starts typing
	document.querySelectorAll('.form-control').forEach(input => {
		input.addEventListener('input', function () {
			if (this.classList.contains('is-invalid-input')) {
				this.classList.remove('is-invalid-input');
				// Hide error message
				const errorMsg = this.parentNode.querySelector('.form-error');
				if (errorMsg) {
					errorMsg.classList.remove('is-visible');
				}
			}
		});
	});
}

// ============================================================
// Pagination
// ============================================================

function initPagination() {
	const container = document.querySelector('.maps-association');
	if (container) {
		hasMore = container.dataset.hasMore === 'true';
		pageSize = parseInt(container.dataset.pageSize || '20', 10);
	}
	renderPaginationControls();
}

function renderPaginationControls() {
	const paginationDiv = document.querySelector('[data-pagination]');
	if (!paginationDiv) return;

	paginationDiv.innerHTML = '';

	const showPrev = currentPage > 0;
	if (!showPrev && !hasMore) return;

	paginationDiv.className = 'pagination-controls flex items-center gap-x-2 mt-4';

	if (showPrev) {
		const prevBtn = document.createElement('button');
		prevBtn.textContent = '←';
		prevBtn.className = 'button button__sm button__secondary';
		prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
		paginationDiv.appendChild(prevBtn);
	}

	const pageInfo = document.createElement('span');
	pageInfo.className = 'text-sm';
	pageInfo.textContent = ` ${currentPage + 1} `;
	paginationDiv.appendChild(pageInfo);

	if (hasMore) {
		const nextBtn = document.createElement('button');
		nextBtn.textContent = '→';
		nextBtn.className = 'button button__sm button__secondary';
		nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
		paginationDiv.appendChild(nextBtn);
	}
}

function goToPage(page) {
	if (page < 0) return;

	const adminPath = document.querySelector('[data-admin-path]')?.getAttribute('data-admin-path');
	const url = `${adminPath}/external_maps?page=${page}&pageSize=${pageSize}`;

	const tbody = document.getElementById('maps-tbody');
	if (tbody) {
		tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Loading...</td></tr>`;
	}

	fetch(url, {
		method: 'GET',
		credentials: 'same-origin',
		headers: { Accept: 'application/json' }
	})
		.then(response => {
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.json();
		})
		.then(data => {
			const maps = data.maps || (Array.isArray(data) ? data : []);
			hasMore = data.hasMore ?? maps.length >= pageSize;
			totalPages = data.totalPages ?? totalPages;
			currentPage = page;
			renderMapRows(maps);
			renderPaginationControls();
			setupRadioHandlers();
		})
		.catch(error => {
			console.error('Error fetching maps page:', error);
			if (tbody) {
				tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-600 py-4">${error.message}</td></tr>`;
			}
		});
}

function renderMapRows(maps) {
	const tbody = document.getElementById('maps-tbody');
	if (!tbody) return;

	tbody.innerHTML = '';

	if (!maps.length) {
		const tr = document.createElement('tr');
		const td = document.createElement('td');
		td.colSpan = 6;
		td.className = 'text-center py-4';
		td.textContent = 'No maps found.';
		tr.appendChild(td);
		tbody.appendChild(tr);
		return;
	}

	maps.forEach(map => {
		const tr = document.createElement('tr');
		tr.dataset.mapId = map.id || '';

		// Radio
		const tdRadio = document.createElement('td');
		const radio = document.createElement('input');
		radio.type = 'radio';
		radio.name = 'selected_map';
		radio.value = map.id || '';
		radio.className = 'select-map-radio';
		tdRadio.appendChild(radio);
		tr.appendChild(tdRadio);

		// Image
		const tdImg = document.createElement('td');
		tdImg.dataset.label = 'Preview';
		if (map.map_image) {
			const img = document.createElement('img');
			img.src = map.map_image;
			img.alt = map.name || 'Map';
			img.style.cssText = 'max-width:80px;max-height:80px;object-fit:contain';
			tdImg.appendChild(img);
		} else {
			tdImg.style.color = '#999';
			tdImg.textContent = '—';
		}
		tr.appendChild(tdImg);

		// Name
		const tdName = document.createElement('td');
		tdName.className = '!text-left';
		tdName.dataset.label = 'Name';
		tdName.textContent = map.name || '';
		tr.appendChild(tdName);

		// Owner
		const tdOwner = document.createElement('td');
		tdOwner.dataset.label = 'Owner';
		tdOwner.textContent = map.owner || '';
		tr.appendChild(tdOwner);

		// Scope
		const tdScope = document.createElement('td');
		tdScope.dataset.label = 'Scope';
		tdScope.textContent = map.scope || '';
		tr.appendChild(tdScope);

		// Description
		const tdDesc = document.createElement('td');
		tdDesc.dataset.label = 'Description';
		tdDesc.textContent = (map.description || '-').slice(0, 100);
		tr.appendChild(tdDesc);

		tbody.appendChild(tr);
	});
}
