const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => `UGX ${Number(value || 0).toLocaleString('en-UG', { maximumFractionDigits: 2 })}`;
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(piece => piece[0] || '').join('').toUpperCase();
const fullName = person => person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() : '';
const isoDate = value => value ? String(value).slice(0, 10) : '';
const formatDate = value => {
  const date = isoDate(value);
  if (!date) return '—';
  const bits = date.split('-');
  return bits.length === 3 ? `${bits[2]}/${bits[1]}/${bits[0]}` : date;
};
const titleCase = value => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());

const resourceConfig = {
  students: {
    title: 'Students', singular: 'Student', icon: '♙', subtitle: 'Register learners, keep guardian contacts and maintain student records.',
    fields: [
      { name: 'admissionNo', label: 'Admission number', required: true, placeholder: 'e.g. STU-001' },
      { name: 'firstName', label: 'First name', required: true },
      { name: 'lastName', label: 'Last name', required: true },
      { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Female', 'Male', 'Other'] },
      { name: 'dob', label: 'Date of birth', type: 'date' },
      { name: 'classId', label: 'Class', type: 'relation', ref: 'classes' },
      { name: 'guardianName', label: 'Parent / guardian name' },
      { name: 'guardianPhone', label: 'Guardian phone', type: 'tel' },
      { name: 'email', label: 'Email address', type: 'email' },
      { name: 'address', label: 'Home address', type: 'textarea', span: 2 },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' }
    ],
    columns: [
      { label: 'STUDENT', value: 'student' }, { label: 'ADMISSION NO.', name: 'admissionNo' }, { label: 'CLASS', name: 'classId' }, { label: 'GUARDIAN CONTACT', name: 'guardianPhone' }, { label: 'STATUS', name: 'status', type: 'status' }
    ],
    searchFields: ['admissionNo', 'firstName', 'lastName', 'guardianName', 'guardianPhone', 'email']
  },
  teachers: {
    title: 'Teachers', singular: 'Teacher', icon: '♧', subtitle: 'Maintain teacher profiles, contact information and teaching specialisations.',
    fields: [
      { name: 'staffNo', label: 'Staff number', required: true, placeholder: 'e.g. TCH-001' },
      { name: 'firstName', label: 'First name', required: true }, { name: 'lastName', label: 'Last name', required: true },
      { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Female', 'Male', 'Other'] },
      { name: 'phone', label: 'Phone number', type: 'tel' }, { name: 'email', label: 'Email address', type: 'email' },
      { name: 'specialization', label: 'Specialisation / subjects' }, { name: 'hireDate', label: 'Date hired', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' }
    ],
    columns: [{ label: 'TEACHER', value: 'teacher' }, { label: 'STAFF NO.', name: 'staffNo' }, { label: 'SPECIALISATION', name: 'specialization' }, { label: 'PHONE', name: 'phone' }, { label: 'STATUS', name: 'status', type: 'status' }],
    searchFields: ['staffNo', 'firstName', 'lastName', 'specialization', 'phone', 'email']
  },
  classes: {
    title: 'Classes', singular: 'Class', icon: '▦', subtitle: 'Organise class groups, academic years, class capacity and class teachers.',
    fields: [
      { name: 'name', label: 'Class name', required: true, placeholder: 'e.g. Primary 5' }, { name: 'section', label: 'Section / stream', placeholder: 'e.g. East' },
      { name: 'academicYear', label: 'Academic year', required: true, placeholder: 'e.g. 2026' }, { name: 'classTeacher', label: 'Class teacher', type: 'relation', ref: 'teachers' },
      { name: 'capacity', label: 'Class capacity', type: 'number', min: 1, defaultValue: 40, required: true }
    ],
    columns: [{ label: 'CLASS', value: 'class' }, { label: 'ACADEMIC YEAR', name: 'academicYear' }, { label: 'CLASS TEACHER', name: 'classTeacher' }, { label: 'CAPACITY', name: 'capacity' }],
    searchFields: ['name', 'section', 'academicYear']
  },
  subjects: {
    title: 'Subjects', singular: 'Subject', icon: '▤', subtitle: 'Assign subjects to classes and connect each subject with its teacher.',
    fields: [
      { name: 'name', label: 'Subject name', required: true, placeholder: 'e.g. Mathematics' }, { name: 'code', label: 'Subject code', required: true, placeholder: 'e.g. MATH-P5' },
      { name: 'classId', label: 'Class', type: 'relation', ref: 'classes', required: true }, { name: 'teacherId', label: 'Subject teacher', type: 'relation', ref: 'teachers' }
    ],
    columns: [{ label: 'SUBJECT', value: 'subject' }, { label: 'CODE', name: 'code' }, { label: 'CLASS', name: 'classId' }, { label: 'TEACHER', name: 'teacherId' }],
    searchFields: ['name', 'code']
  },
  attendance: {
    title: 'Attendance', singular: 'Attendance record', icon: '◷', subtitle: 'Record daily attendance and identify students who are absent, late or excused.',
    fields: [
      { name: 'date', label: 'Attendance date', type: 'date', required: true }, { name: 'classId', label: 'Class', type: 'relation', ref: 'classes', required: true },
    ],
    columns: [{ label: 'DATE', name: 'date', type: 'date' }, { label: 'STUDENT', value: 'student' }, { label: 'CLASS', name: 'classId' }, { label: 'STATUS', name: 'status', type: 'status' }, { label: 'REMARKS', name: 'remarks' }],
    searchFields: ['remarks', 'status']
  },
  exams: {
    title: 'Exams', singular: 'Exam', icon: '▣', subtitle: 'Schedule exam sessions and manage their academic year, term and status.',
    fields: [
      { name: 'title', label: 'Exam name', required: true, placeholder: 'e.g. End of Term Examination' },
      { name: 'term', label: 'Term', type: 'select', options: ['Term 1', 'Term 2', 'Term 3'], required: true },
      { name: 'academicYear', label: 'Academic year', required: true, placeholder: 'e.g. 2026' },
      { name: 'classId', label: 'Class', type: 'relation', ref: 'classes', required: true },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Scheduled', 'Completed'], required: true, defaultValue: 'Scheduled' }
    ],
    columns: [{ label: 'EXAM', name: 'title' }, { label: 'TERM', name: 'term' }, { label: 'ACADEMIC YEAR', name: 'academicYear' }, { label: 'CLASS', name: 'classId' }, { label: 'START DATE', name: 'startDate', type: 'date' }, { label: 'END DATE', name: 'endDate', type: 'date' }, { label: 'STATUS', name: 'status', type: 'status' }],
    searchFields: ['title', 'term', 'academicYear']
  },
  results: {
    title: 'Exam Results', singular: 'Result', icon: '▥', subtitle: 'Save student marks by exam and subject. Grades are calculated automatically.',
    fields: [
      { name: 'studentId', label: 'Student', type: 'relation', ref: 'students', required: true },
      { name: 'examId', label: 'Exam', type: 'relation', ref: 'exams', required: true },
      { name: 'subjectId', label: 'Subject', type: 'relation', ref: 'subjects', required: true },
      { name: 'marksObtained', label: 'Marks obtained', type: 'number', min: 0, required: true },
      { name: 'maxMarks', label: 'Maximum marks (%)', type: 'number', min: 1, max: 100, required: true, defaultValue: 100 },
      { name: 'remarks', label: 'Remarks', type: 'textarea', span: 2 }
    ],
    columns: [{ label: 'STUDENT', value: 'student' }, { label: 'EXAM', name: 'examId' }, { label: 'SUBJECT', name: 'subjectId' }, { label: 'MARKS', value: 'marks' }, { label: 'PERCENTAGE', name: 'percentage', type: 'percentage' }, { label: 'GRADE', name: 'grade', type: 'grade' }, { label: 'REMARKS', name: 'remarks' }],
    searchFields: ['remarks', 'grade']
  },
  fees: {
    title: 'School Fees', singular: 'Fee record', icon: '＄', subtitle: 'Track fees due, payments made, payment methods and outstanding balances.',
    fields: [
      { name: 'studentId', label: 'Student', type: 'relation', ref: 'students', required: true },
      { name: 'feeStructureId', label: 'Fee structure', type: 'relation', ref: 'feeStructures' },
      { name: 'term', label: 'Term', type: 'select', options: ['Term 1', 'Term 2', 'Term 3'], required: true },
      { name: 'academicYear', label: 'Academic year', required: true, placeholder: 'e.g. 2026' },
      { name: 'amountDue', label: 'Amount due (UGX)', type: 'number', min: 0, required: true }
    ],
    columns: [{ label: 'STUDENT', value: 'student' }, { label: 'TERM', name: 'term' }, { label: 'AMOUNT DUE', name: 'amountDue', type: 'money' }, { label: 'AMOUNT PAID', name: 'amountPaid', type: 'money' }, { label: 'BALANCE', value: 'balance', type: 'money' }, { label: 'STATUS', name: 'status', type: 'status' }],
    searchFields: ['term', 'academicYear', 'status']
  },
  feeStructures: {
    title: 'Fee Structures', singular: 'Fee structure', icon: '▤', subtitle: 'Set fee amounts by class level, academic year and term.',
    fields: [
      { name: 'classLevel', label: 'Class level / group', required: true, placeholder: 'e.g. S1-S2 or Primary 5' },
      { name: 'academicYear', label: 'Academic year', required: true, placeholder: 'e.g. 2026' },
      { name: 'term', label: 'Term', type: 'select', options: ['Term 1', 'Term 2', 'Term 3'], required: true },
      { name: 'amountDue', label: 'Amount due (UGX)', type: 'number', min: 0, required: true }
    ],
    columns: [{ label: 'CLASS LEVEL', name: 'classLevel' }, { label: 'ACADEMIC YEAR', name: 'academicYear' }, { label: 'TERM', name: 'term' }, { label: 'AMOUNT DUE', name: 'amountDue', type: 'money' }],
    searchFields: ['classLevel', 'academicYear', 'term']
  }
};
const resourceApiPath = resource => resource === 'feeStructures' ? 'fee-structures' : resource;

let currentView = 'dashboard';
let currentRows = [];
let editingId = null;
let deletingId = null;
let paymentFeeId = null;
let paymentHistoryFeeId = null;
let bulkResultsMode = false;
let currentReportCard = null;
const cache = {};

/* ── Student Portal state ── */
let currentRole = null;
let currentUser = null;
let currentStudentTab = 'overview';

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    if (response.status === 401 && !url.includes('/auth/')) showLogin();
    throw new Error(payload?.message || `Request failed (${response.status}).`);
  }
  return payload;
}
function showToast(message, kind = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  $('#toastRegion').appendChild(el);
  window.setTimeout(() => el.remove(), 4200);
}
function showLogin() {
  $('#appView').classList.add('hidden');
  $('#studentView').classList.add('hidden');
  $('#loginView').classList.remove('hidden');
  $('#loginError').textContent = '';
}
function showApp() {
  $('#loginView').classList.add('hidden');
  $('#studentView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  $('#todayDate').textContent = new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  $('#footerYear').textContent = `© ${new Date().getFullYear()}`;
  renderCurrentView();
}
function showStudentApp(user) {
  currentUser = user || null;
  currentRole = 'STUDENT';
  $('#loginView').classList.add('hidden');
  $('#appView').classList.add('hidden');
  $('#studentView').classList.remove('hidden');
  $('#studentTodayDate').textContent = new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  $('#studentFooterYear').textContent = `© ${new Date().getFullYear()}`;
  goToStudentTab('overview');
}
function setActiveNav(view) {
  $$('.nav-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  const config = resourceConfig[view];
  $('#crumbTitle').textContent = config?.title || 'Overview';
}
function displayValue(row, field) {
  const value = row?.[field];
  if (field === 'classId') {
    if (value === null || value === undefined || value === '') return 'Unassigned';
    if (typeof value !== 'object') return 'Unassigned';
    return [value.name, value.section].filter(Boolean).join(' · ') || 'Unassigned';
  }
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object' && value !== null) {
    if (field === 'classTeacher' || field === 'teacherId') return fullName(value) || value.name || '—';
    if (field === 'studentId') return fullName(value) || value.admissionNo || '—';
    if (field === 'examId') return value.title || '—';
    if (field === 'subjectId') return value.name || value.code || '—';
    return value.name || fullName(value) || '—';
  }
  if (['date', 'dob', 'hireDate', 'paymentDate'].includes(field)) return formatDate(value);
  if (field === 'amountDue' || field === 'amountPaid') return money(value);
  return String(value);
}
function statusClass(value) {
  const slug = String(value || 'other').toLowerCase().replace(/\s+/g, '-');
   return ['active', 'inactive', 'unpaid', 'partial', 'paid', 'present', 'absent', 'late', 'excused'].includes(slug) ? slug : 'other';
}
function cellHtml(row, col) {
  if (col.value === 'student') {
    const person = row.studentId || row;
    const name = fullName(person) || 'Unknown student';
    const sub = row.admissionNo || person.admissionNo || (row.studentId ? '' : row.staffNo || '');
    return `<div class="table-person"><div class="person-avatar">${safe(initials(name))}</div><div><div class="person-name">${safe(name)}</div><div class="person-sub">${safe(sub)}</div></div></div>`;
  }
  if (col.value === 'teacher') {
    const name = fullName(row) || 'Unknown teacher';
    return `<div class="table-person"><div class="person-avatar">${safe(initials(name))}</div><div><div class="person-name">${safe(name)}</div><div class="person-sub">${safe(row.staffNo || '')}</div></div></div>`;
  }
  if (col.value === 'class') {
    const title = [row.name, row.section].filter(Boolean).join(' · ');
    return `<div><div class="person-name">${safe(title || 'Unnamed class')}</div><div class="person-sub">${safe(row.academicYear || '')}</div></div>`;
  }
  if (col.value === 'subject') return `<div><div class="person-name">${safe(row.name || '')}</div><div class="person-sub">${safe(row.code || '')}</div></div>`;
  if (col.value === 'marks') return `${safe(row.marksObtained ?? 0)} / ${safe(row.maxMarks ?? 100)}`;
  if (col.value === 'balance') return money(row.balance ?? Math.max(0, Number(row.amountDue || 0) - Number(row.amountPaid || 0)));
  if (col.type === 'percentage') return `${safe(row.percentage ?? 0)}%`;
  if (col.name === 'amountPaid') return money(row.amountPaid);
  if (col.type === 'date') return safe(formatDate(row[col.name]));
  if (col.type === 'money') return safe(money(row[col.name]));
  if (col.type === 'status') return `<span class="status-badge ${statusClass(row[col.name])}">${safe(row[col.name] || 'Unknown')}</span>`;
  if (col.type === 'grade') return `<span class="status-badge ${row.grade === 'D1' || row.grade === 'D2' || row.grade === 'D3' || row.grade === 'D4' || row.grade === 'D5' || row.grade === 'D6' ? 'active' : row.grade === 'P7' || row.grade === 'P8' ? 'other' : 'absent'}">${safe(row.grade || '—')}</span>`;
  return safe(displayValue(row, col.name));
}
function tableHtml(rows, columns, actions = false) {
  if (!rows.length) return `<div class="empty-state">No records found. Add a record to get started.</div>`;
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${columns.map(col => `<th>${safe(col.label)}</th>`).join('')}${actions ? '<th class="actions-head">ACTIONS</th>' : ''}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map(col => `<td>${cellHtml(row, col)}</td>`).join('')}${actions ? `<td><div class="row-actions">${currentView === 'fees' ? `<button type="button" class="action-btn" data-action="history" data-id="${safe(row._id)}">Payments</button><button type="button" class="action-btn" data-action="payment" data-id="${safe(row._id)}">Add payment</button>` : ''}${currentView === 'results' ? `<button type="button" class="action-btn" data-action="print-row-report-card" data-id="${safe(row._id)}" title="Print report card for this student">🖨 Report Card</button>` : ''}${currentView === 'exams' ? `<button type="button" class="action-btn" data-action="results-for-exam" data-id="${safe(row._id)}">Enter marks</button>` : ''}<button type="button" class="action-btn" data-action="edit" data-id="${safe(row._id)}">Edit</button><button type="button" class="action-btn delete" data-action="delete" data-id="${safe(row._id)}">Delete</button></div></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}
function renderDashboard(data) {
  const totals = data.totals || {};
  Object.entries(totals).forEach(([key, value]) => {
    const badge = $(`[data-count="${key}"]`);
    if (badge) badge.textContent = value;
  });
  const feePercent = data.fees?.due ? Math.min(100, Math.round((data.fees.paid / data.fees.due) * 100)) : 0;
  return `
    <div class="page-heading"><div><p class="eyebrow">SCHOOL AT A GLANCE</p><h1>Good day, Administrator <span aria-hidden="true">✦</span></h1><p>Here is what is happening across your school today.</p></div><div class="heading-actions"><button class="btn secondary" data-action="refresh-dashboard">↻ Refresh data</button><button class="btn primary" data-open-resource="students">＋ Add student</button></div></div>
    <div class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Total students</span><span class="stat-icon blue">♙</span></div><div class="stat-value">${totals.students || 0}</div><div class="stat-foot">Registered student records</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Teaching staff</span><span class="stat-icon green">♧</span></div><div class="stat-value">${totals.teachers || 0}</div><div class="stat-foot">Teacher profiles</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Classes</span><span class="stat-icon amber">▦</span></div><div class="stat-value">${totals.classes || 0}</div><div class="stat-foot">Class groups in the system</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Subjects</span><span class="stat-icon purple">▤</span></div><div class="stat-value">${totals.subjects || 0}</div><div class="stat-foot">Subjects currently recorded</div></article>
    </div>
    <section class="panel-card attendance-summary"><div class="panel-title-row"><h2>Today's attendance <span class="muted" style="font-size:11px;font-weight:500">(${totals.attendance || 0} records total)</span></h2><button class="text-link" data-view="attendance">Manage attendance →</button></div><div class="attendance-summary-grid" style="display:flex;flex-wrap:wrap;gap:12px">${['Present', 'Absent', 'Late', 'Excused'].map(status => `<div style="display:flex;flex:1 1 120px;justify-content:space-between;align-items:center;padding:12px;background:#f6f7fb;border-radius:8px"><span class="status-badge ${statusClass(status)}">${status}</span><strong>${Number(data.attendanceToday?.[status] || 0)}</strong></div>`).join('')}</div></section>
    <div class="dashboard-grid">
      <section class="panel-card"><div class="panel-title-row"><h2>Recently registered students</h2><button class="text-link" data-view="students">View all students →</button></div>${tableHtml(data.recentStudents || [], [{label:'STUDENT',value:'student'},{label:'ADMISSION NO.',name:'admissionNo'},{label:'CLASS',name:'classId'},{label:'STATUS',name:'status',type:'status'}])}</section>
      <section class="panel-card"><div class="panel-title-row"><h2>School fees summary</h2><span class="stat-icon green">＄</span></div><div class="mini-metric"><span class="mini-metric-label"><i class="mini-dot"></i>Total fees due</span><strong>${money(data.fees?.due)}</strong></div><div class="mini-metric"><span class="mini-metric-label"><i class="mini-dot green"></i>Total collected</span><strong>${money(data.fees?.paid)}</strong></div><div class="mini-metric"><span class="mini-metric-label"><i class="mini-dot amber"></i>Outstanding balance</span><strong>${money(data.fees?.balance)}</strong></div><div class="fee-progress"><span style="width:${feePercent}%"></span></div><div class="fee-progress-caption"><span>${feePercent}% collected</span><span>${100 - feePercent}% remaining</span></div><div style="margin-top:18px"><button class="btn secondary full" data-view="fees">Manage school fees →</button></div></section>
    </div>
    <div class="dashboard-bottom">
      <section class="panel-card"><div class="panel-title-row"><h2>Recent / upcoming exams</h2><button class="text-link" data-view="exams">Manage exams →</button></div>${tableHtml(data.recentExams || [], [{label:'EXAM',name:'title'},{label:'CLASS',name:'classId'},{label:'START DATE',name:'startDate',type:'date'}])}</section>
      <section class="panel-card"><div class="panel-title-row"><h2>Quick actions</h2><span class="muted" style="font-size:10px">Common tasks</span></div><div class="shortcut-grid"><button class="shortcut" data-open-resource="students"><span class="shortcut-icon">♙</span><span>Register student<small>Add a new learner</small></span></button><button class="shortcut" data-open-resource="teachers"><span class="shortcut-icon">♧</span><span>Add teacher<small>Set up staff profile</small></span></button><button class="shortcut" data-open-resource="attendance"><span class="shortcut-icon">◷</span><span>Take attendance<small>Record student status</small></span></button><button class="shortcut" data-open-resource="results"><span class="shortcut-icon">▥</span><span>Enter results<small>Record exam marks</small></span></button></div></section>
    </div>`;
}
function renderResource(resource, rows) {
  const config = resourceConfig[resource];
  const moduleControls = resource === 'attendance'
    ? `<div class="attendance-filters">
        <label class="attendance-class-filter"><span>Filter by class</span><select id="attendanceClassFilter" aria-label="Filter attendance by class"><option value="">All classes</option>${(cache.classes || []).map(schoolClass => `<option value="${safe(schoolClass._id)}">${safe(relationLabel('classes', schoolClass))}</option>`).join('')}</select></label>
        <label class="attendance-date-filter"><span>Filter by date</span><input id="attendanceDateFilter" type="date" value="${safe(localDateInputValue())}" aria-label="Filter attendance by date"></label>
        <div class="attendance-export-actions">
          <button class="btn secondary" type="button" data-action="print-attendance">Print / Download Attendance Sheet</button>
          <button class="btn secondary" type="button" data-action="download-attendance">Download CSV</button>
        </div>
      </div>`
    : resource === 'exams'
      ? `<div class="exams-export-actions">
          <label class="module-filter">Academic year<select id="examYearFilter"><option value="">All years</option>${[...new Set(rows.map(row => row.academicYear).filter(Boolean))].sort().map(year => `<option value="${safe(year)}">${safe(year)}</option>`).join('')}</select></label>
          <label class="module-filter">Term<select id="examTermFilter"><option value="">All terms</option>${['Term 1', 'Term 2', 'Term 3'].filter(term => rows.some(row => row.term === term)).map(term => `<option value="${safe(term)}">${safe(term)}</option>`).join('')}</select></label>
          <button class="btn secondary" type="button" data-action="print-timetable">🖨 Print Timetable</button>
          <button class="btn secondary" type="button" data-action="download-schedule">⬇ Download Schedule CSV</button>
        </div>`
      : resource === 'results'
        ? `<div class="results-actions">
            <button class="btn primary" type="button" data-action="marks-entry">＋ Enter class marks</button>
            <label class="module-filter">Student<select id="reportStudentFilter"><option value="">Choose student</option>${(cache.students || []).map(student => `<option value="${safe(student._id)}">${safe(relationLabel('students', student))}</option>`).join('')}</select></label>
            <label class="module-filter">Exam<select id="reportExamFilter"><option value="">Choose exam</option>${(cache.exams || []).map(exam => `<option value="${safe(exam._id)}">${safe(exam.title)} · ${safe(exam.term)} · ${safe(exam.academicYear)}</option>`).join('')}</select></label>
            <button class="btn secondary" type="button" data-action="report-card">Generate Report Card</button>
            <div class="results-export-actions">
              <button class="btn secondary" type="button" data-action="download-marksheet">⬇ Download Class Marks CSV</button>
            </div>
          </div>`
          : resource === 'fees'
          ? `<div class="fees-export-actions">
              <button class="btn secondary" type="button" data-action="class-fee-status">👥 Class Fee Status</button>
              <button class="btn secondary" type="button" data-action="outstanding-fees">⬇ Export Defaulters CSV</button>
              <button class="btn secondary" type="button" data-action="print-defaulters">🖨 Print Defaulters List</button>
            </div>`
          : '';
  return `<div class="page-heading"><div><p class="eyebrow">SCHOOL RECORDS / ${safe(config.title.toUpperCase())}</p><h1>${safe(config.title)}</h1><p>${safe(config.subtitle)}</p></div><div class="heading-actions"><button class="btn secondary" data-action="refresh-resource">↻ Refresh</button><button class="btn primary" data-action="add">＋ Add ${safe(config.singular.toLowerCase())}</button></div></div>
    <div class="module-toolbar">${moduleControls}<label class="search-box"><span>⌕</span><input id="tableSearch" type="search" placeholder="Search ${safe(config.title.toLowerCase())}..." autocomplete="off"></label><span class="record-count" id="recordCount">${rows.length} record${rows.length === 1 ? '' : 's'}</span></div>
    <section class="module-card"><div id="tableHost">${tableHtml(rows, config.columns, true)}</div><div class="module-note"><strong>${rows.length} total record${rows.length === 1 ? '' : 's'}</strong> · Use Edit to update a record or Delete to remove it.</div></section>`;
}
async function renderCurrentView() {
  setActiveNav(currentView);
  const page = $('#pageContent');
  page.innerHTML = '<div class="loading-state"><span class="spinner"></span> Loading records…</div>';
  try {
    if (currentView === 'dashboard') {
      const data = await api('/api/dashboard');
      page.innerHTML = renderDashboard(data);
    } else {
      if (currentView === 'attendance') await loadOptionsIfNeeded('classes');
      if (currentView === 'exams') await loadOptionsIfNeeded('classes');
      if (currentView === 'results') {
        await Promise.all(['classes', 'students', 'subjects', 'exams'].map(loadOptionsIfNeeded));
      }
      if (currentView === 'fees') await Promise.all(['students', 'feeStructures'].map(loadOptionsIfNeeded));
      currentRows = await api(`/api/${resourceApiPath(currentView)}`);
      cache[currentView] = currentRows;
      const countBadge = $(`[data-count="${currentView}"]`);
      if (countBadge) countBadge.textContent = currentRows.length;
      page.innerHTML = renderResource(currentView, currentRows);
    }
  } catch (error) {
    page.innerHTML = `<div class="page-heading"><div><p class="eyebrow">CONNECTION CHECK</p><h1>Could not load records</h1><p>${safe(error.message)}</p></div><button class="btn primary" data-action="retry">Try again</button></div><section class="panel-card"><p class="muted">Check that MongoDB Server is running and that the application is started in your VS Code terminal.</p><p><code>mongodb://127.0.0.1:27017/school_management</code></p></section>`;
  }
}
function searchRows(query) {
  const config = resourceConfig[currentView];
  const needle = query.trim().toLowerCase();
  const classId = currentView === 'attendance' ? ($('#attendanceClassFilter')?.value || '') : '';
  const date = currentView === 'attendance' ? ($('#attendanceDateFilter')?.value || '') : '';
  const examYear = currentView === 'exams' ? ($('#examYearFilter')?.value || '') : '';
  const examTerm = currentView === 'exams' ? ($('#examTermFilter')?.value || '') : '';
  return currentRows.filter(row => {
    if (classId && String(relationId(row.classId) || '') !== classId) return false;
    if (date && isoDate(row.date) !== date) return false;
    if (examYear && row.academicYear !== examYear) return false;
    if (examTerm && row.term !== examTerm) return false;
    if (!needle) return true;
    return config.searchFields.some(field => {
    const value = row[field];
    const flattened = value && typeof value === 'object' ? `${value.name || ''} ${fullName(value)} ${value.code || ''} ${value.admissionNo || ''}` : String(value ?? '');
    return flattened.toLowerCase().includes(needle);
    }) || config.columns.some(col => String(col.name ? displayValue(row, col.name) : col.value === 'student' ? fullName(row.studentId) : '').toLowerCase().includes(needle));
  });
}
function updateTableSearch() {
  const host = $('#tableHost');
  if (!host || !resourceConfig[currentView]) return;
  const rows = searchRows($('#tableSearch')?.value || '');
  host.innerHTML = tableHtml(rows, resourceConfig[currentView].columns, true);
  const count = $('#recordCount');
  if (count) count.textContent = `${rows.length} matching record${rows.length === 1 ? '' : 's'}`;
}
function relationLabel(resource, row) {
  if (!row) return '';
  if (resource === 'students') return `${row.admissionNo ? `${row.admissionNo} — ` : ''}${fullName(row)}`;
  if (resource === 'teachers') return `${row.staffNo ? `${row.staffNo} — ` : ''}${fullName(row)}`;
  if (resource === 'classes') return [row.name, row.section, row.academicYear ? `(${row.academicYear})` : ''].filter(Boolean).join(' · ');
  if (resource === 'subjects') return `${row.code ? `${row.code} — ` : ''}${row.name || ''}`;
  if (resource === 'exams') return `${row.title || ''}${row.term ? ` — ${row.term}` : ''}`;
  if (resource === 'feeStructures') return `${row.classLevel} · ${row.academicYear} · ${row.term} · ${money(row.amountDue)}`;
  return row.name || row.title || fullName(row) || row._id;
}
function relationId(value) {
  return value && typeof value === 'object' ? value._id : value;
}
function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
async function selectedAttendanceSheet() {
  const classId = $('#attendanceClassFilter')?.value || '';
  const date = $('#attendanceDateFilter')?.value || '';
  if (!classId) throw new Error('Choose a class before printing or downloading the attendance sheet.');
  if (!date) throw new Error('Choose a date before printing or downloading the attendance sheet.');

  const schoolClass = (cache.classes || []).find(item => String(item._id) === classId);
  if (!schoolClass) throw new Error('The selected class could not be found. Refresh the page and try again.');
  const students = await loadOptionsIfNeeded('students');
  const classStudents = students
    .filter(student => String(relationId(student.classId) || '') === classId)
    .sort((left, right) => String(left.admissionNo || '').localeCompare(String(right.admissionNo || '')));
  const attendanceByStudent = new Map(currentRows
    .filter(record => String(relationId(record.classId) || '') === classId && isoDate(record.date) === date)
    .map(record => [String(relationId(record.studentId) || ''), record]));

  return {
    className: relationLabel('classes', schoolClass),
    date,
    rows: classStudents.map(student => {
      const record = attendanceByStudent.get(String(student._id));
      return {
        admissionNo: student.admissionNo || '',
        studentName: fullName(student) || 'Unnamed student',
        status: record?.status || 'Not recorded',
        remarks: record?.remarks || ''
      };
    })
  };
}
async function handleAttendanceExport(action) {
  try {
    const sheet = await selectedAttendanceSheet();
    if (action === 'print-attendance') window.AttendanceExport.printSheet(sheet);
    else window.AttendanceExport.downloadCsv(sheet);
  } catch (error) {
    showToast(`Could not prepare the attendance sheet: ${error.message}`, 'error');
  }
}
function updateAttendanceStudentOptions(selectedStudentId = null) {
  const classSelect = $('select[name="classId"]', $('#recordForm'));
  const studentSelect = $('select[name="studentId"]', $('#recordForm'));
  if (!classSelect || !studentSelect) return;

  const classId = classSelect.value;
  const students = cache.students || [];
  const availableStudents = classId
    ? students.filter(student => String(relationId(student.classId) || '') === classId)
    : students;
  const selectedId = selectedStudentId || studentSelect.value;

  studentSelect.innerHTML = `<option value="">Choose student</option>${availableStudents.map(student =>
    `<option value="${safe(student._id)}">${safe(relationLabel('students', student))}</option>`
  ).join('')}`;
  if (selectedId && availableStudents.some(student => String(student._id) === String(selectedId))) {
    studentSelect.value = selectedId;
  }
}
function optionsForResource(resource, rows) {
  return rows.map(row => `<option value="${safe(row._id)}">${safe(relationLabel(resource, row))}</option>`).join('');
}
async function openBulkResultsForm(examId = '') {
  bulkResultsMode = true;
  editingId = null;
  paymentFeeId = null;
  bulkResultsMode = false;
  $('#modalTitle').textContent = 'Enter class marks';
  $('#modalEyebrow').textContent = 'EXAM RESULTS';
  $('#saveRecord').textContent = 'Save marks';
  $('#saveRecord').classList.remove('hidden');
  $('#formError').textContent = '';
  $('#formFields').innerHTML = `
    <label>Class *<select id="marksClass" required><option value="">Choose class</option>${optionsForResource('classes', cache.classes || [])}</select></label>
    <label>Exam *<select id="marksExam" required><option value="">Choose exam</option></select></label>
    <label>Subject *<select id="marksSubject" required><option value="">Choose subject</option></select></label>
    <div id="marksRoster" class="span-2"><p class="muted">Choose a class, exam and subject to load students.</p></div>`;
  $('#modalLayer').classList.remove('hidden');
  if (examId) {
    const exam = (cache.exams || []).find(item => String(item._id) === String(examId));
    if (exam) {
      $('#marksClass').value = String(relationId(exam.classId) || '');
      updateBulkResultOptions();
      $('#marksExam').value = String(exam._id);
      renderMarksRoster();
    }
  }
  $('#marksClass').focus();
}
function renderMarksRoster() {
  const host = $('#marksRoster');
  if (!host) return;
  const classId = $('#marksClass').value;
  const examId = $('#marksExam').value;
  const subjectId = $('#marksSubject').value;
  if (!classId || !examId || !subjectId) {
    host.innerHTML = '<p class="muted">Choose a class, exam and subject to load students.</p>';
    return;
  }
  const students = (cache.students || []).filter(student => String(relationId(student.classId) || '') === classId);
  if (!students.length) {
    host.innerHTML = '<div class="empty-state">No students are enrolled in this class.</div>';
    return;
  }
  const existing = new Map(currentRows.filter(row =>
    String(relationId(row.examId) || '') === examId && String(relationId(row.subjectId) || '') === subjectId
  ).map(row => [String(relationId(row.studentId) || ''), row]));
  host.innerHTML = `<div class="table-wrap"><table class="data-table marks-roster"><thead><tr><th>STUDENT</th><th>MARKS (%)</th><th>GRADE</th><th>REMARKS</th></tr></thead><tbody>${students.map(student => {
    const result = existing.get(String(student._id));
    const percentage = result ? Number(result.percentage ?? result.marksObtained) : '';
    return `<tr data-mark-row data-student-id="${safe(student._id)}">
      <td>${safe(relationLabel('students', student))}</td>
      <td><input data-mark-value type="number" min="0" max="100" step="any" value="${safe(percentage)}" required aria-label="Marks for ${safe(fullName(student))}"></td>
      <td data-mark-grade>${safe(result?.grade || '—')}</td><td data-mark-remark>${safe(result?.remarks || '—')}</td>
    </tr>`;
  }).join('')}</tbody></table></div>`;
}
function updateBulkResultOptions() {
  const classId = $('#marksClass')?.value || '';
  const examSelect = $('#marksExam');
  const subjectSelect = $('#marksSubject');
  if (!examSelect || !subjectSelect) return;
  const exams = (cache.exams || []).filter(exam => String(relationId(exam.classId) || '') === classId);
  const subjects = (cache.subjects || []).filter(subject => String(relationId(subject.classId) || '') === classId);
  examSelect.innerHTML = `<option value="">Choose exam</option>${optionsForResource('exams', exams)}`;
  subjectSelect.innerHTML = `<option value="">Choose subject</option>${optionsForResource('subjects', subjects)}`;
  renderMarksRoster();
}
async function saveBulkResults(event) {
  event.preventDefault();
  const classId = $('#marksClass')?.value;
  const examId = $('#marksExam')?.value;
  const subjectId = $('#marksSubject')?.value;
  const rows = $$('[data-mark-row]', $('#formFields'));
  if (!classId || !examId || !subjectId || !rows.length) {
    $('#formError').textContent = 'Choose a class, exam and subject with enrolled students.';
    return;
  }
  const records = rows.map(row => ({
    studentId: row.dataset.studentId,
    marksObtained: Number($('[data-mark-value]', row).value)
  }));
  const button = $('#saveRecord');
  button.disabled = true;
  $('#formError').textContent = '';
  try {
    const result = await api('/api/results/bulk', { method: 'POST', body: JSON.stringify({ classId, examId, subjectId, records }) });
    closeRecordForm();
    delete cache.results;
    await renderCurrentView();
    showToast(`Marks saved for ${result.records.length} student${result.records.length === 1 ? '' : 's'}.`);
  } catch (error) {
    $('#formError').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}
async function generateReportCard() {
  const studentId = $('#reportStudentFilter')?.value;
  const examId = $('#reportExamFilter')?.value;
  if (!studentId || !examId) return showToast('Choose a student and exam to generate the report card.', 'error');
  try {
    const report = await api(`/api/results/report-card?studentId=${encodeURIComponent(studentId)}&examId=${encodeURIComponent(examId)}`);
    currentReportCard = report;
    const schoolClass = report.class || {};
    const teacher = schoolClass.classTeacher;
    $('#modalTitle').textContent = 'Student report card';
    $('#modalEyebrow').textContent = 'ACADEMIC REPORT';
    $('#saveRecord').classList.add('hidden');
    $('#formError').textContent = '';
    $('#formFields').innerHTML = `
      <div class="report-card-document span-2" id="reportCardDocument">
        <header><h2>SchoolFlow Student Report Card</h2><p><strong>Student:</strong> ${safe(fullName(report.student))} &nbsp; <strong>Admission No.:</strong> ${safe(report.student.admissionNo)}</p>
        <p><strong>Class:</strong> ${safe(schoolClass.name || '—')} &nbsp; <strong>Exam:</strong> ${safe(report.exam.title)} &nbsp; <strong>Term:</strong> ${safe(report.exam.term)} ${safe(report.exam.academicYear)}</p></header>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>SUBJECT</th><th>MARKS (%)</th><th>GRADE</th><th>REMARKS</th></tr></thead><tbody>${report.results.length ? report.results.map(result => `<tr><td>${safe(result.subjectId?.name || '—')}</td><td>${safe(result.percentage)}%</td><td>${safe(result.grade)}</td><td>${safe(result.remarks || '—')}</td></tr>`).join('') : '<tr><td colspan="4">No marks recorded for this exam.</td></tr>'}</tbody>
        <tfoot><tr><th>Total marks</th><td colspan="3">${safe(report.total)} / ${safe(report.results.length * 100)} &nbsp; · &nbsp; Aggregate grade: <strong>${safe(report.aggregateGrade)}</strong></td></tr></tfoot></table></div>
        <p><strong>Class teacher:</strong> ${safe(fullName(teacher) || '—')}</p>
        <label>Class teacher comments<textarea id="reportTeacherComment" maxlength="2000">${safe(report.teacherComment)}</textarea></label>
      </div>
      <div class="report-card-actions span-2"><button type="button" class="btn secondary" data-action="save-report-comment">Save teacher comments</button><button type="button" class="btn primary" data-action="print-report-card">Print report card</button></div>`;
    $('#modalLayer').classList.remove('hidden');
  } catch (error) {
    showToast(`Could not generate report card: ${error.message}`, 'error');
  }
}
async function saveReportComment() {
  if (!currentReportCard) return;
  try {
    const result = await api('/api/results/report-card', {
      method: 'PUT',
      body: JSON.stringify({
        studentId: currentReportCard.student._id,
        examId: currentReportCard.exam._id,
        teacherComment: $('#reportTeacherComment')?.value || ''
      })
    });
    currentReportCard.teacherComment = result.teacherComment;
    showToast('Class teacher comments saved.');
  } catch (error) {
    showToast(`Could not save teacher comments: ${error.message}`, 'error');
  }
}
function renderBulkAttendanceRoster() {
  const host = $('#attendanceRoster');
  if (!host) return;
  const classId = $('select[name="classId"]', $('#recordForm'))?.value;
  if (!classId) {
    host.innerHTML = '<p class="muted">Choose a class to load its students.</p>';
    return;
  }
  const students = (cache.students || []).filter(student => String(relationId(student.classId) || '') === classId);
  if (!students.length) {
    host.innerHTML = '<div class="empty-state">No students are assigned to this class.</div>';
    return;
  }
  const statusOptions = ['Present', 'Absent', 'Late', 'Excused'];
  host.innerHTML = `
    <div class="attendance-roster-heading"><strong>Class roster</strong><span>${students.length} student${students.length === 1 ? '' : 's'}</span></div>
    <div class="table-wrap"><table class="data-table attendance-roster-table">
      <thead><tr><th>STUDENT</th><th>ATTENDANCE STATUS</th><th>REMARKS</th></tr></thead>
      <tbody>${students.map(student => `<tr data-attendance-row data-student-id="${safe(student._id)}">
        <td><div class="person-name">${safe(fullName(student) || 'Unnamed student')}</div><div class="person-sub">${safe(student.admissionNo || '')}</div></td>
        <td><select aria-label="Attendance status for ${safe(fullName(student))}" data-attendance-status>${statusOptions.map(status => `<option value="${status}" ${status === 'Present' ? 'selected' : ''}>${status}</option>`).join('')}</select></td>
        <td><input type="text" aria-label="Remarks for ${safe(fullName(student))}" data-attendance-remarks maxlength="500" placeholder="Optional remarks"></td>
      </tr>`).join('')}</tbody>
    </table></div>`;
}
async function loadOptionsIfNeeded(resource) {
  if (Array.isArray(cache[resource])) return cache[resource];
  cache[resource] = await api(`/api/${resourceApiPath(resource)}`);
  return cache[resource];
}
async function openRecordForm(id = null) {
  bulkResultsMode = false;
  currentReportCard = null;
  paymentFeeId = null;
  $('#saveRecord').classList.remove('hidden');
  editingId = id;
  const config = resourceConfig[currentView];
  const existing = id ? currentRows.find(row => row._id === id) : null;
  if (id && !existing) return showToast('That record could not be found. Refresh and try again.', 'error');
  $('#modalTitle').textContent = currentView === 'attendance' && !id ? 'Record class attendance' : `${id ? 'Edit' : 'Add'} ${config.singular.toLowerCase()}`;
  $('#modalEyebrow').textContent = config.title.toUpperCase();
  $('#saveRecord').textContent = currentView === 'attendance' && !id ? 'Save attendance' : id ? 'Save changes' : `Save ${config.singular.toLowerCase()}`;
  $('#formError').textContent = '';
  $('#formFields').innerHTML = '<p class="muted">Preparing form…</p>';
  $('#modalLayer').classList.remove('hidden');
  try {
    const formFields = currentView === 'attendance' && id
      ? [...config.fields,
        { name: 'studentId', label: 'Student', type: 'relation', ref: 'students', required: true },
        { name: 'status', label: 'Attendance status', type: 'select', required: true, options: ['Present', 'Absent', 'Late', 'Excused'], defaultValue: 'Present' },
        { name: 'remarks', label: 'Remarks', type: 'textarea', span: 2 }]
      : config.fields;
    const values = {};
    for (const field of formFields) {
      if (field.type === 'relation') values[field.name] = await loadOptionsIfNeeded(field.ref);
    }
    const html = formFields.map(field => {
      const value = existing ? existing[field.name] : undefined;
      const normalized = value && typeof value === 'object' ? value._id : value;
      const val = normalized !== undefined && normalized !== null ? (field.type === 'date' ? isoDate(normalized) : normalized) : (field.defaultValue ?? '');
      const required = field.required ? 'required' : '';
      const span = field.span === 2 ? 'span-2' : '';
      const label = `${safe(field.label)}${field.required ? ' *' : ''}`;
      if (field.type === 'select') {
        const options = (field.options || []).map(opt => `<option value="${safe(opt)}" ${String(val) === String(opt) ? 'selected' : ''}>${safe(opt)}</option>`).join('');
        return `<label class="${span}">${label}<select name="${safe(field.name)}" ${required}><option value="">Choose ${safe(field.label.toLowerCase())}</option>${options}</select></label>`;
      }
      if (field.type === 'relation') {
        const options = (values[field.name] || []).map(row => `<option value="${safe(row._id)}" ${String(val) === String(row._id) ? 'selected' : ''}>${safe(relationLabel(field.ref, row))}</option>`).join('');
        return `<label class="${span}">${label}<select name="${safe(field.name)}" ${required}><option value="">${field.required ? 'Choose' : 'None selected'} — ${safe(field.label.toLowerCase())}</option>${options}</select></label>`;
      }
      if (field.type === 'textarea') return `<label class="${span}">${label}<textarea name="${safe(field.name)}" placeholder="${safe(field.placeholder || '')}" ${required}>${safe(val)}</textarea></label>`;
      const inputType = ['date', 'email', 'tel', 'number'].includes(field.type) ? field.type : 'text';
      const min = field.min !== undefined ? `min="${safe(field.min)}"` : '';
      const max = field.max !== undefined ? `max="${safe(field.max)}"` : '';
      const step = inputType === 'number' ? 'step="any"' : '';
      return `<label class="${span}">${label}<input name="${safe(field.name)}" type="${inputType}" value="${safe(val)}" placeholder="${safe(field.placeholder || '')}" ${min} ${max} ${step} ${required}></label>`;
    }).join('');
    $('#formFields').innerHTML = `${html}${currentView === 'attendance' && !id ? '<div id="attendanceRoster" class="span-2"></div>' : ''}`;
    if (currentView === 'attendance') {
      if (id) updateAttendanceStudentOptions(existing?.studentId?._id || existing?.studentId || null);
      else renderBulkAttendanceRoster();
    }
    const first = $('#formFields input, #formFields select, #formFields textarea');
    if (first) first.focus();
  } catch (error) {
    $('#formFields').innerHTML = '';
    $('#formError').textContent = `Could not prepare the form: ${error.message}. Add required records first, or check the database connection.`;
  }
}
function closeRecordForm() {
  $('#modalLayer').classList.add('hidden');
  $('#recordForm').reset();
  editingId = null;
  paymentFeeId = null;
}
async function openPaymentForm(id) {
  const fee = currentRows.find(row => row._id === id);
  if (!fee) return showToast('Fee record not found. Refresh and try again.', 'error');
  if (Number(fee.balance ?? fee.amountDue - fee.amountPaid) <= 0) return showToast('This fee record is already fully paid.', 'error');
  paymentFeeId = id;
  editingId = null;
  $('#modalTitle').textContent = 'Record a fee payment';
  $('#modalEyebrow').textContent = 'SCHOOL FEES';
  $('#saveRecord').textContent = 'Save payment';
  $('#saveRecord').classList.remove('hidden');
  $('#formError').textContent = '';
  $('#formFields').innerHTML = `
    <p class="span-2 muted">Outstanding balance: <strong>${safe(money(fee.balance ?? fee.amountDue - fee.amountPaid))}</strong></p>
    <label>Receipt number *<input name="receiptNo" type="text" required value="SF-${Date.now()}"></label>
    <label>Payment amount (UGX) *<input name="amount" type="number" min="0.01" max="${safe(fee.balance ?? fee.amountDue - fee.amountPaid)}" step="any" required></label>
    <label>Payment date *<input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" required></label>
    <label>Payment method *<select name="paymentMethod" required><option>Cash</option><option>Mobile Money (MTN / Airtel)</option><option>Bank Deposit</option><option>Bank Check</option></select></label>
    <label>Payment reference<input name="reference" type="text"></label>`;
  $('#modalLayer').classList.remove('hidden');
  $('input[name="amount"]', $('#recordForm')).focus();
}
async function showPaymentHistory(id) {
  paymentHistoryFeeId = id;
  $('#modalTitle').textContent = 'Payment history';
  $('#modalEyebrow').textContent = 'SCHOOL FEES';
  $('#saveRecord').classList.add('hidden');
  $('#formError').textContent = '';
  $('#formFields').innerHTML = '<p class="loading-state"><span class="spinner"></span> Loading payments…</p>';
  $('#modalLayer').classList.remove('hidden');
  try {
    const data = await api(`/api/fees/${encodeURIComponent(id)}/payments`);
    const rows = data.payments || [];
    $('#formFields').innerHTML = `<div class="span-2">${rows.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>RECEIPT NO.</th><th>DATE</th><th>AMOUNT</th><th>METHOD</th><th>REFERENCE</th><th>ACTION</th></tr></thead><tbody>${rows.map(payment => `<tr><td>${safe(payment.receiptNo || '—')}</td><td>${safe(formatDate(payment.date))}</td><td>${safe(money(payment.amount))}</td><td>${safe(payment.method)}</td><td>${safe(payment.reference || '—')}</td><td><button type="button" class="action-btn" data-action="print-receipt" data-payment-id="${safe(payment._id)}">🖨 Print receipt</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">No payments have been recorded.</div>'}<div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:16px"><span>Student: <strong>${safe(fullName(data.student))}</strong></span><span>Due: <strong>${safe(money(data.amountDue))}</strong></span><span>Paid: <strong>${safe(money(data.amountPaid))}</strong></span><span>Balance: <strong>${safe(money(data.balance))}</strong></span></div></div>`;
  } catch (error) {
    $('#formFields').innerHTML = '';
    $('#formError').textContent = error.message;
  }
}
function openDeleteDialog(id) {
  deletingId = id;
  const row = currentRows.find(record => record._id === id);
  const config = resourceConfig[currentView];
  const label = row ? (fullName(row) || row.name || row.title || row.admissionNo || row.staffNo || row.code || config.singular.toLowerCase()) : config.singular.toLowerCase();
  $('#confirmMessage').textContent = `You are about to delete “${label}”. This action cannot be undone.`;
  $('#confirmLayer').classList.remove('hidden');
}
function closeDeleteDialog() { $('#confirmLayer').classList.add('hidden'); deletingId = null; }
async function handleSaveRecord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const saveButton = $('#saveRecord');
  const body = {};
  for (const [key, value] of new FormData(form).entries()) body[key] = value;
  if (paymentFeeId) {
    const feeId = paymentFeeId;
    body.amount = Number(body.amount);
    saveButton.disabled = true;
    saveButton.textContent = 'Saving…';
    $('#formError').textContent = '';
    try {
      const savedPayment = await api(`/api/fees/${encodeURIComponent(feeId)}/payments`, { method: 'POST', body: JSON.stringify(body) });
      closeRecordForm();
      delete cache.fees;
      await renderCurrentView();
      showToast(`Payment recorded. Receipt ${savedPayment.payment.receiptNo} is available in payment history.`);
    } catch (error) {
      $('#formError').textContent = error.message;
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = 'Save payment';
    }
    return;
  }
  const config = resourceConfig[currentView];
  const wasEditing = Boolean(editingId);
  const saveLabel = currentView === 'attendance' && !editingId ? 'Save attendance' : editingId ? 'Save changes' : `Save ${config.singular.toLowerCase()}`;
  for (const field of config.fields) {
    if (field.type === 'number' && body[field.name] !== undefined && body[field.name] !== '') body[field.name] = Number(body[field.name]);
  }
  saveButton.disabled = true;
  saveButton.textContent = 'Saving…';
  $('#formError').textContent = '';
  try {
    if (currentView === 'attendance' && !editingId) {
      const attendanceRows = $$('[data-attendance-row]', $('#formFields'));
      if (!attendanceRows.length) throw new Error('Choose a class with enrolled students before saving attendance.');
      const records = attendanceRows.map(row => ({
        studentId: row.dataset.studentId,
        status: $('[data-attendance-status]', row).value,
        remarks: $('[data-attendance-remarks]', row).value.trim()
      }));
      const result = await api('/api/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify({ classId: body.classId, date: body.date, records })
      });
      closeRecordForm();
      delete cache.attendance;
      await renderCurrentView();
      showToast(`Attendance saved for ${result.records.length} student${result.records.length === 1 ? '' : 's'}.`);
      return;
    }
    await api(`/api/${resourceApiPath(currentView)}${editingId ? `/${encodeURIComponent(editingId)}` : ''}`, {
      method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body)
    });
    closeRecordForm();
    delete cache[currentView];
    if (currentView === 'students' || currentView === 'teachers' || currentView === 'classes' || currentView === 'subjects' || currentView === 'exams') {
      Object.keys(cache).forEach(key => { if (key !== currentView) delete cache[key]; });
    }
    await renderCurrentView();
    showToast(`${config.singular} ${wasEditing ? 'updated' : 'created'} successfully.`);
  } catch (error) {
    $('#formError').textContent = error.message;
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = saveLabel;
  }
}
async function deleteRecord() {
  if (!deletingId) return;
  const id = deletingId;
  const config = resourceConfig[currentView];
  $('#confirmDelete').disabled = true;
  $('#confirmDelete').textContent = 'Deleting…';
  try {
    await api(`/api/${resourceApiPath(currentView)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    closeDeleteDialog();
    delete cache[currentView];
    if (['students', 'teachers', 'classes', 'subjects', 'exams'].includes(currentView)) Object.keys(cache).forEach(key => { if (key !== currentView) delete cache[key]; });
    await renderCurrentView();
    showToast(`${config.singular} deleted successfully.`);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    $('#confirmDelete').disabled = false;
    $('#confirmDelete').textContent = 'Delete record';
  }
}
async function exportOutstandingFees() {
  try {
    const records = await api('/api/fees/outstanding');
    window.SchoolDocuments.downloadOutstanding(records);
  } catch (error) {
    showToast(`Could not export outstanding balances: ${error.message}`, 'error');
  }
}
async function printPaymentReceipt(feeId, paymentId) {
  try {
    const data = await api(`/api/fees/${encodeURIComponent(feeId)}/payments`);
    const payment = data.payments.find(row => String(row._id) === String(paymentId));
    if (!payment) throw new Error('Payment not found in this fee record.');
    window.SchoolDocuments.printReceipt({
      payment,
      student: data.student,
      amountDue: data.amountDue,
      amountPaid: data.amountPaid,
      balance: data.balance
    });
  } catch (error) {
    showToast(`Could not print receipt: ${error.message}`, 'error');
  }
}
/* ── New print / export helpers ──────────────────────────────── */

/** Print a report card directly from a results row, without opening the modal filter first. */
async function printRowReportCard(resultId) {
  const result = currentRows.find(row => row._id === resultId);
  if (!result) return showToast('Result record not found. Refresh and try again.', 'error');
  const studentId = result.studentId?._id || result.studentId;
  const examId = result.examId?._id || result.examId;
  if (!studentId || !examId) return showToast('This result is missing student or exam information.', 'error');
  try {
    const report = await api(`/api/results/report-card?studentId=${encodeURIComponent(studentId)}&examId=${encodeURIComponent(examId)}`);
    window.SchoolDocuments.printReportCard(report, report.teacherComment || '');
  } catch (error) {
    showToast(`Could not print report card: ${error.message}`, 'error');
  }
}

/** Build a class mark sheet from current results rows and download as CSV. */
async function downloadMarkSheet() {
  if (!currentRows.length) return showToast('No results to export. Load the Results module first.', 'error');
  try {
    // Use the first row to determine exam + subject + class context
    const first = currentRows[0];
    const examId = first.examId?._id || first.examId;
    const subjectId = first.subjectId?._id || first.subjectId;
    const exam = (cache.exams || []).find(e => String(e._id) === String(examId));
    const subject = (cache.subjects || []).find(s => String(s._id) === String(subjectId));
    const classId = exam?.classId?._id || exam?.classId || subject?.classId?._id || subject?.classId;
    const schoolClass = (cache.classes || []).find(c => String(c._id) === String(classId));

    const markRows = currentRows.map(row => ({
      admissionNo: row.studentId?.admissionNo || '',
      studentName: fullName(row.studentId) || '—',
      marksObtained: row.marksObtained ?? '',
      maxMarks: row.maxMarks ?? 100,
      percentage: row.percentage ?? '',
      grade: row.grade || '—',
      remarks: row.remarks || ''
    }));

    window.SchoolDocuments.downloadMarkSheet({
      className: schoolClass ? [schoolClass.name, schoolClass.section].filter(Boolean).join(' · ') : '—',
      examTitle: exam?.title || (first.examId?.title) || '—',
      term: exam?.term || '—',
      academicYear: exam?.academicYear || '—',
      subjectName: subject?.name || (first.subjectId?.name) || '—',
      subjectCode: subject?.code || (first.subjectId?.code) || '—',
      rows: markRows
    });
  } catch (error) {
    showToast(`Could not export mark sheet: ${error.message}`, 'error');
  }
}

/** Print outstanding fees as a printable defaulters list. */
async function printDefaultersList() {
  try {
    const records = await api('/api/fees/outstanding');
    if (!records.length) return showToast('No outstanding balances to print.', 'error');
    window.SchoolDocuments.printDefaulters(records);
  } catch (error) {
    showToast(`Could not print defaulters list: ${error.message}`, 'error');
  }
}

/** Get the visible (filtered) exams rows from the current view. */
function visibleExamRows() {
  const examYear = $('#examYearFilter')?.value || '';
  const examTerm = $('#examTermFilter')?.value || '';
  return currentRows.filter(row => {
    if (examYear && row.academicYear !== examYear) return false;
    if (examTerm && row.term !== examTerm) return false;
    return true;
  });
}

/** Print exam timetable for the currently visible/filtered exams. */
async function printTimetable() {
  const rows = visibleExamRows();
  if (!rows.length) return showToast('No exams to print. Adjust the filters or add exams first.', 'error');
  try {
    const teachers = await loadOptionsIfNeeded('teachers');
    window.SchoolDocuments.printExamTimetable(rows, teachers);
  } catch (error) {
    showToast(`Could not print timetable: ${error.message}`, 'error');
  }
}

/** Download exam schedule CSV for the currently visible/filtered exams. */
async function downloadSchedule() {
  const rows = visibleExamRows();
  if (!rows.length) return showToast('No exams to export. Adjust the filters or add exams first.', 'error');
  try {
    const teachers = await loadOptionsIfNeeded('teachers');
    window.SchoolDocuments.downloadExamSchedule(rows, teachers);
  } catch (error) {
    showToast(`Could not download schedule: ${error.message}`, 'error');
  }
}

/* ════════════════════════════════════════════════════════════
   STUDENT PORTAL
   Students see only their own records, fetched through /api/me/*.
   No admin controls (Add / Edit / Delete) are rendered here. ═ */

function applyStudentIdentity(student) {
  if (!student) return;
  const name = fullName(student) || 'Student';
  const cls = student.classId && typeof student.classId === 'object' ? student.classId : null;
  const className = cls ? [cls.name, cls.section].filter(Boolean).join(' · ') : 'Unassigned';
  const avatar = initials(name);
  $('#studentAvatar').textContent = safe(avatar);
  $('#studentName').textContent = safe(name);
  $('#studentClass').textContent = safe(className);
  $('#studentUserAvatar').textContent = safe(avatar);
  $('#studentUserName').textContent = safe(name);
}

const studentTabLabels = { overview: 'Dashboard Overview', attendance: 'My Attendance', reportcards: 'My Report Cards', fees: 'My Fees Statement' };

function setActiveStudentTab(tab) {
  $$('#studentNav .nav-item').forEach(item => item.classList.toggle('active', item.dataset.studentTab === tab));
  $('#studentCrumb').textContent = studentTabLabels[tab] || 'Overview';
}

async function goToStudentTab(tab) {
  if (!studentTabLabels[tab]) tab = 'overview';
  currentStudentTab = tab;
  setActiveStudentTab(tab);
  $('#studentSidebar').classList.remove('open');
  $('#studentScrim').classList.remove('show');
  const page = $('#studentContent');
  page.innerHTML = '<div class="loading-state"><span class="spinner"></span> Loading…</div>';
  try {
    if (tab === 'overview') {
      const data = await api('/api/me');
      applyStudentIdentity(data.student);
      page.innerHTML = renderStudentOverview(data);
    } else if (tab === 'attendance') {
      const data = await api('/api/me/attendance');
      applyStudentIdentity(data.student || null);
      page.innerHTML = renderStudentAttendance(data);
    } else if (tab === 'reportcards') {
      const data = await api('/api/me/report-cards');
      applyStudentIdentity(data.student || null);
      page.innerHTML = renderStudentReportCards(data);
    } else if (tab === 'fees') {
      const data = await api('/api/me/fees');
      applyStudentIdentity(data.student || null);
      page.innerHTML = renderStudentFees(data);
    }
  } catch (error) {
    page.innerHTML = `<div class="page-heading"><div><p class="eyebrow">CONNECTION CHECK</p><h1>Could not load your records</h1><p>${safe(error.message)}</p></div><button class="btn primary" data-student-action="retry">Try again</button></div>`;
  }
}

function renderStudentOverview(data) {
  const s = data.student || {};
  const att = data.attendance || {};
  const fees = data.fees || {};
  const cls = s.classId && typeof s.classId === 'object' ? s.classId : {};
  const className = [cls.name, cls.section].filter(Boolean).join(' · ') || 'Unassigned';
  const teacher = cls.classTeacher && typeof cls.classTeacher === 'object' ? cls.classTeacher : null;
  const attColor = att.percentage >= 90 ? 'green' : att.percentage >= 75 ? 'blue' : 'amber';
  const feeColor = fees.status === 'Cleared' ? 'green' : fees.status === 'Partial' ? 'amber' : 'red';
  const recentResults = data.recentResults || [];
  const recentAttendance = att.recent || [];

  const profileRow = (label, value) => `<div class="profile-row"><span>${safe(label)}</span><strong>${safe(value || '—')}</strong></div>`;

  return `
    <div class="page-heading"><div><p class="eyebrow">STUDENT PORTAL</p><h1>Welcome, ${safe((s.firstName || 'Student').split(' ')[0])} <span aria-hidden="true">✦</span></h1><p>Here is a summary of your academic records.</p></div><div class="heading-actions"><button class="btn secondary" data-student-action="refresh">↻ Refresh</button></div></div>
    <div class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Attendance</span><span class="stat-icon ${attColor}">◷</span></div><div class="stat-value">${safe(att.percentage ?? 0)}%</div><div class="stat-foot">${safe(att.present || 0)} present of ${safe(att.total || 0)} days</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Fee balance</span><span class="stat-icon ${feeColor}">＄</span></div><div class="stat-value">${safe(money(fees.balance))}</div><div class="stat-foot">${safe(fees.status || '—')}</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Fees paid</span><span class="stat-icon green">✓</span></div><div class="stat-value">${safe(money(fees.totalPaid))}</div><div class="stat-foot">of ${safe(money(fees.totalDue))} due</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Recent results</span><span class="stat-icon purple">▥</span></div><div class="stat-value">${safe(recentResults.length)}</div><div class="stat-foot">latest recorded marks</div></article>
    </div>
    <div class="dashboard-grid">
      <section class="panel-card"><div class="panel-title-row"><h2>My profile</h2></div>${profileRow('Admission No.', s.admissionNo)}${profileRow('Class', className)}${profileRow('Gender', s.gender)}${profileRow('Date of birth', formatDate(s.dob))}${profileRow('Guardian', s.guardianName)}${profileRow('Guardian phone', s.guardianPhone)}${profileRow('Email', s.email)}${profileRow('Class teacher', fullName(teacher))}${profileRow('Status', s.status)}</section>
      <section class="panel-card"><div class="panel-title-row"><h2>Recent results</h2><button class="text-link" data-student-tab="reportcards">View report cards →</button></div>${recentResults.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>SUBJECT</th><th>EXAM</th><th>MARKS</th><th>GRADE</th></tr></thead><tbody>${recentResults.map(r => `<tr><td>${safe(r.subjectId?.name || '—')}</td><td>${safe(r.examId?.title || '—')}</td><td class="num-cell">${safe(r.percentage ?? 0)}%</td><td><span class="status-badge ${['D1','D2','D3','D4','D5','D6'].includes(r.grade) ? 'active' : r.grade === 'F9' ? 'absent' : 'other'}">${safe(r.grade || '—')}</span></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">No results recorded yet.</div>'}</section>
    </div>
    <section class="panel-card"><div class="panel-title-row"><h2>Recent attendance</h2><button class="text-link" data-student-tab="attendance">View all attendance →</button></div>${recentAttendance.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>DATE</th><th>STATUS</th><th>REMARKS</th></tr></thead><tbody>${recentAttendance.map(r => `<tr><td>${safe(formatDate(r.date))}</td><td><span class="status-badge ${statusClass(r.status)}">${safe(r.status)}</span></td><td>${safe(r.remarks || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">No attendance recorded yet.</div>'}</section>`;
}

function renderStudentAttendance(data) {
  const records = data.records || [];
  const sm = data.summary || {};
  const breakdown = [['Present', sm.present || 0, 'active'], ['Absent', sm.absent || 0, 'absent'], ['Late', sm.late || 0, 'other'], ['Excused', sm.excused || 0, 'other']];
  return `
    <div class="page-heading"><div><p class="eyebrow">MY ATTENDANCE</p><h1>Attendance history</h1><p>Your day-to-day attendance record.</p></div><div class="heading-actions"><button class="btn secondary" data-student-action="refresh">↻ Refresh</button></div></div>
    <div class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Attendance rate</span><span class="stat-icon blue">◷</span></div><div class="stat-value">${safe(sm.percentage ?? 0)}%</div><div class="stat-foot">Overall attendance rate</div></article>
      ${breakdown.map(([label, count, color]) => `<article class="stat-card"><div class="stat-top"><span class="stat-label">${safe(label)}</span><span class="stat-icon ${color}">●</span></div><div class="stat-value">${safe(count)}</div><div class="stat-foot">day${count === 1 ? '' : 's'} recorded</div></article>`).join('')}
    </div>
    <section class="panel-card"><div class="panel-title-row"><h2>Attendance records</h2><span class="muted" style="font-size:11px">${safe(records.length)} record${records.length === 1 ? '' : 's'}</span></div>${records.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>DATE</th><th>CLASS</th><th>STATUS</th><th>REMARKS</th></tr></thead><tbody>${records.map(r => `<tr><td>${safe(formatDate(r.date))}</td><td>${safe(r.classId ? [r.classId.name, r.classId.section].filter(Boolean).join(' · ') : '—')}</td><td><span class="status-badge ${statusClass(r.status)}">${safe(r.status)}</span></td><td>${safe(r.remarks || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">No attendance has been recorded for you yet.</div>'}</section>`;
}

function renderStudentReportCards(data) {
  const cards = data.cards || [];
  return `
    <div class="page-heading"><div><p class="eyebrow">MY REPORT CARDS</p><h1>Report cards</h1><p>View and print your exam report cards.</p></div><div class="heading-actions"><button class="btn secondary" data-student-action="refresh">↻ Refresh</button></div></div>
    <section class="panel-card"><div class="panel-title-row"><h2>Available report cards</h2><span class="muted" style="font-size:11px">${safe(cards.length)} exam${cards.length === 1 ? '' : 's'}</span></div>${cards.length ? `<div class="report-card-list">${cards.map(card => `<div class="report-card-item"><div class="report-card-info"><h3>${safe(card.title)}</h3><p class="muted">${safe(card.term || '—')} · ${safe(card.academicYear || '—')} · ${safe(card.subjectCount)} subject${card.subjectCount === 1 ? '' : 's'}</p><div class="report-card-grade"><span class="status-badge ${['D1','D2','D3','D4','D5','D6'].includes(card.aggregateGrade) ? 'active' : card.aggregateGrade === 'F9' ? 'absent' : 'other'}">Aggregate: ${safe(card.aggregateGrade)}</span></div></div><button class="btn primary" data-student-action="print-report-card" data-exam-id="${safe(card.examId)}">🖨 Print report card</button></div>`).join('')}</div>` : '<div class="empty-state">No report cards are available yet. Once your marks are entered, your report cards will appear here.</div>'}</section>`;
}

function renderStudentFees(data) {
  const fees = data.fees || [];
  const sm = data.summary || {};
  const feeColor = sm.status === 'Cleared' ? 'green' : sm.status === 'Partial' ? 'amber' : 'red';
  const fmtFee = fee => {
    const payments = fee.payments || [];
    return `<section class="panel-card fee-statement-card"><div class="panel-title-row"><h2>${safe(fee.term || '—')} — ${safe(fee.academicYear || '—')}</h2><span class="status-badge ${statusClass(fee.status)}">${safe(fee.status)}</span></div>
      <div class="fee-statement-grid">
        <div class="mini-metric"><span class="mini-metric-label"><i class="mini-dot"></i>Amount due</span><strong>${safe(money(fee.amountDue))}</strong></div>
        <div class="mini-metric"><span class="mini-metric-label"><i class="mini-dot green"></i>Amount paid</span><strong>${safe(money(fee.amountPaid))}</strong></div>
        <div class="mini-metric"><span class="mini-metric-label"><i class="mini-dot amber"></i>Balance</span><strong>${safe(money(fee.balance))}</strong></div>
      </div>
      <h3 class="fee-payments-title">Payment receipts</h3>
      ${payments.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>RECEIPT NO.</th><th>DATE</th><th>AMOUNT</th><th>METHOD</th><th>REFERENCE</th><th>ACTION</th></tr></thead><tbody>${payments.map(p => `<tr><td>${safe(p.receiptNo || '—')}</td><td>${safe(formatDate(p.date))}</td><td>${safe(money(p.amount))}</td><td>${safe(p.method)}</td><td>${safe(p.reference || '—')}</td><td><button type="button" class="action-btn" data-student-action="print-receipt" data-fee-id="${safe(fee._id)}" data-payment-id="${safe(p._id)}">🖨 Print receipt</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">No payments recorded for this term yet.</div>'}
    </section>`;
  };
  return `
    <div class="page-heading"><div><p class="eyebrow">MY FEES STATEMENT</p><h1>Fees statement</h1><p>Your fee balances and payment receipts.</p></div><div class="heading-actions"><button class="btn secondary" data-student-action="refresh">↻ Refresh</button></div></div>
    <div class="stats-grid">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Total due</span><span class="stat-icon blue">＄</span></div><div class="stat-value">${safe(money(sm.totalDue))}</div><div class="stat-foot">across all terms</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Total paid</span><span class="stat-icon green">✓</span></div><div class="stat-value">${safe(money(sm.totalPaid))}</div><div class="stat-foot">payments received</div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Outstanding balance</span><span class="stat-icon ${feeColor}">＄</span></div><div class="stat-value">${safe(money(sm.balance))}</div><div class="stat-foot">${safe(sm.status || '—')}</div></article>
    </div>
    ${fees.length ? fees.map(fmtFee).join('') : '<section class="panel-card"><div class="empty-state">No fee records are available for your account yet.</div></section>'}`;
}

async function printStudentReportCard(examId) {
  if (!examId) return showToast('Could not identify the exam for this report card.', 'error');
  try {
    const report = await api(`/api/me/report-card?examId=${encodeURIComponent(examId)}`);
    window.SchoolDocuments.printReportCard(report, report.teacherComment || '');
  } catch (error) {
    showToast(`Could not print report card: ${error.message}`, 'error');
  }
}

async function printStudentReceipt(feeId, paymentId) {
  if (!feeId || !paymentId) return showToast('Could not identify the payment receipt.', 'error');
  try {
    const data = await api(`/api/me/fees/${encodeURIComponent(feeId)}`);
    const payment = (data.payments || []).find(row => String(row._id) === String(paymentId));
    if (!payment) throw new Error('Payment not found in this fee record.');
    window.SchoolDocuments.printReceipt({
      payment,
      student: data.student,
      amountDue: data.amountDue,
      amountPaid: data.amountPaid,
      balance: data.balance
    });
  } catch (error) {
    showToast(`Could not print receipt: ${error.message}`, 'error');
  }
}

async function goToView(view) {
  if (view !== 'dashboard' && !resourceConfig[view]) return;
  currentView = view;
  $('#sidebar').classList.remove('open');
  $('#mobileScrim').classList.remove('show');
  await renderCurrentView();
}

$('#loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const button = $('button[type="submit"]', event.currentTarget);
  button.disabled = true;
  button.textContent = 'Signing in…';
  $('#loginError').textContent = '';
  try {
    const emailOrAdmission = form.get('emailOrAdmission');
    const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: emailOrAdmission, password: form.get('password') }) });
    if (result.role === 'STUDENT') showStudentApp(result.user);
    else showApp();
  } catch (error) { $('#loginError').textContent = error.message; }
  finally { button.disabled = false; button.innerHTML = 'Sign in <span aria-hidden="true">→</span>'; }
});
async function signOut() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
    currentRole = null;
    currentUser = null;
    showLogin();
  } catch (error) {
    showToast(`Could not sign out: ${error.message}`, 'error');
  }
}
['logoutBtn', 'logoutTopBtn', 'studentLogoutBtn', 'studentLogoutTopBtn']
  .forEach(id => $(`#${id}`).addEventListener('click', signOut));
$('#mainNav').addEventListener('click', event => {
  const item = event.target.closest('[data-view]');
  if (item) goToView(item.dataset.view);
});
/* ── Student Portal listeners ── */
$('#studentNav').addEventListener('click', event => {
  const item = event.target.closest('[data-student-tab]');
  if (item) goToStudentTab(item.dataset.studentTab);
});
$('#studentContent').addEventListener('click', async event => {
  const tabItem = event.target.closest('[data-student-tab]');
  if (tabItem) return goToStudentTab(tabItem.dataset.studentTab);
  const button = event.target.closest('[data-student-action]');
  if (!button) return;
  const action = button.dataset.studentAction;
  if (action === 'refresh' || action === 'retry') return goToStudentTab(currentStudentTab);
  if (action === 'print-report-card') return printStudentReportCard(button.dataset.examId);
  if (action === 'print-receipt') return printStudentReceipt(button.dataset.feeId, button.dataset.paymentId);
});
$('#studentMenuToggle').addEventListener('click', () => { $('#studentSidebar').classList.add('open'); $('#studentScrim').classList.add('show'); });
$('#closeStudentSidebar').addEventListener('click', () => { $('#studentSidebar').classList.remove('open'); $('#studentScrim').classList.remove('show'); });
$('#studentScrim').addEventListener('click', () => { $('#studentSidebar').classList.remove('open'); $('#studentScrim').classList.remove('show'); });
$('#pageContent').addEventListener('click', async event => {
  const viewItem = event.target.closest('[data-view]');
  if (viewItem) return goToView(viewItem.dataset.view);
  const openItem = event.target.closest('[data-open-resource]');
  if (openItem) {
    currentView = openItem.dataset.openResource;
    setActiveNav(currentView);
    try { currentRows = await api(`/api/${resourceApiPath(currentView)}`); cache[currentView] = currentRows; await openRecordForm(); }
    catch (error) { showToast(error.message, 'error'); }
    return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'add') return openRecordForm();
  if (button.dataset.action === 'edit') return openRecordForm(button.dataset.id);
  if (button.dataset.action === 'delete') return openDeleteDialog(button.dataset.id);
  if (button.dataset.action === 'payment') return openPaymentForm(button.dataset.id);
  if (button.dataset.action === 'history') return showPaymentHistory(button.dataset.id);
  if (button.dataset.action === 'marks-entry') return openBulkResultsForm();
  if (button.dataset.action === 'results-for-exam') {
    currentView = 'results';
    await renderCurrentView();
    return openBulkResultsForm(button.dataset.id);
  }
  if (button.dataset.action === 'report-card') return generateReportCard();
  if (button.dataset.action === 'save-report-comment') return saveReportComment();
  if (button.dataset.action === 'print-report-card') {
    if (currentReportCard) window.SchoolDocuments.printReportCard(currentReportCard, $('#reportTeacherComment')?.value || '');
    return;
  }
  if (button.dataset.action === 'print-receipt') return printPaymentReceipt(paymentHistoryFeeId, button.dataset.paymentId);
  if (button.dataset.action === 'outstanding-fees') return exportOutstandingFees();
  if (button.dataset.action === 'print-defaulters') return printDefaultersList();
  if (button.dataset.action === 'class-fee-status') return showClassFeeStatus();
  if (button.dataset.action === 'print-row-report-card') return printRowReportCard(button.dataset.id);
  if (button.dataset.action === 'download-marksheet') return downloadMarkSheet();
  if (button.dataset.action === 'print-timetable') return printTimetable();
  if (button.dataset.action === 'download-schedule') return downloadSchedule();
  if (button.dataset.action === 'print-attendance' || button.dataset.action === 'download-attendance') {
    return handleAttendanceExport(button.dataset.action);
  }
  if (button.dataset.action === 'refresh-dashboard' || button.dataset.action === 'refresh-resource' || button.dataset.action === 'retry') {
    delete cache[currentView];
    return renderCurrentView();
  }
});
$('#pageContent').addEventListener('input', event => { if (event.target.id === 'tableSearch') updateTableSearch(); });
$('#pageContent').addEventListener('change', event => {
  if (event.target.id === 'attendanceClassFilter' || event.target.id === 'attendanceDateFilter') updateTableSearch();
  if (event.target.id === 'examYearFilter' || event.target.id === 'examTermFilter') updateTableSearch();
});
$('#formFields').addEventListener('change', event => {
  if (event.target.id === 'marksClass') updateBulkResultOptions();
  if (['marksExam', 'marksSubject'].includes(event.target.id)) renderMarksRoster();
  if (event.target.name === 'studentId' && currentView === 'fees') {
    const student = (cache.students || []).find(item => String(item._id) === event.target.value);
    const classLevel = student?.classId?.name || '';
    const structureSelect = $('select[name="feeStructureId"]', $('#recordForm'));
    if (structureSelect) {
      const matching = (cache.feeStructures || []).find(item => item.classLevel.toLowerCase() === classLevel.toLowerCase());
      if (matching) {
        structureSelect.value = matching._id;
        structureSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
  if (event.target.name === 'feeStructureId') {
    const structure = (cache.feeStructures || []).find(item => String(item._id) === event.target.value);
    if (structure) {
      $('input[name="amountDue"]', $('#recordForm')).value = structure.amountDue;
      $('input[name="academicYear"]', $('#recordForm')).value = structure.academicYear;
      $('select[name="term"]', $('#recordForm')).value = structure.term;
    }
  }
});
$('#recordForm').addEventListener('change', event => {
  if (currentView !== 'attendance') return;
  if (event.target.name === 'classId') {
    if (editingId) updateAttendanceStudentOptions();
    else renderBulkAttendanceRoster();
    return;
  }
  if (event.target.name === 'studentId') {
    const student = (cache.students || []).find(item => String(item._id) === event.target.value);
    const classSelect = $('select[name="classId"]', $('#recordForm'));
    if (classSelect) classSelect.value = String(relationId(student?.classId) || '');
    updateAttendanceStudentOptions(event.target.value);
  }
});
$('#recordForm').addEventListener('submit', handleSaveRecord);
$('#modalClose').addEventListener('click', closeRecordForm);
$('#cancelForm').addEventListener('click', closeRecordForm);
$('#modalLayer').addEventListener('click', event => { if (event.target === $('#modalLayer')) closeRecordForm(); });
$('#cancelDelete').addEventListener('click', closeDeleteDialog);
$('#confirmDelete').addEventListener('click', deleteRecord);
$('#confirmLayer').addEventListener('click', event => { if (event.target === $('#confirmLayer')) closeDeleteDialog(); });
$('#menuToggle').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#mobileScrim').classList.add('show'); });
$('#closeSidebar').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('#mobileScrim').classList.remove('show'); });
$('#mobileScrim').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('#mobileScrim').classList.remove('show'); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeRecordForm(); closeDeleteDialog(); $('#sidebar').classList.remove('open'); $('#mobileScrim').classList.remove('show'); $('#studentSidebar').classList.remove('open'); $('#studentScrim').classList.remove('show'); }
});

(async function init() {
  try {
    const state = await api('/api/auth/me');
    if (state.authenticated) {
      currentRole = state.role;
      currentUser = state.user;
      if (state.role === 'STUDENT') showStudentApp(state.user);
      else showApp();
    } else showLogin();
  } catch (error) {
    showLogin();
    $('#loginError').textContent = `Could not check the sign-in status: ${error.message}`;
  }
})();
