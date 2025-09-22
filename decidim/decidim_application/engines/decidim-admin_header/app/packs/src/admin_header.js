document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin Header JavaScript loaded');
  
  // Use a slight delay to ensure Deface overrides have been applied
  setTimeout(function() {
    initializeToolsDropdown();
  }, 100);
});

function initializeToolsDropdown() {
  const toolsButton = document.getElementById('tools-dropdown-button');
  const toolsDropdown = document.getElementById('tools-dropdown');
  
  console.log('toolsButton:', toolsButton);
  console.log('toolsDropdown:', toolsDropdown);
  
  if (toolsButton && toolsDropdown) {
    console.log('Elements found, adding event listeners');
    
    // Toggle dropdown visibility
    toolsButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Tools button clicked!');
      
      const isVisible = toolsDropdown.style.display === 'block';
      toolsDropdown.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        loadApplications();
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!toolsButton.contains(e.target) && !toolsDropdown.contains(e.target)) {
        toolsDropdown.style.display = 'none';
      }
    });
  } else {
    console.warn('Tools dropdown elements not found. Retrying in 500ms...');
    // Retry after a longer delay in case elements are inserted later
    setTimeout(function() {
      initializeToolsDropdown();
    }, 500);
  }
  
  function loadApplications() {
    // Show loading state
    toolsDropdown.innerHTML = '<div class="loading-spinner">Loading...</div>';
    
    fetch('/admin/admin_header/applications')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        renderApplications(data);
      })
      .catch(error => {
        console.error('Error loading applications:', error);
        renderError();
      });
  }
  
  function renderApplications(data) {
    console.log('Rendering applications:', data);
    if (!data.groups || data.groups.length === 0) {
      toolsDropdown.innerHTML = '<div class="p-4 text-center text-gray-600 text-sm">No applications available</div>';
      return;
    }
    let html = '';
    // Sort groups by order
    const sortedGroups = data.groups.sort((a, b) => (a.order || 0) - (b.order || 0));
    sortedGroups.forEach((group, groupIndex) => {
      if (group.applications && group.applications.length > 0) {
        // Sort applications within group by order
        const sortedApps = group.applications.sort((a, b) => (a.order || 0) - (b.order || 0));
        const groupId = `tools-group-${groupIndex}`;
        html += `<div class="application-group">
          <button type="button" class="w-full flex items-center px-4 pt-3 pb-1 group-header-toggle focus:outline-none" data-group="${groupId}">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider text-left flex-1">${escapeHtml(group.name)}</span>
            <svg class="w-4 h-4 ml-2 transition-transform duration-200 text-gray-400" data-arrow="${groupId}" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <div class="group-apps" id="${groupId}">
        `;
        sortedApps.forEach((app, appIndex) => {
          html += `<div class="application-item">`;
          html += `<a href="${escapeHtml(app.url)}" target="_blank" class="flex items-center px-4 py-2 text-gray-800 hover:bg-[#004494] hover:text-white transition-colors duration-150 no-underline group rounded-md">`;
          if (app.icon && app.icon.trim() !== '') {
            html += `<img src="data:image/png;base64,${app.icon}" alt="" class="w-6 h-6 rounded object-cover flex-shrink-0 mr-3">`;
          } else {
            html += `<div class="w-6 h-6 rounded flex-shrink-0 mr-3 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                       <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                       </svg>
                     </div>`;
          }
          html += `<span class="text-sm font-medium text-gray-900 group-hover:text-white transition-colors duration-150">${escapeHtml(app.name)}</span>`;
          html += `</a>`;
          html += `</div>`;
        });
        html += `</div></div>`;
      }
    });
    toolsDropdown.innerHTML = html;
    // Add toggle logic for group dropdowns
    document.querySelectorAll('.group-header-toggle').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const groupId = btn.getAttribute('data-group');
        const groupDiv = document.getElementById(groupId);
        const arrow = document.querySelector(`[data-arrow="${groupId}"]`);
        if (groupDiv.style.display === 'none' || groupDiv.style.display === '') {
          groupDiv.style.display = 'block';
          arrow.style.transform = 'rotate(180deg)';
        } else {
          groupDiv.style.display = 'none';
          arrow.style.transform = 'rotate(0deg)';
        }
      });
      // By default, open all groups
      const groupId = btn.getAttribute('data-group');
      const groupDiv = document.getElementById(groupId);
      groupDiv.style.display = 'block';
      const arrow = document.querySelector(`[data-arrow="${groupId}"]`);
      arrow.style.transform = 'rotate(180deg)';
    });
  }
  
  function renderError() {
    toolsDropdown.innerHTML = '<div class="error-message">Failed to load applications</div>';
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}