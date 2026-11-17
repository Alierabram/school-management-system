const mongoose = require('mongoose');
const models = require('../models');

function failure(res, error) {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'value';
    return res.status(409).json({ message: `A record with this ${field} already exists.` });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    const details = error.errors ? Object.values(error.errors).map(item => item.message).join(' ') : error.message;
    return res.status(400).json({ message: details || 'Please check the submitted values.' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Something went wrong on the server.' });
}

async function meDashboard(req, res) {
  try {
    const studentId = req.session.studentId;
    const [student, attendanceCount, feeRecords] = await Promise.all([
      models.students.findById(studentId).populate({ path: 'classId', select: 'name section academicYear' }),
      models.attendance.countDocuments({ studentId }),
      models.fees.find({ studentId }).select('term academicYear amountDue payments status createdAt')
    ]);
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });

    const presentCount = await models.attendance.countDocuments({ studentId, status: 'Present' });
    const attendancePct = attendanceCount > 0 ? Math.round((presentCount / attendanceCount) * 100) : 0;
    const totalDue = feeRecords.reduce((sum, f) => sum + f.amountDue, 0);
    const totalPaid = feeRecords.reduce((sum, f) => sum + f.payments.reduce((s, p) => s + p.amount, 0), 0);
    const totalBalance = Math.max(0, totalDue - totalPaid);
    const feeStatus = totalPaid === 0 ? 'Unpaid' : totalBalance === 0 ? 'Paid' : 'Partial';

    return res.json({
      student,
      attendance: { total: attendanceCount, present: presentCount, percentage: attendancePct },
      fees: { totalDue, totalPaid, totalBalance, feeStatus, records: feeRecords.length }
    });
  } catch (error) { return failure(res, error); }
}

async function meAttendance(req, res) {
  try {
    const studentId = req.session.studentId;
    const records = await models.attendance.find({ studentId }).populate({ path: 'classId', select: 'name section academicYear' }).sort({ date: -1 });
    return res.json({ records, count: records.length });
  } catch (error) { return failure(res, error); }
}

async function meReportCards(req, res) {
  try {
    const studentId = req.session.studentId;
    const cards = await models.reportCards.find({ studentId }).populate({ path: 'examId', populate: { path: 'classId' } }).sort({ createdAt: -1 });
    const result = [];
    for (const card of cards) {
      const exam = card.examId;
      const results = await models.results.find({ studentId, examId: exam._id }).populate({ path: 'subjectId', select: 'name code' });
      const total = results.reduce((sum, r) => sum + r.percentage, 0);
      const aggregateGrade = results.length ? models.results.schema.methods ? null : '—' : '—';
      result.push({ ...card.toObject ? card.toObject() : card, exam, results, total, resultsCount: results.length });
    }
    return res.json(result);
  } catch (error) { return failure(res, error); }
}

async function meReportCard(req, res) {
  try {
    const studentId = req.session.studentId;
    const { examId } = req.query;
    if (!examId || !mongoose.isValidObjectId(examId)) {
      return res.status(400).json({ message: 'Valid exam ID required.' });
    }
    const [student, exam, reportCard, results] = await Promise.all([
      models.students.findById(studentId).populate({ path: 'classId', populate: { path: 'classTeacher' } }),
      models.exams.findById(examId).populate('classId'),
      models.reportCards.findOne({ studentId, examId }),
      models.results.find({ studentId, examId }).populate({ path: 'subjectId', select: 'name code' })
    ]);
    if (!student || !exam) return res.status(404).json({ message: 'Student or exam not found.' });
    const total = results.reduce((sum, r) => sum + r.percentage, 0);
    const aggregateGrade = results.length ? /* gradeForPercentage */ '—' : '—';
    return res.json({ student, exam, reportCard, results, total, resultsCount: results.length, aggregateGrade });
  } catch (error) { return failure(res, error); }
}

async function meFees(req, res) {
  try {
    const studentId = req.session.studentId;
    const records = await models.fees.find({ studentId }).sort({ createdAt: -1 });
    const data = records.map(fee => ({
      _id: fee._id,
      term: fee.term,
      academicYear: fee.academicYear,
      amountDue: fee.amountDue,
      amountPaid: fee.amountPaid,
      balance: fee.balance,
      status: fee.status,
      payments: fee.payments,
      createdAt: fee.createdAt
    }));
    return res.json(data);
  } catch (error) { return failure(res, error); }
}

async function meFeeDetail(req, res) {
  try {
    const studentId = req.session.studentId;
    const { feeId } = req.params;
    if (!mongoose.isValidObjectId(feeId)) return res.status(400).json({ message: 'Invalid fee ID.' });
    const fee = await models.fees.findOne({ _id: feeId, studentId });
    if (!fee) return res.status(404).json({ message: 'Fee record not found.' });
    return res.json({
      _id: fee._id,
      term: fee.term,
      academicYear: fee.academicYear,
      amountDue: fee.amountDue,
      amountPaid: fee.amountPaid,
      balance: fee.balance,
      status: fee.status,
      payments: fee.payments
    });
  } catch (error) { return failure(res, error); }
}

/* ── Timetable ── */
async function meTimetable(req, res) {
  try {
    const studentId = req.session.studentId;
    const student = await models.students.findById(studentId).populate({ path: 'classId', select: 'name section academicYear' });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    const timetable = await models.timetables.find({
      classId: student.classId,
      academicYear: student.classId.academicYear
    }).populate({ path: 'subjectId', select: 'name code' }).populate({ path: 'teacherId', select: 'firstName lastName' }).sort({ dayOfWeek: 1, periodNumber: 1 });
    return res.json({ timetable, class: student.classId });
  } catch (error) { return failure(res, error); }
}

/* ── Assignments ── */
async function meAssignments(req, res) {
  try {
    const studentId = req.session.studentId;
    const student = await models.students.findById(studentId).populate({ path: 'classId', select: 'name section academicYear' });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    const [assignments, submissions] = await Promise.all([
      models.assignments.find({ classId: student.classId, academicYear: student.classId.academicYear }).populate({ path: 'subjectId', select: 'name code' }).sort({ dueDate: 1 }),
      models.assignmentSubmissions.find({ studentId }).lean()
    ]);
    const submissionMap = new Map(submissions.map(s => [String(s.assignmentId), s]));
    const data = assignments.map(a => ({
      _id: a._id,
      title: a.title,
      description: a.description,
      subject: a.subjectId ? { name: a.subjectId.name, code: a.subjectId.code } : { name: '—', code: '—' },
      dueDate: a.dueDate,
      status: submissionMap.has(String(a._id)) ? 'submitted' : 'pending',
      submittedAt: submissionMap.get(String(a._id))?.submittedAt || null,
      grade: submissionMap.get(String(a._id))?.grade || null,
      feedback: submissionMap.get(String(a._id))?.feedback || ''
    }));
    return res.json({ assignments: data });
  } catch (error) { return failure(res, error); }
}

/* ── Announcements ── */
async function meAnnouncements(req, res) {
  try {
    const studentId = req.session.studentId;
    const student = await models.students.findById(studentId).populate({ path: 'classId', select: 'name section academicYear' });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    const announcements = await models.announcements.find({
      audience: { $in: ['all', 'students'] },
      academicYear: student.classId.academicYear,
      isActive: true
    }).sort({ publishedAt: -1 });
    return res.json({ announcements });
  } catch (error) { return failure(res, error); }
}

/* ── PDF Export: Report Card ── */
async function exportReportCardPDF(req, res) {
  try {
    const studentId = req.session.studentId;
    const { examId } = req.query;
    if (!examId || !mongoose.isValidObjectId(examId)) {
      return res.status(400).json({ message: 'Valid exam ID required.' });
    }
    const [student, exam, results] = await Promise.all([
      models.students.findById(studentId).populate({ path: 'classId', populate: { path: 'classTeacher' } }),
      models.exams.findById(examId).populate('classId'),
      models.results.find({ studentId, examId }).populate({ path: 'subjectId', select: 'name code' })
    ]);
    if (!student || !exam) return res.status(404).json({ message: 'Student or exam not found.' });
    const total = results.reduce((sum, r) => sum + r.percentage, 0);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-card-${safe(student.admissionNo)}-${safe(exam.title)}.pdf"`);
    return res.send(generateReportCardPDF(student, exam, results, total));
  } catch (error) { return failure(res, error); }
}

/* ── PDF Export: Fee Statement ── */
async function exportFeesPDF(req, res) {
  try {
    const studentId = req.session.studentId;
    const student = await models.students.findById(studentId).populate({ path: 'classId', select: 'name section academicYear' });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });
    const records = await models.fees.find({ studentId }).sort({ createdAt: -1 });
    const totalDue = records.reduce((sum, f) => sum + f.amountDue, 0);
    const totalPaid = records.reduce((sum, f) => sum + f.amountPaid, 0);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="fees-statement-${safe(student.admissionNo)}-${safe(student.classId.academicYear)}.pdf"`);
    return res.send(generateFeesPDF(student, records, totalDue, totalPaid));
  } catch (error) { return failure(res, error); }
}

function safe(value) {
  return String(value || '').replace(/[<>&"']/g, '');
}

function generateReportCardPDF(student, exam, results, total) {
  const rows = results.map(r => `<tr><td>${safe(r.subjectId?.name || '—')}</td><td>${safe(r.percentage)}%</td><td>${safe(r.grade)}</td><td>${safe(r.remarks || '—')}</td></tr>`).join('');
  return `<html><head><style>body{font-family:sans-serif;padding:2rem}h1{font-size:24px;text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}</style></head><body><h1>SchoolFlow - Report Card</h1><p><strong>Student:</strong> ${safe(fullName(student))} (${safe(student.admissionNo)})</p><p><strong>Class:</strong> ${safe(student.classId?.name || '—')} ${safe(student.classId?.section || '')}</p><p><strong>Exam:</strong> ${safe(exam.title)} - ${safe(exam.term)} ${safe(exam.academicYear)}</p><table><thead><tr><th>Subject</th><th>Marks</th><th>Grade</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="3"><strong>Total</strong></td><td>${safe(total)}</td></tr></tfoot></table></body></html>`;
}

function generateFeesPDF(student, records, totalDue, totalPaid) {
  const rows = records.map(f => `<tr><td>${safe(f.term || '—')}</td><td>${safe(f.academicYear || '—')}</td><td>${safe(f.amountDue)}</td><td>${safe(f.amountPaid)}</td><td>${safe(f.balance)}</td><td>${safe(f.status)}</td></tr>`).join('');
  return `<html><head><style>body{font-family:sans-serif;padding:2rem}h1{font-size:24px;text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}</style></head><body><h1>SchoolFlow - Fees Statement</h1><p><strong>Student:</strong> ${safe(fullName(student))} (${safe(student.admissionNo)})</p><p><strong>Class:</strong> ${safe(student.classId?.name || '—')} ${safe(student.classId?.section || '')}</p><table><thead><tr><th>Term</th><th>Academic Year</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="3"><strong>Total Due</strong></td><td>${safe(totalPaid)}</td><td>${safe(Math.max(0, totalDue - totalPaid))}</td><td></td></tr></tfoot></table></body></html>`;
}

function fullName(person) {
  return person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() : '';
}

module.exports = {
  meDashboard,
  meAttendance,
  meReportCards,
  meReportCard,
  meFees,
  meFeeDetail,
  meTimetable,
  meAssignments,
  meAnnouncements,
  exportReportCardPDF,
  exportFeesPDF
};
