(() => {
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function formatDate(date) {
    const [year, month, day] = String(date || '').split('-');
    return year && month && day ? `${day}/${month}/${year}` : String(date || '');
  }

  function safeFilename(value) {
    return String(value || 'class')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'class';
  }

  function csvCell(value) {
    let text = String(value ?? '');
    if (/^\s*[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function sheetRows(sheet) {
    return [
      ['SchoolFlow - Class Attendance Sheet'],
      [`Class: ${sheet.className}`],
      [`Date: ${sheet.date}`],
      [],
      ['Admission No.', 'Student Name', 'Attendance Status', 'Remarks'],
      ...sheet.rows.map(row => [row.admissionNo, row.studentName, row.status, row.remarks])
    ];
  }

  function downloadCsv(sheet) {
    const contents = `\uFEFF${sheetRows(sheet).map(row => row.map(csvCell).join(',')).join('\r\n')}`;
    const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${safeFilename(sheet.className)}-${sheet.date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function printSheet(sheet) {
    let printSheetElement = document.getElementById('attendancePrintSheet');
    if (!printSheetElement) {
      printSheetElement = document.createElement('section');
      printSheetElement.id = 'attendancePrintSheet';
      printSheetElement.className = 'attendance-print-sheet';
      document.body.appendChild(printSheetElement);
    }

    printSheetElement.innerHTML = `
      <header class="attendance-print-header">
        <h1>SchoolFlow - Class Attendance Sheet</h1>
        <p><strong>Class:</strong> ${escapeHtml(sheet.className)}</p>
        <p><strong>Date:</strong> ${escapeHtml(formatDate(sheet.date))}</p>
      </header>
      <table>
        <thead><tr><th>Admission No.</th><th>Student Name</th><th>Attendance Status</th><th>Remarks</th></tr></thead>
        <tbody>${sheet.rows.length ? sheet.rows.map(row => `
          <tr>
            <td>${escapeHtml(row.admissionNo || '—')}</td>
            <td>${escapeHtml(row.studentName || '—')}</td>
            <td>${escapeHtml(row.status || 'Not recorded')}</td>
            <td>${escapeHtml(row.remarks || '—')}</td>
          </tr>`).join('') : '<tr><td colspan="4">No students are assigned to this class.</td></tr>'}
        </tbody>
      </table>`;

    const previousTitle = document.title;
    document.title = `Attendance - ${sheet.className} - ${sheet.date}`;
    const cleanup = () => {
      document.title = previousTitle;
      printSheetElement.remove();
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  }

  window.AttendanceExport = Object.freeze({ downloadCsv, printSheet });
})();
