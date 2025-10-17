let selectedExperiment = null;
let currentPage = 0;
let totalPages = 1;
// Fetch up to 100 results per backend recommendation
let pageSize = 100;

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
  // keep form-section visible by default
  
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
      // Handle different response structures
      let experiments = [];
      
      if (Array.isArray(data)) {
        experiments = data;
      } else if (Array.isArray(data.content)) {
        experiments = data.content;
      } else if (Array.isArray(data.experiments)) {
        experiments = data.experiments;
      } else if (typeof data === 'object' && data !== null) {
        // Try to find an array in the response
        const possibleArrays = Object.values(data).filter(v => Array.isArray(v));
        if (possibleArrays.length > 0) {
          experiments = possibleArrays[0];
        }
      }
      
      if (!Array.isArray(experiments)) {
        throw new Error(`Experiments data is not in expected format. Got: ${typeof experiments}`);
      }
      
      // Handle pagination metadata if available
      // Try multiple metadata shapes from different APIs
      if (typeof data.totalPages !== 'undefined') {
        totalPages = data.totalPages;
      } else if (data.page && typeof data.page.totalPages !== 'undefined') {
        totalPages = data.page.totalPages;
      } else {
        totalPages = Math.max(1, Math.ceil(experiments.length / pageSize));
      }
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
  // Render a Decidim-like pagination control into [data-pagination]
  const container = document.querySelector('[data-pagination]');
  if (!container) return;

  // Build per-page menu and page links only if more than 1 page
  const perPageOptions = [25, 50, 100];
  let html = '';

  // Results per page selector
  html += `<div class="flex items-center gap-1"><svg width="1em" height="1em" role="img" aria-hidden="true" class="w-4 h-4 text-gray fill-current"><use href="/decidim-packs/media/images/remixicon.symbol-e643e553623ffcd49f94.svg#ri-list-check-2"></use></svg><p class="text-gray-2">Results per page:</p><details class="relative"><summary class="flex items-center cursor-pointer text-secondary font-semibold">${pageSize}<svg width="1em" height="1em" role="img" aria-hidden="true" class="w-4 h-4 text-gray fill-current"><use href="/decidim-packs/media/images/remixicon.symbol-e643e553623ffcd49f94.svg#ri-arrow-down-s-line"></use></svg></summary><ul class="dropdown dropdown__bottom">`;
  perPageOptions.forEach(opt => {
    html += `<li role="presentation"><a data-per-page-option="${opt}" class="dropdown__item" href="#">${opt}</a></li>`;
  });
  html += `</ul></details></div>`;

  // Pages
  html += `<nav aria-label="Pagination"><ul class="flex flex-wrap items-center text-sm text-secondary gap-x-1" data-pages>`;
  for (let p = 0; p < totalPages; p++) {
    if (p === currentPage) {
      html += `<li class="w-6 h-6 px-2 rounded-full hover:bg-background-3 transition min-w-fit bg-background-3 grid place-items-center" aria-current="page" data-page="${p}">${p+1}</li>`;
    } else {
      html += `<li class="w-6 h-6 px-2 rounded-full hover:bg-background-3 transition min-w-fit " data-page="${p}"><a class="w-full h-full grid place-items-center" href="#" data-page-link="${p}">${p+1}</a></li>`;
    }
  }

  // Next link
  if (currentPage < totalPages - 1) {
    html += `<li class="ml-2"><a href="#" data-next class="flex items-center gap-2 border border-secondary rounded font-semibold px-4 py-1.5">Next<svg width="1em" height="1em" role="img" aria-hidden="true" class="fill-current"><use href="/decidim-packs/media/images/remixicon.symbol-e643e553623ffcd49f94.svg#ri-arrow-right-line"></use></svg></a></li>`;
  }

  html += `</ul></nav>`;

  // Wrap into Decidim-like flex container so per-page is left and pages nav is right
  container.innerHTML = `<div class="flex flex-col-reverse md:flex-row items-center justify-between gap-1 py-8 md:py-16 md:flex-wrap">${html}</div>`;

  // Wire per-page clicks
  container.querySelectorAll('[data-per-page-option]').forEach(a => {
    a.addEventListener('click', function(ev) {
      ev.preventDefault();
      const opt = parseInt(this.getAttribute('data-per-page-option'), 10);
      pageSize = opt;
      loadExperiments(0);
    });
  });

  // Wire page links
  container.querySelectorAll('[data-page-link]').forEach(a => {
    a.addEventListener('click', function(ev) {
      ev.preventDefault();
      const p = parseInt(this.getAttribute('data-page-link'), 10);
      loadExperiments(p);
    });
  });

  const next = container.querySelector('[data-next]');
  if (next) next.addEventListener('click', function(ev) { ev.preventDefault(); loadExperiments(currentPage + 1); });
}

function renderExperiments(experiments) {
  const tbody = document.getElementById('experiments-tbody');
  tbody.innerHTML = '';

  if (!experiments || experiments.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px;">No experiments found</td>';
    tbody.appendChild(row);
    return;
  }

  experiments.forEach(exp => {
    const row = document.createElement('tr');
    row.dataset.experimentId = exp.id;
    // First column: radio button to select experiment
    const created = exp.createdAt || exp.created_at || '';
    // Format created date into a human readable string if possible
    let createdFormatted = '';
    if (created) {
      try {
        const d = new Date(created);
        if (!isNaN(d.getTime())) {
          createdFormatted = d.toLocaleString();
        }
      } catch (e) {
        createdFormatted = String(created);
      }
    }
    const version = exp.version || '';
    row.innerHTML = `
      <td data-label="Select">
        <input type="radio" name="selected_experiment" value="${escapeHtmlAttr(exp.id)}" class="select-experiment-radio" />
      </td>
      <td class="!text-left" data-label="ID/Name">
        <div><strong>${escapeHtml(exp.name || exp.id)}</strong></div>
        <div class="text-sm text-gray-600">${escapeHtml(exp.id)}</div>
      </td>
      <td data-label="Description">
        ${escapeHtml((exp.description || '-').substring(0, 100))}
      </td>
      <td data-label="Created">
        ${escapeHtml(createdFormatted)}
      </td>
      <td data-label="Version">
        ${escapeHtml(String(version))}
      </td>
    `;
    tbody.appendChild(row);
  });

  // Wire up radio buttons to select experiment
  document.querySelectorAll('.select-experiment-radio').forEach(radio => {
    radio.addEventListener('change', function() {
      const tr = this.closest('tr');
      const expId = this.value;
      // Find the full experiment object in the experiments array
      const found = experiments.find(e => String(e.id) === String(expId));
      if (found) {
        selectedExperiment = found;
        showFormSection();
      }
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
  
  // Clear and focus the input field
  // Do not clear the input so user can prepare a name before selection
  // document.getElementById('association-name').value = '';
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
    if (response.status === 200 || response.status === 201) {
      // Success - parse JSON response
      return response.json().then(data => {
        if (data.success && data.redirect_url) {
          // Validate redirect URL to prevent open redirect attacks
          try {
            const url = new URL(data.redirect_url, window.location.origin);
            if (url.origin === window.location.origin && url.pathname.startsWith('/admin/')) {
              // Use only the safe pathname and search/hash to prevent open redirects
              window.location.href = url.pathname + url.search + url.hash;
            } else {
              window.location.reload();
            }
          } catch (e) {
            window.location.reload();
          }
        } else {
          window.location.reload();
        }
      });
    } else if (response.status === 422 || response.status === 400) {
      return response.json().then(data => {
        const errors = data.errors || ['Validation error'];
        const errorMessage = errors.join(', ');
        const saveErrorMessage = document.querySelector('[data-i18n="save_error"]')?.textContent || 'Error saving association. Please try again.';
        alert(`${saveErrorMessage}\n${errorMessage}`);
      });
    } else {
      return response.text().then(text => {
        const saveErrorMessage = document.querySelector('[data-i18n="save_error"]')?.textContent || 'Error saving association. Please try again.';
        alert(`${saveErrorMessage}\nStatus: ${response.status}`);
      });
    }
  })
  .catch(error => {
    const saveErrorMessage = document.querySelector('[data-i18n="save_error"]')?.textContent || 'Error saving association. Please try again.';
    alert(saveErrorMessage);
  });
}
