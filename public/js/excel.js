// Client-side Excel export utility using SheetJS for LogBuk

function exportTableToExcel(headers, rows) {
  if (typeof XLSX === 'undefined') {
    alert("Export library is still loading. Please try again in a moment.");
    return;
  }

  if (!headers || headers.length === 0) {
    alert("No columns available to export.");
    return;
  }

  // Generate filename: logbuk-export-YYYY-MM-DD.xlsx
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const filename = `logbuk-export-${yyyy}-${mm}-${dd}.xlsx`;

  // Build spreadsheet grid starting with headers, then adding row values ordered by headers
  const data = [headers];
  rows.forEach(row => {
    const rowData = headers.map(header => {
      const val = row[header];
      if (val === undefined || val === null) return '';
      return val;
    });
    data.push(rowData);
  });

  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-fit column widths based on maximum characters in cells
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = header.length;
    data.forEach(row => {
      const cellVal = String(row[colIndex] || '');
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    });
    return { wch: maxLen + 3 }; // Pad with extra characters for visual breathing room
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "LogBuk Records");

  // Output file download trigger
  XLSX.writeFile(wb, filename);
}

// Expose globally
window.LogBukExport = {
  exportTableToExcel
};
