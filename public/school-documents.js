(() => {
  /* ─── helpers ─────────────────────────────────────────────────── */
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function amount(value) {
    return `UGX ${Number(value || 0).toLocaleString('en-UG', { maximumFractionDigits: 2 })}`;
  }

  function fmt(dateValue) {
    const s = String(dateValue || '').slice(0, 10);
    if (!s || s === 'undefined') return '—';
    const [y, m, d] = s.split('-');
    return (y && m && d) ? `${d}/${m}/${y}` : s;
  }

  /* Inject a hidden <main> element, set the page title, call print(),
     then remove the element and restore the title afterwards. */
  function rootForPrint(markup, title) {
    document.getElementById('schoolDocumentRoot')?.remove();
    const root = document.createElement('main');
    root.id = 'schoolDocumentRoot';
    root.className = 'school-print-document';
    root.innerHTML = markup;
    document.body.appendChild(root);
    const previousTitle = document.title;
    document.title = title;
    window.addEventListener('afterprint', () => {
      document.title = previousTitle;
      root.remove();
    }, { once: true });
    window.print();
  }

  /* Generic CSV builder used by multiple export functions */
  function buildCsv(rows) {
    return '\uFEFF' + rows.map(row =>
      row.map(value => {
        let text = String(value ?? '');
        if (/^\s*[=+\-@\t\r]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\r\n');
  }

  function downloadCsv(csv, filename) {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ─── school name helper ─────────────────────────────────────── */
  /* Reads the brand strong text from the sidebar so it appears on every document.
     Falls back to a generic name if the sidebar is not present (e.g. during print). */
  function schoolName() {
    return document.querySelector('.brand-copy strong')?.textContent?.trim() || 'SchoolFlow';
  }

  /* ─── 1. Payment Receipt ─────────────────────────────────────── */
  function printReceipt(data) {
    const { payment, student } = data;
    const cls = student?.classId
      ? (typeof student.classId === 'object'
          ? [student.classId.name, student.classId.section].filter(Boolean).join(' · ')
          : '')
      : '—';
    rootForPrint(`
      <div class="doc-header">
        <div class="doc-logo">${escapeHtml(schoolName())}</div>
        <div>
          <h1>Official Payment Receipt</h1>
          <p class="doc-ref">Receipt No.: <strong>${escapeHtml(payment.receiptNo)}</strong></p>
        </div>
      </div>
      <div class="doc-meta-grid">
        <div><span>Student Name</span><strong>${escapeHtml((`${student?.firstName || ''} ${student?.lastName || ''}`).trim() || '—')}</strong></div>
        <div><span>Admission No.</span><strong>${escapeHtml(student?.admissionNo || '—')}</strong></div>
        <div><span>Class</span><strong>${escapeHtml(cls || '—')}</strong></div>
        <div><span>Payment Date</span><strong>${escapeHtml(fmt(payment.date))}</strong></div>
        <div><span>Payment Method</span><strong>${escapeHtml(payment.method || '—')}</strong></div>
        <div><span>Reference</span><strong>${escapeHtml(payment.reference || '—')}</strong></div>
      </div>
      <table class="doc-table">
        <tbody>
          <tr><th>Amount Paid</th><td class="amount-cell">${escapeHtml(amount(payment.amount))}</td></tr>
          <tr><th>Total Paid to Date</th><td class="amount-cell">${escapeHtml(amount(data.amountPaid))}</td></tr>
          <tr class="balance-row"><th>Remaining Balance</th><td class="amount-cell">${escapeHtml(amount(data.balance))}</td></tr>
        </tbody>
      </table>
      <div class="doc-signoff">
        <p>Thank you for your payment. Please keep this receipt for your records.</p>
        <div class="sig-line"><span>Authorised Signature</span><div class="sig-space"></div></div>
      </div>`,
      `Receipt ${payment.receiptNo}`
    );
  }

  /* ─── 2. Student Report Card ─────────────────────────────────── */
  function printReportCard(report, teacherComment) {
    const student = report.student || {};
    const schoolClass = report.class || {};
    const exam = report.exam || {};
    const teacher = schoolClass.classTeacher || {};
    const teacherName = (`${teacher.firstName || ''} ${teacher.lastName || ''}`).trim() || '—';
    const resultRows = (report.results || []).map(result => `
      <tr>
        <td>${escapeHtml(result.subjectId?.name || '—')}</td>
        <td>${escapeHtml(result.subjectId?.code || '—')}</td>
        <td class="num-cell">${escapeHtml(String(result.marksObtained ?? '—'))}</td>
        <td class="num-cell">${escapeHtml(String(result.maxMarks ?? 100))}</td>
        <td class="num-cell">${escapeHtml(String(result.percentage ?? '—'))}%</td>
        <td class="grade-cell">${escapeHtml(result.grade || '—')}</td>
        <td>${escapeHtml(result.remarks || '—')}</td>
      </tr>`).join('');

    rootForPrint(`
      <div class="doc-header">
        <div class="doc-logo">${escapeHtml(schoolName())}</div>
        <div>
          <h1>Student Report Card</h1>
          <p class="doc-ref">${escapeHtml(exam.term || '')} &nbsp;·&nbsp; ${escapeHtml(exam.academicYear || '')}</p>
        </div>
      </div>
      <div class="doc-meta-grid">
        <div><span>Student Name</span><strong>${escapeHtml((`${student.firstName || ''} ${student.lastName || ''}`).trim())}</strong></div>
        <div><span>Admission No.</span><strong>${escapeHtml(student.admissionNo || '—')}</strong></div>
        <div><span>Class</span><strong>${escapeHtml([schoolClass.name, schoolClass.section].filter(Boolean).join(' · ') || '—')}</strong></div>
        <div><span>Exam / Assessment</span><strong>${escapeHtml(exam.title || '—')}</strong></div>
        <div><span>Academic Year</span><strong>${escapeHtml(exam.academicYear || '—')}</strong></div>
        <div><span>Class Teacher</span><strong>${escapeHtml(teacherName)}</strong></div>
      </div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Subject</th><th>Code</th>
            <th class="num-cell">Marks</th><th class="num-cell">Out of</th>
            <th class="num-cell">%</th><th class="grade-cell">Grade</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${resultRows || '<tr><td colspan="7">No marks recorded for this exam.</td></tr>'}
        </tbody>
        <tfoot>
          <tr>
            <th colspan="2">Totals / Aggregate</th>
            <td class="num-cell"><strong>${escapeHtml(String(report.total ?? '—'))}</strong></td>
            <td class="num-cell">${escapeHtml(String((report.results || []).length * 100))}</td>
            <td class="num-cell"></td>
            <td class="grade-cell"><strong>${escapeHtml(report.aggregateGrade || '—')}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-comments">
        <p><strong>Class Teacher Comments:</strong></p>
        <div class="comment-box">${escapeHtml(teacherComment || report.teacherComment || '—')}</div>
      </div>
      <div class="doc-sigs">
        <div class="sig-block">
          <div class="sig-space"></div>
          <span>Class Teacher: ${escapeHtml(teacherName)}</span>
        </div>
        <div class="sig-block">
          <div class="sig-space"></div>
          <span>Head Teacher / Principal</span>
        </div>
        <div class="sig-block">
          <div class="sig-space"></div>
          <span>Date</span>
        </div>
      </div>`,
      `Report Card – ${student.admissionNo || student.firstName || 'Student'}`
    );
  }

  /* ─── 3. Class Mark Sheet — CSV export ──────────────────────── */
  function downloadMarkSheet(data) {
    /* data = { className, examTitle, term, academicYear, subjectName, subjectCode, rows }
       rows = [{ admissionNo, studentName, marksObtained, maxMarks, percentage, grade, remarks }] */
    const header = [
      data.className || 'Class',
      `${data.examTitle || 'Exam'} — ${data.subjectName || 'Subject'} (${data.subjectCode || ''})`,
      `${data.term || ''} ${data.academicYear || ''}`
    ];
    const csvRows = [
      [`${schoolName()} — Class Mark Sheet`],
      [`Class: ${data.className || '—'}`],
      [`Exam: ${data.examTitle || '—'}`, `Subject: ${data.subjectName || '—'} (${data.subjectCode || '—'})`, `Term: ${data.term || '—'}`, `Academic Year: ${data.academicYear || '—'}`],
      [],
      ['Admission No.', 'Student Name', 'Marks Obtained', 'Out of', 'Percentage (%)', 'Grade', 'Remarks'],
      ...data.rows.map(row => [
        row.admissionNo,
        row.studentName,
        row.marksObtained,
        row.maxMarks,
        row.percentage,
        row.grade,
        row.remarks || ''
      ])
    ];
    const safeClass = String(data.className || 'class').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    const safeExam = String(data.examTitle || 'exam').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    downloadCsv(buildCsv(csvRows), `marks-${safeClass}-${safeExam}.csv`);
  }

  /* ─── 4. Outstanding / Defaulters list — CSV ────────────────── */
  function downloadOutstanding(records) {
    const sorted = [...records].sort((left, right) =>
      String(left.className).localeCompare(String(right.className)) ||
      String(left.student?.admissionNo).localeCompare(String(right.student?.admissionNo))
    );
    const csvRows = [
      [`${schoolName()} — Fee Defaulters / Outstanding Balances`],
      [],
      ['Class', 'Admission No.', 'Student Name', 'Academic Year', 'Term', 'Amount Due (UGX)', 'Amount Paid (UGX)', 'Balance (UGX)', 'Status'],
      ...sorted.map(row => [
        row.className,
        row.student?.admissionNo || '',
        (`${row.student?.firstName || ''} ${row.student?.lastName || ''}`).trim(),
        row.academicYear,
        row.term,
        row.amountDue,
        row.amountPaid,
        row.balance,
        row.status
      ])
    ];
    downloadCsv(buildCsv(csvRows), 'fee-defaulters-by-class.csv');
  }

  /* ─── 4b. Print Defaulters list ─────────────────────────────── */
  function printDefaulters(records) {
    const sorted = [...records].sort((left, right) =>
      String(left.className).localeCompare(String(right.className)) ||
      String(left.student?.admissionNo).localeCompare(String(right.student?.admissionNo))
    );
    const rows = sorted.map(row => `
      <tr>
        <td>${escapeHtml(row.className || '—')}</td>
        <td>${escapeHtml(row.student?.admissionNo || '—')}</td>
        <td>${escapeHtml((`${row.student?.firstName || ''} ${row.student?.lastName || ''}`).trim())}</td>
        <td>${escapeHtml(row.academicYear || '—')}</td>
        <td>${escapeHtml(row.term || '—')}</td>
        <td class="amount-cell">${escapeHtml(amount(row.amountDue))}</td>
        <td class="amount-cell">${escapeHtml(amount(row.amountPaid))}</td>
        <td class="amount-cell balance-row">${escapeHtml(amount(row.balance))}</td>
        <td>${escapeHtml(row.status || '—')}</td>
      </tr>`).join('');

    const totalBalance = sorted.reduce((s, r) => s + Number(r.balance || 0), 0);
    const totalDue = sorted.reduce((s, r) => s + Number(r.amountDue || 0), 0);
    const totalPaid = sorted.reduce((s, r) => s + Number(r.amountPaid || 0), 0);

    rootForPrint(`
      <div class="doc-header">
        <div class="doc-logo">${escapeHtml(schoolName())}</div>
        <div>
          <h1>Fee Defaulters — Outstanding Balances</h1>
          <p class="doc-ref">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Class</th><th>Adm. No.</th><th>Student Name</th>
            <th>Year</th><th>Term</th>
            <th class="amount-cell">Due</th>
            <th class="amount-cell">Paid</th>
            <th class="amount-cell">Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="9">No outstanding balances.</td></tr>'}</tbody>
        <tfoot>
          <tr>
            <th colspan="5">Totals (${sorted.length} student${sorted.length === 1 ? '' : 's'})</th>
            <td class="amount-cell"><strong>${escapeHtml(amount(totalDue))}</strong></td>
            <td class="amount-cell"><strong>${escapeHtml(amount(totalPaid))}</strong></td>
            <td class="amount-cell balance-row"><strong>${escapeHtml(amount(totalBalance))}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-signoff"><p>This report lists all students with an outstanding fee balance as at the date above.</p></div>`,
      'Fee Defaulters List'
    );
  }

  /* ─── 5. Exam Timetable — print ─────────────────────────────── */
  function printExamTimetable(exams, teachers) {
    /* Build a teacher lookup map by id */
    const teacherMap = new Map((teachers || []).map(t => [String(t._id), t]));

    const sorted = [...exams].sort((a, b) => {
      const da = String(a.startDate || a.date || '');
      const db = String(b.startDate || b.date || '');
      return da.localeCompare(db) || String(a.title).localeCompare(String(b.title));
    });

    const rows = sorted.map(exam => {
      const classObj = exam.classId && typeof exam.classId === 'object' ? exam.classId : null;
      const className = classObj ? [classObj.name, classObj.section].filter(Boolean).join(' · ') : '—';
      const teacherId = classObj?.classTeacher
        ? (typeof classObj.classTeacher === 'object' ? String(classObj.classTeacher._id) : String(classObj.classTeacher))
        : null;
      const teacher = teacherId ? teacherMap.get(teacherId) : null;
      const teacherName = teacher ? (`${teacher.firstName || ''} ${teacher.lastName || ''}`).trim() : '—';
      return `
        <tr>
          <td>${escapeHtml(exam.title || '—')}</td>
          <td>${escapeHtml(className)}</td>
          <td>${escapeHtml(exam.term || '—')}</td>
          <td>${escapeHtml(exam.academicYear || '—')}</td>
          <td>${escapeHtml(fmt(exam.startDate || exam.date))}</td>
          <td>${escapeHtml(fmt(exam.endDate))}</td>
          <td>${escapeHtml(teacherName)}</td>
          <td>${escapeHtml(exam.status || '—')}</td>
        </tr>`;
    }).join('');

    rootForPrint(`
      <div class="doc-header">
        <div class="doc-logo">${escapeHtml(schoolName())}</div>
        <div>
          <h1>Examination Timetable</h1>
          <p class="doc-ref">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Exam / Assessment</th><th>Class</th><th>Term</th>
            <th>Academic Year</th><th>Start Date</th><th>End Date</th>
            <th>Class Teacher / Invigilator</th><th>Status</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="8">No exams scheduled.</td></tr>'}</tbody>
      </table>
      <div class="doc-signoff">
        <div class="sig-line"><span>Head Teacher / Principal Signature</span><div class="sig-space"></div></div>
      </div>`,
      'Exam Timetable'
    );
  }

  /* ─── 5b. Exam Schedule — CSV ────────────────────────────────── */
  function downloadExamSchedule(exams, teachers) {
    const teacherMap = new Map((teachers || []).map(t => [String(t._id), t]));

    const sorted = [...exams].sort((a, b) => {
      const da = String(a.startDate || a.date || '');
      const db = String(b.startDate || b.date || '');
      return da.localeCompare(db) || String(a.title).localeCompare(String(b.title));
    });

    const csvRows = [
      [`${schoolName()} — Examination Timetable`],
      [`Generated: ${new Date().toLocaleDateString('en-GB')}`],
      [],
      ['Exam / Assessment', 'Class', 'Term', 'Academic Year', 'Start Date', 'End Date', 'Class Teacher / Invigilator', 'Status'],
      ...sorted.map(exam => {
        const classObj = exam.classId && typeof exam.classId === 'object' ? exam.classId : null;
        const className = classObj ? [classObj.name, classObj.section].filter(Boolean).join(' · ') : '';
        const teacherId = classObj?.classTeacher
          ? (typeof classObj.classTeacher === 'object' ? String(classObj.classTeacher._id) : String(classObj.classTeacher))
          : null;
        const teacher = teacherId ? teacherMap.get(teacherId) : null;
        const teacherName = teacher ? (`${teacher.firstName || ''} ${teacher.lastName || ''}`).trim() : '';
        return [
          exam.title || '',
          className,
          exam.term || '',
          exam.academicYear || '',
          (exam.startDate || exam.date || '').toString().slice(0, 10),
          (exam.endDate || '').toString().slice(0, 10),
          teacherName,
          exam.status || ''
        ];
      })
    ];
    downloadCsv(buildCsv(csvRows), 'exam-timetable.csv');
  }

  window.SchoolDocuments = Object.freeze({
    printReceipt,
    printReportCard,
    downloadMarkSheet,
    downloadOutstanding,
    printDefaulters,
    printExamTimetable,
    downloadExamSchedule
  });
})();
