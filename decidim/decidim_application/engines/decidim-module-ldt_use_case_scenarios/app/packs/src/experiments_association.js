// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
// # Denis Vasilev Dimchev
// # Gianfranco Cedro
// # Simone Bianchelli
let selectedExperiment = null;
let i18n = {}; // Store translations

// Pagination state
let currentPage = 0;
let totalPages = 1;
let pageSize = 10;

document.addEventListener('DOMContentLoaded', function () {
	console.log('DOMContentLoaded fired - initializing experiments_association');

	// Load translations from data attributes
	loadTranslations();
	// Init pagination state from server-rendered data
	initPagination();

	// Setup event handlers
	setupRadioHandlers();
	setupCancelHandler();
	setupSubmitHandler();
	setupInputValidation();
	console.log('Handlers setup complete');
});

function loadTranslations() {
	const container = document.querySelector('.experiments-association');
	if (container) {
		i18n = {
			details: {
				title: container.dataset.i18nDetailsTitle || 'Selected Experiment',
				name: container.dataset.i18nDetailsExperimentName || 'Experiment Name:',
				experimentId: container.dataset.i18nDetailsExperimentId || 'Experiment ID:',
				scenarioId: container.dataset.i18nDetailsScenarioId || 'Scenario ID:',
				status: container.dataset.i18nDetailsStatus || 'Status:',
				loading: container.dataset.i18nDetailsLoading || 'Loading experiment details...',
				error: container.dataset.i18nDetailsError || 'Error loading details:',
				na: container.dataset.i18nDetailsNa || 'N/A'
			}
		};
	}
}

function setupRadioHandlers() {
	// Wire up radio buttons to select experiment and show form
	document.querySelectorAll('.select-experiment-radio').forEach(radio => {
		radio.addEventListener('change', function () {
			if (this.checked) {
				const experimentId = this.value;
				console.log('Experiment selected:', experimentId);

				// Set experiment_id in hidden field
				const hiddenField = document.getElementById('experiment-id-field');
				if (hiddenField) hiddenField.value = experimentId;

				// Fetch and display experiment details
				fetchExperimentDetail(experimentId);
			}
		});
	});
	console.log(
		'Radio handlers registered for',
		document.querySelectorAll('.select-experiment-radio').length,
		'radios'
	);
}

function setupCancelHandler() {
	const cancelBtn = document.getElementById('reset-button');
	if (cancelBtn) {
		cancelBtn.addEventListener('click', function (e) {
			e.preventDefault();
			console.log('Cancel button clicked');

			// Clear selection
			selectedExperiment = null;
			document.querySelectorAll('.select-experiment-radio').forEach(r => (r.checked = false));

			// Clear experiment info
			const infoDiv = document.querySelector('[data-selected-experiment-info]');
			if (infoDiv) infoDiv.innerHTML = '';

			// Clear inputs
			const nameInput = document.getElementById('association-name');
			if (nameInput) nameInput.value = '';

			const hiddenField = document.getElementById('experiment-id-field');
			if (hiddenField) hiddenField.value = '';
		});
	}
}

function fetchExperimentDetail(experimentId) {
	const adminPath = document.querySelector('[data-admin-path]')?.getAttribute('data-admin-path');
	const detailUrl = `${adminPath}/experiment_detail?experiment_id=${encodeURIComponent(experimentId)}`;

	console.log('Fetching experiment detail from:', detailUrl);

	// Show loading in info div
	const infoDiv = document.querySelector('[data-selected-experiment-info]');
	if (infoDiv) {
		infoDiv.innerHTML = `<div class="text-center py-2"><p>${i18n.details.loading}</p></div>`;
	}

	fetch(detailUrl, {
		method: 'GET',
		credentials: 'same-origin',
		headers: { Accept: 'application/json' }
	})
		.then(response => {
			if (!response.ok) throw new Error(`Error: ${response.status}`);
			return response.json();
		})
		.then(data => {
			console.log('Experiment detail loaded:', data);
			selectedExperiment = data;
			showFormWithDetails(data);
		})
		.catch(error => {
			console.error('Error fetching experiment detail:', error);
			if (infoDiv) {
				// Clear previous content
				infoDiv.innerHTML = '';

				// Create error message safely without innerHTML injection
				const errorDiv = document.createElement('div');
				errorDiv.className = 'text-red-600 py-2';

				const errorPara = document.createElement('p');
				errorPara.textContent = `${i18n.details.error} ${error.message || 'Unknown error'}`;

				errorDiv.appendChild(errorPara);
				infoDiv.appendChild(errorDiv);
			}
		});
}

function showFormWithDetails(experiment) {
	// Update info div with experiment details
	const infoDiv = document.querySelector('[data-selected-experiment-info]');
	if (infoDiv) {
		// Clear previous content
		infoDiv.innerHTML = '';

		// Create elements safely without innerHTML injection
		const container = document.createElement('div');
		container.style.marginBottom = '20px';
		container.style.padding = '15px';
		container.style.backgroundColor = '#f0f0f0';
		container.style.borderLeft = '4px solid #0066cc';

		const heading = document.createElement('h4');
		heading.textContent = i18n.details.title;
		container.appendChild(heading);

		// Experiment Name (from nested experiment object)
		const experimentName = experiment?.experiment?.name || i18n.details.na;
		const namePara = document.createElement('p');
		const nameStrong = document.createElement('strong');
		nameStrong.textContent = i18n.details.name + ' ';
		namePara.appendChild(nameStrong);
		namePara.appendChild(document.createTextNode(experimentName));
		container.appendChild(namePara);

		// Experiment ID
		const experimentIdPara = document.createElement('p');
		const experimentIdStrong = document.createElement('strong');
		experimentIdStrong.textContent = i18n.details.experimentId + ' ';
		experimentIdPara.appendChild(experimentIdStrong);
		experimentIdPara.appendChild(document.createTextNode(experiment?.experimentId || i18n.details.na));
		container.appendChild(experimentIdPara);

		// Scenario ID
		const scenarioIdPara = document.createElement('p');
		const scenarioIdStrong = document.createElement('strong');
		scenarioIdStrong.textContent = i18n.details.scenarioId + ' ';
		scenarioIdPara.appendChild(scenarioIdStrong);
		scenarioIdPara.appendChild(document.createTextNode(experiment?.scenarioId || i18n.details.na));
		container.appendChild(scenarioIdPara);

		const statusPara = document.createElement('p');
		const statusStrong = document.createElement('strong');
		statusStrong.textContent = i18n.details.status + ' ';
		statusPara.appendChild(statusStrong);
		statusPara.appendChild(document.createTextNode(experiment?.status || i18n.details.na));
		container.appendChild(statusPara);

		infoDiv.appendChild(container);
	}

	// Focus on name input
	const nameInput = document.getElementById('association-name');
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

// Form validation functions
function setupSubmitHandler() {
	// Find the form that contains our association-name field
	const nameInput = document.getElementById('association-name');
	const form = nameInput ? nameInput.closest('form') : null;

	if (form) {
		form.addEventListener('submit', function (e) {
			// Clear any previous errors
			clearFieldErrors();

			// Get form values
			const nameInput = document.getElementById('association-name');
			const experimentIdField = document.getElementById('experiment-id-field');

			let hasErrors = false;

			// Validate name field
			if (!nameInput || !nameInput.value.trim()) {
				showFieldError('association-name', 'name_required');
				hasErrors = true;
			}

			// Validate experiment selection
			if (!experimentIdField || !experimentIdField.value.trim()) {
				showError('Please select an experiment first.');
				hasErrors = true;
			}

			if (hasErrors) {
				e.preventDefault();
				return false;
			}

			// Disable submit button to prevent double submission
			const submitBtn = document.getElementById('save-button');
			if (submitBtn) {
				submitBtn.disabled = true;
				submitBtn.textContent = 'Creating...';
			}

			return true;
		});
	}
}

function setupInputValidation() {
	const nameInput = document.getElementById('association-name');
	if (nameInput) {
		nameInput.addEventListener('input', function () {
			if (this.value.trim()) {
				clearFieldError('association-name');
			}
		});

		nameInput.addEventListener('blur', function () {
			if (!this.value.trim()) {
				showFieldError('association-name', 'name_required');
			}
		});
	}
}

function clearFieldErrors() {
	// Remove error styling from all inputs
	document.querySelectorAll('.is-invalid-input').forEach(el => {
		el.classList.remove('is-invalid-input');
	});

	// Remove error messages
	document.querySelectorAll('.form-error').forEach(el => {
		el.classList.remove('is-visible');
	});
}

function clearFieldError(fieldId) {
	const field = document.getElementById(fieldId);
	if (field) {
		field.classList.remove('is-invalid-input');
		const errorMsg = field.parentNode.querySelector('.form-error');
		if (errorMsg) {
			errorMsg.classList.remove('is-visible');
		}
	}
}

function showFieldError(fieldId, messageKey) {
	const field = document.getElementById(fieldId);
	if (!field) return;

	// Add error styling
	field.classList.add('is-invalid-input');

	// Remove any existing error message
	const existingError = field.parentNode.querySelector('.form-error');
	if (existingError) {
		existingError.remove();
	}

	// Get message text
	let messageText = messageKey;
	if (messageKey === 'name_required') {
		const container = document.querySelector('.experiments-association');
		messageText = container?.dataset.i18nNameRequired || 'Name is required';
	}

	// Create and insert error message
	const errorDiv = document.createElement('small');
	errorDiv.className = 'form-error';
	errorDiv.textContent = messageText;

	field.parentNode.insertBefore(errorDiv, field.nextSibling);
	errorDiv.classList.add('is-visible');
}

function showError(message) {
	// For general errors, show in a general location or as an alert
	// You could also create a general error container
	alert(message); // Fallback for general errors
}

// ============================================================
// Pagination
// ============================================================

function initPagination() {
	const container = document.querySelector('.experiments-association');
	if (container) {
		totalPages = parseInt(container.dataset.totalPages || '1', 10);
		pageSize = parseInt(container.dataset.pageSize || '10', 10);
	}
	renderPaginationControls();
}

function renderPaginationControls() {
	const paginationDiv = document.querySelector('[data-pagination]');
	if (!paginationDiv) return;

	// Clear existing controls
	paginationDiv.innerHTML = '';

	if (totalPages <= 1) return;

	paginationDiv.className = 'pagination-controls flex items-center gap-x-2 mt-4';

	const prevBtn = document.createElement('button');
	prevBtn.textContent = '←';
	prevBtn.className = 'button button__sm button__secondary';
	prevBtn.disabled = currentPage === 0;
	prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
	paginationDiv.appendChild(prevBtn);

	const pageInfo = document.createElement('span');
	pageInfo.className = 'text-sm';
	pageInfo.textContent = `${currentPage + 1} / ${totalPages}`;
	paginationDiv.appendChild(pageInfo);

	const nextBtn = document.createElement('button');
	nextBtn.textContent = '→';
	nextBtn.className = 'button button__sm button__secondary';
	nextBtn.disabled = currentPage >= totalPages - 1;
	nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
	paginationDiv.appendChild(nextBtn);
}

function goToPage(page) {
	if (page < 0 || page >= totalPages) return;

	const adminPath = document.querySelector('[data-admin-path]')?.getAttribute('data-admin-path');
	const url = `${adminPath}/external_experiments?page=${page}&size=${pageSize}`;

	// Show loading state
	const tbody = document.getElementById('experiments-tbody');
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
			const experiments = Array.isArray(data) ? data : data.content || [];
			const metadata = data.metadata;

			if (metadata && metadata.total != null && metadata.size > 0) {
				totalPages = Math.ceil(metadata.total / metadata.size);
			}

			currentPage = page;
			renderExperimentRows(experiments);
			renderPaginationControls();
			setupRadioHandlers();
		})
		.catch(error => {
			console.error('Error fetching experiments page:', error);
			if (tbody) {
				tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-600 py-4">${error.message}</td></tr>`;
			}
		});
}

function renderExperimentRows(experiments) {
	const tbody = document.getElementById('experiments-tbody');
	if (!tbody) return;

	tbody.innerHTML = '';

	if (!experiments.length) {
		const tr = document.createElement('tr');
		const td = document.createElement('td');
		td.colSpan = 6;
		td.className = 'text-center py-4';
		td.textContent = 'No experiments found.';
		tr.appendChild(td);
		tbody.appendChild(tr);
		return;
	}

	experiments.forEach(exp => {
		const tr = document.createElement('tr');
		tr.dataset.experimentId = exp.id || '';

		// Select radio
		const tdRadio = document.createElement('td');
		const radio = document.createElement('input');
		radio.type = 'radio';
		radio.name = 'selected_experiment';
		radio.value = exp.id || '';
		radio.className = 'select-experiment-radio';
		tdRadio.appendChild(radio);
		tr.appendChild(tdRadio);

		// Experiment name
		const tdName = document.createElement('td');
		tdName.className = '!text-left';
		const strong = document.createElement('strong');
		strong.textContent = (exp.experiment && exp.experiment.name) || '—';
		tdName.appendChild(strong);
		tr.appendChild(tdName);

		// Experiment ID / Scenario ID
		const tdIds = document.createElement('td');
		tdIds.className = '!text-left';
		const divExpId = document.createElement('div');
		const strongExpId = document.createElement('strong');
		strongExpId.textContent = exp.experimentId || '—';
		divExpId.appendChild(strongExpId);
		const divScenId = document.createElement('div');
		divScenId.className = 'text-sm text-gray-600';
		divScenId.textContent = exp.scenarioId || '—';
		tdIds.appendChild(divExpId);
		tdIds.appendChild(divScenId);
		tr.appendChild(tdIds);

		// Status
		const tdStatus = document.createElement('td');
		tdStatus.textContent = exp.status || '—';
		tr.appendChild(tdStatus);

		// Created
		const tdCreated = document.createElement('td');
		const rawDate = exp.createdAt || exp.created_at;
		if (rawDate) {
			try {
				tdCreated.textContent = new Date(rawDate).toISOString().slice(0, 16).replace('T', ' ');
			} catch {
				tdCreated.textContent = rawDate;
			}
		}
		tr.appendChild(tdCreated);

		// Version
		const tdVersion = document.createElement('td');
		tdVersion.textContent = exp.experimentVersion != null ? exp.experimentVersion : '—';
		tr.appendChild(tdVersion);

		tbody.appendChild(tr);
	});
}
