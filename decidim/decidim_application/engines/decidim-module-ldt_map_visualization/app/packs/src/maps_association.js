let selectedMap = null;

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired - initializing maps_association');
  
  // Setup event handlers
  setupRadioHandlers();
  setupCancelHandler();
  setupSubmitHandler();
  setupInputValidation();
  console.log('Handlers setup complete');
});

function setupRadioHandlers() {
  // Wire up radio buttons to select map and show form
  document.querySelectorAll('.select-map-radio').forEach(radio => {
    radio.addEventListener('change', function() {
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
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Cancel button clicked');
      
      // Clear selection
      selectedMap = null;
      document.querySelectorAll('.select-map-radio').forEach(r => r.checked = false);
      
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
    form.addEventListener('submit', function(e) {
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
    input.addEventListener('input', function() {
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
