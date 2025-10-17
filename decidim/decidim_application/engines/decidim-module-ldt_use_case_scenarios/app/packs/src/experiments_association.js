let selectedExperiment = null;
let currentPage = 0;
let totalPages = 1;
let pageSize = 10;

document.addEventListener('DOMContentLoaded', function() {
  loadExperiments(0);
  setupFormHandlers();
  setupPaginationHandlers();
});

function setupPaginationHandlers() {
  document.getElementById('prev-page-button').addEventListener('click', function() {
    if (currentPage > 0) {
      loadExperiments(currentPage - 1);
    }
  });

  document.getElementById('next-page-button').addEventListener('click', function() {
    if (currentPage < totalPages - 1) {
      loadExperiments(currentPage + 1);
    }
  });
}

function loadExperiments(page = 0) {
  // Call server-side proxy which handles JWT token, TOOL2 handshake, and experiments fetch
  const adminPath = document.querySelector('[data-admin-path]')?.getAttribute('data-admin-path');
  const proxyUrl = `${adminPath}/external_experiments?page=${page}&size=${pageSize}`;
  
  document.getElementById('loading-state').style.display = 'block';
  document.getElementById('experiments-container').style.display = 'none';
  document.getElementById('error-state').style.display = 'none';
  document.getElementById('form-section').style.display = 'none';
  
  fetch(proxyUrl, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
      return response.json();
    })
    .then(data => {
      const experiments = data.content || data;
      // Handle pagination metadata if available
      totalPages = data.totalPages || Math.ceil(experiments.length / pageSize) || 1;
      currentPage = page;
      
      renderExperiments(experiments);
      updatePaginationInfo();
      
      document.getElementById('loading-state').style.display = 'none';
      document.getElementById('experiments-container').style.display = 'block';
    })
    .catch(error => {
      console.error('Error loading experiments:', error);
      document.getElementById('loading-state').style.display = 'none';
      document.getElementById('error-state').style.display = 'block';
      document.getElementById('error-message').textContent = error.message;
    });
}

function updatePaginationInfo() {
  const pageInfo = document.getElementById('page-info');
  const prevButton = document.getElementById('prev-page-button');
  const nextButton = document.getElementById('next-page-button');
  
  pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  prevButton.disabled = currentPage === 0;
  nextButton.disabled = currentPage >= totalPages - 1;
}

function renderExperiments(experiments) {
  const tbody = document.getElementById('experiments-tbody');
  tbody.innerHTML = '';

  if (!experiments || experiments.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4" style="text-align: center; padding: 20px;">No experiments found</td>';
    tbody.appendChild(row);
    return;
  }

  experiments.forEach(exp => {
    const row = document.createElement('tr');
    row.dataset.experimentId = exp.id;
    row.innerHTML = `
      <td data-label="ID">
        ${exp.id}
      </td>
      <td class="!text-left" data-label="Name">
        <strong>${escapeHtml(exp.name)}</strong>
      </td>
      <td data-label="Description">
        ${escapeHtml((exp.description || '-').substring(0, 100))}
      </td>
      <td class="table-list__actions" data-label="Actions">
        <button type="button" class="button button__sm button__secondary select-experiment" data-experiment='${escapeHtmlAttr(JSON.stringify(exp))}'>
          Select
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.querySelectorAll('.select-experiment').forEach(btn => {
    btn.addEventListener('click', function() {
      const experimentJson = this.dataset.experiment;
      selectedExperiment = JSON.parse(experimentJson);
      showFormSection();
    });
  });
}

function escapeHtmlAttr(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showFormSection() {
  // Show the form section and selected experiment info
  document.getElementById('form-section').style.display = 'block';
  document.getElementById('selected-experiment-info').style.display = 'block';
  document.getElementById('selected-exp-name').textContent = selectedExperiment.name;
  
  // Clear and focus the input field
  document.getElementById('association-name').value = '';
  document.getElementById('association-name').focus();
  
  // Scroll to form
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

function setupFormHandlers() {
  // Save button
  document.getElementById('save-button').addEventListener('click', function() {
    if (!selectedExperiment) {
      alert('Please select an experiment first');
      return;
    }
    
    const associationName = document.getElementById('association-name').value;
    const nameRequiredMessage = document.querySelector('[data-i18n="name_required"]')?.textContent || 'Association name is required';
    
    if (!associationName.trim()) {
      alert(nameRequiredMessage);
      return;
    }
    
    submitExperimentAssociation(associationName);
  });

  // Reset/Cancel button
  document.getElementById('reset-button').addEventListener('click', function() {
    selectedExperiment = null;
    document.getElementById('association-name').value = '';
    document.getElementById('form-section').style.display = 'none';
    document.getElementById('selected-experiment-info').style.display = 'none';
  });
}

function submitExperimentAssociation(name) {
  const formData = new FormData();
  formData.append('use_case_scenario[name]', name);
  formData.append('use_case_scenario[experiment_id]', selectedExperiment.id);
  formData.append('use_case_scenario[experiment_name]', selectedExperiment.name);
  formData.append('use_case_scenario[experiment_data]', JSON.stringify(selectedExperiment));

  const adminPath = document.querySelector('[data-admin-path]')?.getAttribute('data-admin-path') || '/admin/components/ldt_use_case_scenarios';
  
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  console.log('Submitting to:', adminPath);
  console.log('With data:', {
    name: name,
    experiment_id: selectedExperiment.id,
    experiment_name: selectedExperiment.name
  });
  console.log('CSRF Token present:', !!csrfToken);

  fetch(adminPath, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      'Accept': 'application/json'
    },
    body: formData,
    credentials: 'same-origin'
  })
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.status === 200 || response.status === 201) {
      // Success - parse JSON response
      return response.json().then(data => {
        if (data.success && data.redirect_url) {
          console.log('Redirecting to:', data.redirect_url);
          window.location.href = data.redirect_url;
        } else {
          console.log('Success but no redirect URL, reloading page');
          window.location.reload();
        }
      });
    } else if (response.status === 422 || response.status === 400) {
      return response.json().then(data => {
        const errors = data.errors || ['Validation error'];
        const errorMessage = errors.join(', ');
        console.error('Validation error:', errorMessage);
        const saveErrorMessage = document.querySelector('[data-i18n="save_error"]')?.textContent || 'Error saving association. Please try again.';
        alert(`${saveErrorMessage}\n${errorMessage}`);
      });
    } else {
      return response.text().then(text => {
        console.error('Error response:', text);
        const saveErrorMessage = document.querySelector('[data-i18n="save_error"]')?.textContent || 'Error saving association. Please try again.';
        alert(`${saveErrorMessage}\nStatus: ${response.status}`);
      });
    }
  })
  .catch(error => {
    console.error('Error saving:', error);
    const saveErrorMessage = document.querySelector('[data-i18n="save_error"]')?.textContent || 'Error saving association. Please try again.';
    alert(saveErrorMessage);
  });
}
