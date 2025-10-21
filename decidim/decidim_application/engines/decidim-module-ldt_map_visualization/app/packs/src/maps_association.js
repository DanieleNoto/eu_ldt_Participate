let selectedMap = null;

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired - initializing maps_association');
  
  // Setup event handlers
  setupRadioHandlers();
  setupCancelHandler();
  setupSubmitHandler();
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
  const form = document.getElementById('map-form');
  
  if (form) {
    // Intercept form submission to validate
    form.addEventListener('submit', function(e) {
      const mapIdField = document.getElementById('map-id-field');
      const nameInput = document.getElementById('map-name');
      
      // Check if a map is selected
      if (!mapIdField || !mapIdField.value) {
        e.preventDefault();
        alert('Please select a map from the list above.');
        return false;
      }
      
      // Check if name is filled
      if (!nameInput || !nameInput.value.trim()) {
        e.preventDefault();
        alert('Please enter a name for this map visualization.');
        nameInput?.focus();
        return false;
      }
      
      console.log('Form validation passed, submitting...');
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
