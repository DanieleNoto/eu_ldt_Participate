let selectedExperiment = null;
let i18n = {}; // Store translations

document.addEventListener('DOMContentLoaded', function () {
	console.log('DOMContentLoaded fired - initializing experiments_association');

	// Load translations from data attributes
	loadTranslations();

	// Setup event handlers
	setupRadioHandlers();
	setupCancelHandler();
	console.log('Handlers setup complete');
});

function loadTranslations() {
	const container = document.querySelector('.experiments-association');
	if (container) {
		i18n = {
			details: {
				title: container.dataset.i18nDetailsTitle || 'Selected Experiment',
				name: container.dataset.i18nDetailsName || 'Name:',
				id: container.dataset.i18nDetailsId || 'ID:',
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

		const namePara = document.createElement('p');
		const nameStrong = document.createElement('strong');
		nameStrong.textContent = i18n.details.name + ' ';
		namePara.appendChild(nameStrong);
		namePara.appendChild(document.createTextNode(experiment?.name || i18n.details.na));
		container.appendChild(namePara);

		const idPara = document.createElement('p');
		const idStrong = document.createElement('strong');
		idStrong.textContent = i18n.details.id + ' ';
		idPara.appendChild(idStrong);
		idPara.appendChild(document.createTextNode(experiment?.id || i18n.details.na));
		container.appendChild(idPara);

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
