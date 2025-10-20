let selectedExperiment = null;

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired - initializing experiments_association');
  
  // Setup event handlers
  setupRadioHandlers();
  setupCancelHandler();
  console.log('Handlers setup complete');
});

function setupRadioHandlers() {
  // Wire up radio buttons to select experiment and show form
  document.querySelectorAll('.select-experiment-radio').forEach(radio => {
    radio.addEventListener('change', function() {
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
  console.log('Radio handlers registered for', document.querySelectorAll('.select-experiment-radio').length, 'radios');
}

function setupCancelHandler() {
  const cancelBtn = document.getElementById('reset-button');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Cancel button clicked');
      
      // Clear selection
      selectedExperiment = null;
      document.querySelectorAll('.select-experiment-radio').forEach(r => r.checked = false);
      
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
    infoDiv.innerHTML = '<div class="text-center py-2"><p>Loading experiment details...</p></div>';
  }
  
  fetch(detailUrl, {
    method: 'GET',
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' }
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
        infoDiv.innerHTML = `<div class="text-red-600 py-2"><p>Error loading details: ${error.message}</p></div>`;
      }
    });
}

function showFormWithDetails(experiment) {
  // Update info div with experiment details
  const infoDiv = document.querySelector('[data-selected-experiment-info]');
  if (infoDiv) {
    infoDiv.innerHTML = `
      <div style="margin-bottom: 20px; padding: 15px; background-color: #f0f0f0; border-left: 4px solid #0066cc;">
        <h4>Selected Experiment</h4>
        <p><strong>Name:</strong> ${escapeHtml(experiment?.name || 'N/A')}</p>
        <p><strong>ID:</strong> ${escapeHtml(experiment?.id || 'N/A')}</p>
        <p><strong>Status:</strong> ${escapeHtml(experiment?.status || 'N/A')}</p>
      </div>
    `;
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