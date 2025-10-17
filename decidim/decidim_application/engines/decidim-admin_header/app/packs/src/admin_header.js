document.addEventListener('DOMContentLoaded', function () {
	initializeToolsDropdown();
});

function initializeToolsDropdown() {
  const toolsButton = document.getElementById('tools-dropdown-button');
  const toolsDropdown = document.getElementById('tools-dropdown');
  
  if (toolsButton && toolsDropdown) {
    
    // Toggle dropdown visibility
    toolsButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
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
    // Retry after a longer delay in case elements are inserted later
    setTimeout(function() {
      initializeToolsDropdown();
    }, 500);
  }
  
  function loadApplications() {
    // Show loading state
    toolsDropdown.innerHTML = '<div class="loading-spinner">Loading...</div>';
    
    // Call backend API to fetch applications (handles JWT + Tool0 communication)
    fetch('/admin/admin_header/applications')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load applications: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        renderApplications(data);
      })
      .catch(error => {
        renderError(error.message);
      });
  }
  
  function renderApplications(data) {
    if (!data.groups || data.groups.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'p-4 text-center text-gray-600 text-sm';
      emptyDiv.textContent = 'No applications available';
      toolsDropdown.innerHTML = '';
      toolsDropdown.appendChild(emptyDiv);
      return;
    }
    
    // Helper to decode base64 SVG icons
    function decodeIcon(iconString) {
      const prefix = 'data:image/svg+xml;base64,';
      if (iconString && iconString.startsWith(prefix)) {
        const base64 = iconString.slice(prefix.length);
        try {
          return atob(base64);
        } catch (e) {
          console.error('Error decoding SVG icon:', e);
        }
      }
      return null;
    }
    
    // Helper to render a single application item (returns DOM element)
    function renderAppItem(app) {
      const svgMarkup = decodeIcon(app.icon);
      const item = document.createElement('div');
      item.className = 'application-item';
      
      const link = document.createElement('a');
      link.href = escapeHtml(app.url);
      link.target = '_blank';
      link.className = 'flex items-center px-4 py-2 text-gray-800 hover:bg-[#F6F6F6] no-underline group';
      
      if (svgMarkup) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'flex-shrink-0 mr-1';
        iconSpan.innerHTML = svgMarkup; // Safe because it's from base64-decoded SVG
        link.appendChild(iconSpan);
      } else {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'w-6 h-6 mr-1 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center rounded';
        iconDiv.innerHTML = '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>';
        link.appendChild(iconDiv);
      }
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'text-xl font-bold group-hover:text-[#004494]';
      nameSpan.textContent = app.name;
      link.appendChild(nameSpan);
      
      item.appendChild(link);
      return item;
    }
    
    // Helper to render a group with optional separator (returns DOM element)
    function renderGroup(group, index) {
      if (!group.applications || group.applications.length === 0) return null;
      
      const sortedApps = group.applications.sort((a, b) => (a.order || 0) - (b.order || 0));
      const groupId = `tools-group-${index}`;
      
      const groupDiv = document.createElement('div');
      groupDiv.className = 'application-group';
      
      // Add separator before all groups except first
      if (index > 0) {
        const sep = document.createElement('div');
        sep.className = 'border-t border-gray-200 my-2 mx-2 p-1';
        groupDiv.appendChild(sep);
      }
      
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'w-full flex items-center px-4 pt-3 pb-1 group-header-toggle focus:outline-none';
      btn.setAttribute('data-group', groupId);
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'text-lg text-start font-semibold text-gray-500 uppercase tracking-wider flex-1';
      nameSpan.textContent = group.name;
      btn.appendChild(nameSpan);
      
      const arrow = document.createElement('svg');
      arrow.className = 'w-4 h-4 ml-2 transition-transform duration-200 text-gray-400';
      arrow.setAttribute('data-arrow', groupId);
      arrow.setAttribute('fill', 'currentColor');
      arrow.setAttribute('viewBox', '0 0 20 20');
      arrow.innerHTML = '<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />';
      btn.appendChild(arrow);
      
      groupDiv.appendChild(btn);
      
      const appsContainer = document.createElement('div');
      appsContainer.className = 'group-apps';
      appsContainer.id = groupId;
      
      sortedApps.forEach(app => {
        appsContainer.appendChild(renderAppItem(app));
      });
      
      groupDiv.appendChild(appsContainer);
      return groupDiv;
    }
    
    // Clear and rebuild the dropdown
    toolsDropdown.innerHTML = '';
    const sortedGroups = data.groups.sort((a, b) => (a.order || 0) - (b.order || 0));
    sortedGroups.forEach((grp, idx) => {
      const groupElement = renderGroup(grp, idx);
      if (groupElement) {
        toolsDropdown.appendChild(groupElement);
      }
    });
    
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
  
  function renderError(message = 'Failed to load applications') {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    toolsDropdown.innerHTML = '';
    toolsDropdown.appendChild(errorDiv);
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

