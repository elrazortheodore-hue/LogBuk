// Client-side controller for the desktop viewer dashboard

let dbApp = null;
let db = null;
let logsRef = null;

let allHeaders = [];
let allRows = []; // contains flat representation of all rows
let renderedRowIds = new Set(); // tracks already rendered row IDs to prevent re-animating

let activeCell = null; // { rowElement, colIndex, rowIndex, logId, colName }
let editCell = null; // cell currently being edited
let clipboardValue = ''; // for copy-paste

let currentSearchQuery = '';
let currentSortColumn = null;
let currentSortDirection = 'none'; // 'asc', 'desc', 'none'

document.addEventListener('DOMContentLoaded', () => {
  checkSessionState();
});

function checkSessionState() {
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');

  if (window.LogBukAuth.isAuthenticated('viewer')) {
    authContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    initializeDashboard();
  } else {
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const pinInput = document.getElementById('pin-input');
  const errorDiv = document.getElementById('auth-error');
  const submitBtn = document.getElementById('unlock-btn');

  errorDiv.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.innerText = 'Unlocking...';

  const result = await window.LogBukAuth.loginWithPin(pinInput.value, 'viewer');

  submitBtn.disabled = false;
  submitBtn.innerText = 'Unlock Dashboard';

  if (result.success) {
    pinInput.value = '';
    checkSessionState();
  } else {
    errorDiv.innerText = result.error;
    errorDiv.style.display = 'block';
    pinInput.focus();
  }
}

function initializeDashboard() {
  const dbUrl = window.LogBukAuth.getDatabaseUrl();
  if (!dbUrl) {
    alert("Connection details missing. Please unlock the dashboard again.");
    window.LogBukAuth.clearSession();
    checkSessionState();
    return;
  }

  // Initialize Firebase Client SDK if not already done
  if (!firebase.apps.length) {
    dbApp = firebase.initializeApp({ databaseURL: dbUrl });
  } else {
    dbApp = firebase.app();
  }
  db = firebase.database(dbApp);
  logsRef = db.ref('logs');

  // Set up connection status monitor
  const connectionIndicator = document.getElementById('connection-indicator');
  const connectionText = document.getElementById('connection-status-text');
  
  db.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
      connectionIndicator.className = 'live-indicator connected';
      connectionText.innerText = 'Connected';
      document.getElementById('footer-status-text').innerText = 'Connected';
    } else {
      connectionIndicator.className = 'live-indicator disconnected';
      connectionText.innerText = 'Disconnected';
      document.getElementById('footer-status-text').innerText = 'Reconnecting...';
    }
  });

  // Load and listen to Realtime Database updates
  document.getElementById('footer-status-text').innerText = 'Loading data...';
  logsRef.on('value', (snapshot) => {
    document.getElementById('footer-status-text').innerText = 'Sync complete';
    const data = snapshot.val();
    processLogsPayload(data);
  }, (error) => {
    console.error("Firebase read access error:", error);
    document.getElementById('footer-status-text').innerText = 'Connection lost';
  });

  // Setup Keyboard Navigation listener on document
  document.addEventListener('keydown', handleKeyboardNavigation);
}

function processLogsPayload(data) {
  if (!data) {
    renderEmptyState();
    return;
  }

  const headersSet = new Set();
  const flatRows = [];

  // Sort logs by date created so the oldest are first, and new ones append to bottom
  const sortedLogEntries = Object.entries(data).sort((a, b) => {
    return new Date(a[1].createdAt) - new Date(b[1].createdAt);
  });

  sortedLogEntries.forEach(([logId, logContent]) => {
    if (!logContent.headers || !logContent.rows) return;

    // Collect all headers dynamically
    logContent.headers.forEach(h => {
      if (h !== 'Original Scan' && h !== 'imageUrl' && h !== 'createdAt') {
        headersSet.add(h);
      }
    });

    // Flatten rows while preserving log context details for update operations
    logContent.rows.forEach((row, index) => {
      const rowId = `${logId}_${index}`;
      flatRows.push({
        ...row,
        _rowId: rowId,
        _logId: logId,
        _rowIndex: index,
        _imageUrl: logContent.imageUrl,
        _createdAt: logContent.createdAt
      });
    });
  });

  allHeaders = Array.from(headersSet);
  allRows = flatRows;

  document.getElementById('record-count-indicator').innerText = `${allRows.length} records loaded`;

  renderSpreadsheet();
}

function renderEmptyState() {
  allHeaders = [];
  allRows = [];
  renderedRowIds.clear();
  document.getElementById('record-count-indicator').innerText = '0 records loaded';
  document.getElementById('table-wrapper').innerHTML = `
    <div class="empty-placeholder" id="placeholder-view">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
        <line x1="15" y1="3" x2="15" y2="21"></line>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="3" y1="15" x2="21" y2="15"></line>
      </svg>
      <p class="empty-title">No Digitized Records</p>
      <p class="empty-subtitle">Upload a logbook page from a mobile device to begin real-time stream.</p>
    </div>
  `;
}

function renderSpreadsheet() {
  const container = document.getElementById('table-wrapper');
  if (allRows.length === 0) {
    renderEmptyState();
    return;
  }

  // Filter rows using search filter
  let processedRows = [...allRows];
  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    processedRows = processedRows.filter(row => {
      return allHeaders.some(header => {
        return String(row[header] || '').toLowerCase().includes(q);
      });
    });
  }

  // Sort rows if sorting is active
  if (currentSortColumn && currentSortDirection !== 'none') {
    processedRows.sort((a, b) => {
      const valA = String(a[currentSortColumn] || '');
      const valB = String(b[currentSortColumn] || '');
      
      // Natural sorting if values are numeric
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return currentSortDirection === 'asc' ? numA - numB : numB - numA;
      }
      
      return currentSortDirection === 'asc' 
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  // Generate Table
  const table = document.createElement('table');
  table.className = 'spreadsheet-table';

  // Build Table Headers
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Frozen row index th
  const indexTh = document.createElement('th');
  indexTh.innerText = '#';
  headerRow.appendChild(indexTh);

  // Dynamic headers
  allHeaders.forEach(header => {
    const th = document.createElement('th');
    th.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; position: relative;">
        <span onclick="handleSortToggle('${header}')" style="cursor: pointer; flex-grow: 1;">
          ${header} ${getSortIndicator(header)}
        </span>
        <div class="resize-handle" onmousedown="initColumnResize(event, this)"></div>
      </div>
    `;
    headerRow.appendChild(th);
  });

  // Original Scan column header
  const scanTh = document.createElement('th');
  scanTh.innerText = 'Document Source';
  headerRow.appendChild(scanTh);

  headerRow.appendChild(scanTh);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Build Table Body
  const tbody = document.createElement('tbody');
  
  processedRows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    tr.className = 'spreadsheet-row';
    
    // Add new-row slide animation class if this row has not been rendered before
    if (!renderedRowIds.has(row._rowId)) {
      tr.classList.add('new-row');
      renderedRowIds.add(row._rowId);
    }

    // Row selection trigger on row click
    tr.onclick = (e) => {
      // Clear previous selection
      document.querySelectorAll('.spreadsheet-row').forEach(r => r.classList.remove('row-selected'));
      tr.classList.add('row-selected');
    };

    // Render index cell
    const indexTd = document.createElement('td');
    indexTd.innerText = rowIndex + 1;
    tr.appendChild(indexTd);

    // Render cells for dynamic columns
    allHeaders.forEach((header, colIndex) => {
      const td = document.createElement('td');
      const val = row[header];
      td.innerText = val !== undefined && val !== null ? val : '';
      
      // Store meta properties on cells for interaction mapping
      td.dataset.header = header;
      td.dataset.logId = row._logId;
      td.dataset.rowIndex = row._rowIndex;
      td.dataset.rowId = row._rowId;
      td.dataset.colIndex = colIndex;

      // Handle cell selection
      td.addEventListener('click', (e) => {
        e.stopPropagation();
        selectCell(td, colIndex, row._rowId, row._logId, header);
      });

      // Handle double click for inline editing
      td.addEventListener('dblclick', (e) => {
        startCellEdit(td);
      });

      tr.appendChild(td);
    });

    // Render Original Scan badge cell
    const scanTd = document.createElement('td');
    if (row._imageUrl) {
      scanTd.innerHTML = `
        <a href="${row._imageUrl}" target="_blank" class="image-ref-badge" onclick="event.stopPropagation();">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px; height:11px;">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Scan Reference
        </a>
      `;
    } else {
      scanTd.innerText = '-';
    }
    tr.appendChild(scanTd);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  
  // Update UI container
  container.innerHTML = '';
  container.appendChild(table);
}

// Sorting toggles
function handleSortToggle(headerName) {
  if (currentSortColumn === headerName) {
    if (currentSortDirection === 'none') currentSortDirection = 'asc';
    else if (currentSortDirection === 'asc') currentSortDirection = 'desc';
    else {
      currentSortDirection = 'none';
      currentSortColumn = null;
    }
  } else {
    currentSortColumn = headerName;
    currentSortDirection = 'asc';
  }
  renderSpreadsheet();
}

function getSortIndicator(headerName) {
  if (currentSortColumn !== headerName) return '↕';
  if (currentSortDirection === 'asc') return '▲';
  if (currentSortDirection === 'desc') return '▼';
  return '↕';
}

// Column resizing
function initColumnResize(e, handle) {
  e.preventDefault();
  e.stopPropagation();

  const th = handle.closest('th');
  const startWidth = th.offsetWidth;
  const startX = e.clientX;

  handle.classList.add('resizing');

  const onMouseMove = (moveEvent) => {
    const deltaX = moveEvent.clientX - startX;
    const newWidth = Math.max(startWidth + deltaX, 60); // minimum width constraint
    th.style.width = `${newWidth}px`;
    th.style.minWidth = `${newWidth}px`;
  };

  const onMouseUp = () => {
    handle.classList.remove('resizing');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Cell selection mappings
function selectCell(td, colIndex, rowId, logId, colName) {
  if (editCell && editCell !== td) {
    commitCellEdit();
  }

  // Clear previous cell outlines
  document.querySelectorAll('.spreadsheet-table td').forEach(cell => {
    cell.classList.remove('cell-active');
  });

  td.classList.add('cell-active');
  
  // Find index of row in currently rendered view
  const rowElements = Array.from(document.querySelectorAll('.spreadsheet-row'));
  const rowEl = td.closest('tr');
  const renderedRowIndex = rowElements.indexOf(rowEl);

  activeCell = {
    element: td,
    colIndex: colIndex,
    rowIndex: renderedRowIndex,
    rowId: rowId,
    logId: logId,
    colName: colName
  };
}

// Inline spreadsheet editing routines
function startCellEdit(td) {
  if (editCell === td) return;
  if (editCell) commitCellEdit();

  editCell = td;
  const originalValue = td.innerText;
  
  td.classList.add('cell-editing');
  td.innerHTML = `<input type="text" class="spreadsheet-cell-editor" id="cell-editor-input">`;
  
  const input = document.getElementById('cell-editor-input');
  input.value = originalValue;
  input.focus();
  input.select();

  // Escape key cancels edit, Enter commits it
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitCellEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelCellEdit(originalValue);
    }
  };

  input.onblur = () => {
    commitCellEdit();
  };
}

async function commitCellEdit() {
  if (!editCell) return;

  const input = document.getElementById('cell-editor-input');
  if (!input) return;

  const newValue = input.value.trim();
  const td = editCell;
  
  // Retrieve attributes
  const logId = td.dataset.logId;
  const rowIndex = parseInt(td.dataset.rowIndex, 10);
  const columnName = td.dataset.header;
  const rowId = td.dataset.rowId;

  // Clean elements
  td.classList.remove('cell-editing');
  td.innerText = newValue;
  editCell = null;

  // Write changes straight into Firebase Realtime Database for live sync!
  if (db && logId && !isNaN(rowIndex) && columnName) {
    try {
      document.getElementById('footer-status-text').innerText = 'Saving changes...';
      const cellRef = db.ref(`logs/${logId}/rows/${rowIndex}/${columnName}`);
      await cellRef.set(newValue);
      document.getElementById('footer-status-text').innerText = 'Changes synced';
    } catch (err) {
      console.error("Firebase write permission error:", err);
      document.getElementById('footer-status-text').innerText = 'Save failed. Read-only.';
      
      // Rollback to previous model data
      const oldRow = allRows.find(r => r._rowId === rowId);
      if (oldRow) {
        td.innerText = oldRow[columnName] || '';
      }
    }
  }
}

function cancelCellEdit(originalValue) {
  if (!editCell) return;
  const td = editCell;
  td.classList.remove('cell-editing');
  td.innerText = originalValue;
  editCell = null;
}

// Keyboard Navigation & Copy-Paste Controls
function handleKeyboardNavigation(e) {
  // If user is editing a cell, let standard input typing behaviors handle it
  if (editCell) return;

  if (!activeCell) return;

  const rowCount = document.querySelectorAll('.spreadsheet-row').length;
  const colCount = allHeaders.length;

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    let nextRow = activeCell.rowIndex;
    let nextCol = activeCell.colIndex;

    if (e.key === 'ArrowUp') nextRow = Math.max(nextRow - 1, 0);
    else if (e.key === 'ArrowDown') nextRow = Math.min(nextRow + 1, rowCount - 1);
    else if (e.key === 'ArrowLeft') nextCol = Math.max(nextCol - 1, 0);
    else if (e.key === 'ArrowRight') nextCol = Math.min(nextCol + 1, colCount - 1);

    // Find and select the corresponding cell in DOM
    const rowEl = document.querySelectorAll('.spreadsheet-row')[nextRow];
    if (rowEl) {
      // Offset by 1 because first cell is index column
      const tdEl = rowEl.querySelectorAll('td')[nextCol + 1];
      if (tdEl) {
        selectCell(tdEl, nextCol, tdEl.dataset.rowId, tdEl.dataset.logId, tdEl.dataset.header);
        tdEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }

  // Trigger inline editor on Enter
  if (e.key === 'Enter') {
    e.preventDefault();
    startCellEdit(activeCell.element);
  }

  // Copy support (Ctrl+C / Cmd+C)
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    clipboardValue = activeCell.element.innerText;
    
    // Attempt writing to system clipboard
    navigator.clipboard.writeText(clipboardValue).then(() => {
      document.getElementById('footer-status-text').innerText = 'Copied cell to clipboard';
    }).catch(err => {
      // Fallback local memory copy
      document.getElementById('footer-status-text').innerText = 'Copied (Internal memory)';
    });
  }

  // Paste support (Ctrl+V / Cmd+V)
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault();
    
    // Read from system clipboard or local fallback
    navigator.clipboard.readText().then(text => {
      pasteValueIntoActiveCell(text || clipboardValue);
    }).catch(() => {
      pasteValueIntoActiveCell(clipboardValue);
    });
  }
}

async function pasteValueIntoActiveCell(value) {
  if (!activeCell || !value) return;
  const td = activeCell.element;
  td.innerText = value;
  
  const logId = td.dataset.logId;
  const rowIndex = parseInt(td.dataset.rowIndex, 10);
  const columnName = td.dataset.header;
  
  if (db && logId && !isNaN(rowIndex) && columnName) {
    try {
      document.getElementById('footer-status-text').innerText = 'Pasting value...';
      await db.ref(`logs/${logId}/rows/${rowIndex}/${columnName}`).set(value);
      document.getElementById('footer-status-text').innerText = 'Changes synced';
    } catch (err) {
      console.error("Paste sync failed:", err);
      document.getElementById('footer-status-text').innerText = 'Paste failed. Read-only.';
      
      // Rollback to original value
      const oldRow = allRows.find(r => r._rowId === activeCell.rowId);
      if (oldRow) {
        td.innerText = oldRow[columnName] || '';
      }
    }
  }
}

// Search filter triggered on input
function handleSearchFilter() {
  currentSearchQuery = document.getElementById('search-box').value;
  renderSpreadsheet();
}

// Reload site on demand
function triggerReload() {
  window.location.reload();
}

// Trigger Client-Side SheetJS Excel Export
function triggerExcelExport() {
  // Pass dynamic columns headers and flat rows data array
  // Filter out meta properties prefixed with '_'
  const cleanRows = allRows.map(row => {
    const r = {};
    allHeaders.forEach(h => {
      r[h] = row[h] !== undefined ? row[h] : '';
    });
    return r;
  });

  window.LogDeskExport.exportTableToExcel(allHeaders, cleanRows);
}
