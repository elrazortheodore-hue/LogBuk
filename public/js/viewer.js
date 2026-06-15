// LogDesk Viewer Logic

let currentData = {};
let eventSource = null;
let dynamicHeaders = new Set();

document.addEventListener('DOMContentLoaded', () => {
  if (LogDeskAuth.isAuthenticated('viewer')) {
    showDashboard();
  } else {
    showAuth();
  }
});

async function handleAuthSubmit(event) {
  event.preventDefault();
  const pinInput = document.getElementById('pin-input').value;
  const errorDiv = document.getElementById('auth-error');
  const btn = document.getElementById('unlock-btn');
  
  errorDiv.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Verifying...';

  const result = await LogDeskAuth.loginWithPin(pinInput, 'viewer');
  
  if (result.success) {
    showDashboard();
  } else {
    errorDiv.textContent = result.error;
    btn.disabled = false;
    btn.textContent = 'Unlock Dashboard';
  }
}

function handleLogout() {
  LogDeskAuth.clearSession();
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  showAuth();
}

function showAuth() {
  document.getElementById('auth-container').style.display = 'flex';
  document.getElementById('app-container').style.display = 'none';
  document.getElementById('pin-input').value = '';
}

function showDashboard() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
  initFirebaseStream();
}

function initFirebaseStream() {
  const dbUrl = LogDeskAuth.getDatabaseUrl();
  if (!dbUrl) {
    console.error('Database URL not found in session.');
    return;
  }

  // Ensure no trailing slash
  const baseUrl = dbUrl.endsWith('/') ? dbUrl.slice(0, -1) : dbUrl;
  
  updateConnectionStatus('Connecting...', 'pulse-connecting');
  
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource(`${baseUrl}/logs.json`);
  
  eventSource.addEventListener('open', () => {
    updateConnectionStatus('Connected', 'pulse-connected');
  });

  eventSource.addEventListener('error', (e) => {
    updateConnectionStatus('Connection lost. Reconnecting...', 'pulse-error');
  });

  eventSource.addEventListener('put', (e) => {
    try {
      const parsedData = JSON.parse(e.data);
      if (parsedData.path === '/') {
        // Initial full load
        currentData = parsedData.data || {};
        renderTable();
      } else {
        // Incremental add/update
        const key = parsedData.path.replace('/', '');
        if (parsedData.data === null) {
            delete currentData[key];
        } else {
            currentData[key] = parsedData.data;
            // Slide in animation for new row handled in renderRow if we append
        }
        renderTable();
      }
    } catch(err) {
      console.error('Error parsing SSE data', err);
    }
  });

  eventSource.addEventListener('patch', (e) => {
    try {
      const parsedData = JSON.parse(e.data);
      Object.assign(currentData, parsedData.data);
      renderTable();
    } catch(err) {
      console.error('Error parsing SSE patch', err);
    }
  });
}

function updateConnectionStatus(text, className) {
  const statusText = document.getElementById('connection-status');
  const pulse = document.querySelector('.live-pulse');
  statusText.textContent = text;
  
  pulse.className = 'live-pulse ' + className;
}

function refreshData() {
  updateConnectionStatus('Refreshing...', 'pulse-connecting');
  initFirebaseStream();
}

function renderTable() {
  const tableHead = document.getElementById('table-head');
  const tableBody = document.getElementById('table-body');
  const emptyState = document.getElementById('empty-state');
  
  const entries = Object.entries(currentData).sort((a, b) => {
    // Sort by createdAt desc
    const timeA = new Date(a[1].createdAt || 0).getTime();
    const timeB = new Date(b[1].createdAt || 0).getTime();
    return timeB - timeA;
  });

  if (entries.length === 0) {
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    emptyState.style.display = 'flex';
    document.getElementById('records-table').style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  document.getElementById('records-table').style.display = 'table';

  // Extract all dynamic headers
  dynamicHeaders.clear();
  entries.forEach(([id, log]) => {
    if (log.headers && Array.isArray(log.headers)) {
      log.headers.forEach(h => dynamicHeaders.add(h));
    }
  });

  // Convert Set to Array
  const headers = Array.from(dynamicHeaders);

  // Render Head
  let headHtml = '<tr>';
  headHtml += '<th>ID / Date</th>';
  headers.forEach(h => {
    headHtml += `<th>${escapeHtml(h)}</th>`;
  });
  headHtml += '<th>Image Reference</th>';
  headHtml += '</tr>';
  tableHead.innerHTML = headHtml;

  // Render Body
  tableBody.innerHTML = '';
  entries.forEach(([id, log]) => {
    // We assume log.rows is an array of objects
    const rows = Array.isArray(log.rows) ? log.rows : [];
    
    rows.forEach((row, index) => {
      const tr = document.createElement('tr');
      // Slide upward animation via CSS class
      tr.className = 'row-slide-in';
      tr.style.animationDelay = `${index * 0.1}s`;
      
      let dateStr = new Date(log.createdAt).toLocaleString();

      let rowHtml = `<td>
        <span class="cell-primary">${id.substring(1, 8)}</span>
        <span class="cell-secondary">${dateStr}</span>
      </td>`;
      
      headers.forEach(h => {
        let val = row[h] || '-';
        rowHtml += `<td contenteditable="true" class="editable-cell">${escapeHtml(val)}</td>`;
      });
      
      if (log.imageUrl) {
         rowHtml += `<td><a href="${log.imageUrl}" target="_blank" class="link-external">View Scan</a></td>`;
      } else {
         rowHtml += `<td>-</td>`;
      }
      
      tr.innerHTML = rowHtml;
      tableBody.appendChild(tr);
    });
  });
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
}

function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('Excel export library is loading. Please wait a moment.');
        return;
    }
    const table = document.getElementById('records-table');
    const wb = XLSX.utils.table_to_book(table, {sheet: "LogDesk Records"});
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `logdesk-export-${dateStr}.xlsx`);
}
