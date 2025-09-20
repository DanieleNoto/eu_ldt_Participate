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
        
        html += `<div class="application-group ${groupIndex > 0 ? 'border-t border-gray-100' : ''}">`;
        html += `<div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
                   <h3 class="text-xs font-semibold text-blue-900 uppercase tracking-wider">${escapeHtml(group.name)}</h3>
                 </div>`;
        
        sortedApps.forEach((app, appIndex) => {
          html += `<div class="application-item">`;
          html += `<a href="${escapeHtml(app.url)}" target="_blank" class="flex items-center px-4 py-3 text-gray-800 hover:bg-blue-50 transition-colors duration-150 no-underline group">`;
          
          if (app.icon && app.icon.trim() !== '') {
            html += `<img src="data:image/png;base64,${app.icon}" alt="" class="w-6 h-6 rounded object-cover flex-shrink-0 mr-3">`;
          } else {
            html += `<div class="w-6 h-6 rounded flex-shrink-0 mr-3 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                       <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                       </svg>
                     </div>`;
          }
          
          html += `<span class="text-sm font-medium text-gray-900 group-hover:text-blue-900 transition-colors duration-150">${escapeHtml(app.name)}</span>`;
          html += `<svg class="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors duration-150" fill="currentColor" viewBox="0 0 20 20">
                     <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                   </svg>`;
          html += `</a>`;
          html += `</div>`;
        });
        
        html += `</div>`;
      }
    });
    
    toolsDropdown.innerHTML = html;
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