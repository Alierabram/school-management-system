const mongoose = require('mongoose');
const models = require('../models');

const populateFields = {
  students: [{ path: 'classId', select: 'name section academicYear' }], classes: ['classTeacher'], subjects: ['classId', 'teacherId'],
  attendance: ['studentId', 'classId'], exams: ['classId'], results: ['studentId', 'examId', 'subjectId'],
  fees: ['studentId'], reportCards: ['studentId', 'examId']
};
const references = {
  students: { classId: 'classes' }, classes: { classTeacher: 'teachers' },
  subjects: { classId: 'classes', teacherId: 'teachers' },
  attendance: { studentId: 'students', classId: 'classes' },
  exams: { classId: 'classes' }, results: { studentId: 'students', examId: 'exams', subjectId: 'subjects' },
  reportCards: { studentId: 'students', examId: 'exams' },
  fees: { studentId: 'students' }
};
const dependents = {
  students: [['attendance', 'studentId'], ['results', 'studentId'], ['fees', 'studentId']],
  teachers: [['classes', 'classTeacher'], ['subjects', 'teacherId']],
  classes: [['students', 'classId'], ['subjects', 'classId'], ['attendance', 'classId'], ['exams', 'classId']],
  subjects: [['results', 'subjectId']],
  exams: [['results', 'examId'], ['reportCards', 'examId']]
};

function failure(res, error) {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'value';
    return res.status(409).json({ message: `A record with this ${field} already exists.` });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    const details = error.errors ? Object.values(error.errors).map(item => item.message).join(' ') : error.message;
    return res.status(400).json({ message: details || 'Please check the submitted values.' });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'MongoDB is not connected. Check the MongoDB service and try again.' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Something went wrong on the server.' });
}

function cleanPayload(Model, input, resource) {
  const output = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (key.startsWith('$') || key.includes('.') || ['_id', '__v', 'createdAt', 'updatedAt', 'payments', 'amountPaid', 'balance', 'percentage'].includes(key)) continue;
    if (resource === 'fees' && key === 'status' || resource === 'results' && key === 'grade') continue;
    const path = Model.schema.path(key);
    if (!path) continue;
    if (value === '' && path.instance === 'ObjectId') output[key] = null;
    else if (value === '' && path.instance === 'Date') output[key] = null;
    else if (value !== '') output[key] = value;
  }
  return output;
}

async function validateReferences(resource, payload, existing = null) {
  const values = { ...(existing ? existing.toObject() : {}), ...payload };
  for (const [field, target] of Object.entries(references[resource] || {})) {
    const id = values[field];
    if (!id) continue;
    if (!mongoose.isValidObjectId(id) || !(await models[target].exists({ _id: id }))) {
      const error = new mongoose.Error.ValidationError();
      error.addError(field, new mongoose.Error.ValidatorError({ path: field, message: `${field} must reference an existing record.` }));
      throw error;
    }
  }
  if (resource === 'attendance' && values.studentId && values.classId) {
    const student = await models.students.findById(values.studentId).select('classId');
    if (student.classId && String(student.classId) !== String(values.classId)) {
      const error = new mongoose.Error.ValidationError();
      error.addError('classId', new mongoose.Error.ValidatorError({ path: 'classId', message: 'The selected student is not assigned to this class.' }));
      throw error;
    }
  }
  if (resource === 'results' && values.examId && values.subjectId && values.studentId) {
    const [student, exam, subject] = await Promise.all([
      models.students.findById(values.studentId).select('classId'),
      models.exams.findById(values.examId).select('classId'),
      models.subjects.findById(values.subjectId).select('classId')
    ]);
    if (String(exam.classId) !== String(subject.classId) || (student.classId && String(student.classId) !== String(exam.classId))) {
      const error = new mongoose.Error.ValidationError();
      error.addError('subjectId', new mongoose.Error.ValidatorError({ path: 'subjectId', message: 'The result student, examination and subject must belong to the same class.' }));
      throw error;
    }
  }
}

function populate(query, resource) {
  for (const field of populateFields[resource] || []) query.populate(field);
  return query;
}

exports.bulkAttendance = async (req, res) => {
  const { classId, date, records } = req.body || {};
  if (!mongoose.isValidObjectId(classId)) return res.status(400).json({ message: 'Select a valid class.' });
  const attendanceDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00.000Z`) : null;
  if (!attendanceDate || Number.isNaN(attendanceDate.getTime()) || attendanceDate.toISOString().slice(0, 10) !== date) {
    return res.status(400).json({ message: 'Enter a valid attendance date.' });
  }
  if (!Array.isArray(records) || records.length === 0 || records.length > 500) {
    return res.status(400).json({ message: 'Include between 1 and 500 student attendance records.' });
  }
  const statuses = ['Present', 'Absent', 'Late', 'Excused'];
  const studentIds = [];
  for (const record of records) {
    if (!record || !mongoose.isValidObjectId(record.studentId)) return res.status(400).json({ message: 'Each attendance record must include a valid student.' });
    if (!statuses.includes(record.status)) return res.status(400).json({ message: 'Attendance status must be Present, Absent, Late or Excused.' });
    if (record.remarks !== undefined && (typeof record.remarks !== 'string' || record.remarks.length > 500)) {
      return res.status(400).json({ message: 'Remarks must be text no longer than 500 characters.' });
    }
    studentIds.push(String(record.studentId));
  }
  if (new Set(studentIds).size !== studentIds.length) return res.status(400).json({ message: 'A student can only appear once in a bulk attendance submission.' });

  try {
    if (!(await models.classes.exists({ _id: classId }))) return res.status(404).json({ message: 'Class not found.' });
    const enrolled = await models.students.find({ _id: { $in: studentIds }, classId }).select('_id');
    if (enrolled.length !== studentIds.length) {
      return res.status(400).json({ message: 'Every student in the submission must be enrolled in the selected class.' });
    }
    const operations = records.map(record => ({
      updateOne: {
        filter: { studentId: record.studentId, date: attendanceDate },
        update: {
          $set: { classId, status: record.status, remarks: record.remarks || '' },
          $setOnInsert: { studentId: record.studentId, date: attendanceDate }
        },
        upsert: true
      }
    }));
    const result = await models.attendance.bulkWrite(operations, { ordered: true });
    const savedRecords = await populate(
      models.attendance.find({ classId, date: attendanceDate, studentId: { $in: studentIds } }).sort({ createdAt: -1 }),
      'attendance'
    );
    return res.json({
      message: 'Bulk attendance saved successfully.',
      createdCount: result.upsertedCount,
      updatedCount: result.modifiedCount,
      records: savedRecords
    });
  } catch (error) { return failure(res, error); }
};

exports.list = async (req, res) => {
  const { resource } = req.params;
  try {
    const filter = {};
    if (resource === 'attendance' && req.query.classId) {
      if (!mongoose.isValidObjectId(req.query.classId)) return res.status(400).json({ message: 'Invalid class ID filter.' });
      filter.classId = req.query.classId;
    }
    if (resource === 'exams') {
      if (req.query.academicYear) filter.academicYear = String(req.query.academicYear);
      if (req.query.term) filter.term = String(req.query.term);
    }
    const records = await populate(models[resource].find(filter).sort({ createdAt: -1 }), resource);
    return res.json(records);
  } catch (error) { return failure(res, error); }
};

exports.get = async (req, res) => {
  const { resource, id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid record ID.' });
  try {
    const record = await populate(models[resource].findById(id), resource);
    return record ? res.json(record) : res.status(404).json({ message: 'Record not found.' });
  } catch (error) { return failure(res, error); }
};

exports.create = async (req, res) => {
  const { resource } = req.params;
  try {
    const payload = cleanPayload(models[resource], req.body, resource);
    await validateReferences(resource, payload);
    const record = new models[resource](payload);
    if (resource === 'fees' && Number(req.body?.amountPaid) > 0) {
      record.payments.push({
        amount: Number(req.body.amountPaid),
        date: req.body.paymentDate || new Date(),
        paymentMethod: req.body.paymentMethod || 'Cash',
        reference: req.body.reference || ''
      });
    }
    await record.save();
    const result = await populate(models[resource].findById(record._id), resource);
    return res.status(201).json(result);
  } catch (error) { return failure(res, error); }
};

exports.update = async (req, res) => {
  const { resource, id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid record ID.' });
  try {
    const record = await models[resource].findById(id);
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    const payload = cleanPayload(models[resource], req.body, resource);
    await validateReferences(resource, payload, record);
    record.set(payload);
    await record.save();
    const result = await populate(models[resource].findById(record._id), resource);
    return res.json(result);
  } catch (error) { return failure(res, error); }
};

exports.remove = async (req, res) => {
  const { resource, id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid record ID.' });
  try {
    for (const [target, field] of dependents[resource] || []) {
      if (await models[target].exists({ [field]: id })) {
        return res.status(409).json({ message: `This record is still used by ${target}. Remove those related records first.` });
      }
    }
    const result = await models[resource].findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: 'Record not found.' });
    return res.json({ message: 'Record deleted successfully.' });
  } catch (error) { return failure(res, error); }
};

exports.paymentHistory = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid fee record ID.' });
  try {
    const fee = await models.fees.findById(req.params.id).populate('studentId');
    if (!fee) return res.status(404).json({ message: 'Fee record not found.' });
    return res.json({ payments: fee.payments, student: fee.studentId, term: fee.term, academicYear: fee.academicYear, amountDue: fee.amountDue, amountPaid: fee.amountPaid, balance: fee.balance, status: fee.status });
  } catch (error) { return failure(res, error); }
};

exports.addPayment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid fee record ID.' });
  try {
    const fee = await models.fees.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found.' });
    fee.payments.push({
      receiptNo: req.body?.receiptNo,
      amount: req.body?.amount,
      date: req.body?.date,
      paymentMethod: req.body?.paymentMethod || 'Cash',
      reference: req.body?.reference || ''
    });
    await fee.save();
    const payment = fee.payments[fee.payments.length - 1];
    return res.status(201).json({ payment, payments: fee.payments, amountDue: fee.amountDue, amountPaid: fee.amountPaid, balance: fee.balance, status: fee.status });
  } catch (error) { return failure(res, error); }
};

const gradeForPercentage = percentage => percentage >= 80 ? 'D1' : percentage >= 75 ? 'D2' : percentage >= 70 ? 'C3' : percentage >= 65 ? 'C4' : percentage >= 60 ? 'C5' : percentage >= 55 ? 'C6' : percentage >= 50 ? 'P7' : percentage >= 45 ? 'P8' : 'F9';
const remarkForGrade = grade => ({ D1: 'Distinction', D2: 'Distinction', C3: 'Credit', C4: 'Credit', C5: 'Credit', C6: 'Credit', P7: 'Pass', P8: 'Pass', F9: 'Fail' })[grade];

exports.bulkResults = async (req, res) => {
  const { classId, examId, subjectId, records } = req.body || {};
  if (![classId, examId, subjectId].every(mongoose.isValidObjectId)) {
    return res.status(400).json({ message: 'Select a valid class, exam and subject.' });
  }
  if (!Array.isArray(records) || records.length === 0 || records.length > 500) {
    return res.status(400).json({ message: 'Include between 1 and 500 student marks.' });
  }
  const studentIds = [];
  for (const record of records) {
    if (!record || !mongoose.isValidObjectId(record.studentId)) return res.status(400).json({ message: 'Each mark must include a valid student.' });
    if (typeof record.marksObtained !== 'number' || !Number.isFinite(record.marksObtained) || record.marksObtained < 0 || record.marksObtained > 100) {
      return res.status(400).json({ message: 'Marks must be a number from 0 to 100.' });
    }
    studentIds.push(String(record.studentId));
  }
  if (new Set(studentIds).size !== studentIds.length) return res.status(400).json({ message: 'A student can only appear once in a marks submission.' });

  try {
    const [schoolClass, exam, subject, students] = await Promise.all([
      models.classes.findById(classId),
      models.exams.findById(examId),
      models.subjects.findById(subjectId),
      models.students.find({ _id: { $in: studentIds }, classId }).select('_id')
    ]);
    if (!schoolClass || !exam || !subject) return res.status(404).json({ message: 'The selected class, exam or subject could not be found.' });
    if (String(exam.classId) !== String(classId) || String(subject.classId) !== String(classId)) {
      return res.status(400).json({ message: 'The selected exam and subject must belong to the selected class.' });
    }
    if (students.length !== studentIds.length) return res.status(400).json({ message: 'Every student must be enrolled in the selected class.' });

    await models.results.bulkWrite(records.map(record => {
      const grade = gradeForPercentage(record.marksObtained);
      return {
        updateOne: {
          filter: { studentId: record.studentId, examId, subjectId },
          update: { $set: { examId, subjectId, studentId: record.studentId, marksObtained: record.marksObtained, maxMarks: 100, grade, remarks: remarkForGrade(grade) } },
          upsert: true
        }
      };
    }), { ordered: true });
    const saved = await populate(models.results.find({ examId, subjectId, studentId: { $in: studentIds } }).sort({ createdAt: 1 }), 'results');
    return res.json({ message: 'Marks saved successfully.', records: saved });
  } catch (error) { return failure(res, error); }
};

exports.reportCard = async (req, res) => {
  const { studentId, examId } = req.query;
  if (![studentId, examId].every(mongoose.isValidObjectId)) return res.status(400).json({ message: 'Select a valid student and exam.' });
  try {
    const [student, exam, results, comment] = await Promise.all([
      models.students.findById(studentId).populate({ path: 'classId', populate: { path: 'classTeacher' } }),
      models.exams.findById(examId).populate('classId'),
      populate(models.results.find({ studentId, examId }).sort({ createdAt: 1 }), 'results'),
      models.reportCards.findOne({ studentId, examId })
    ]);
    if (!student || !exam) return res.status(404).json({ message: 'The selected student or exam could not be found.' });
    if (String(student.classId?._id || student.classId) !== String(exam.classId?._id || exam.classId)) {
      return res.status(400).json({ message: 'The student and exam must belong to the same class.' });
    }
    const total = results.reduce((sum, result) => sum + result.percentage, 0);
    const aggregateGrade = results.length ? gradeForPercentage(total / results.length) : '—';
    return res.json({
      student, exam, class: student.classId, results, total, aggregateGrade,
      teacherComment: comment?.teacherComment || ''
    });
  } catch (error) { return failure(res, error); }
};

exports.saveReportComment = async (req, res) => {
  const { studentId, examId, teacherComment } = req.body || {};
  if (![studentId, examId].every(mongoose.isValidObjectId)) return res.status(400).json({ message: 'Select a valid student and exam.' });
  if (typeof teacherComment !== 'string' || teacherComment.length > 2000) return res.status(400).json({ message: 'Teacher comments must be text no longer than 2000 characters.' });
  try {
    const [student, exam] = await Promise.all([models.students.findById(studentId), models.exams.findById(examId)]);
    if (!student || !exam) return res.status(404).json({ message: 'The selected student or exam could not be found.' });
    if (String(student.classId || '') !== String(exam.classId)) return res.status(400).json({ message: 'The student and exam must belong to the same class.' });
    const reportCard = await models.reportCards.findOneAndUpdate(
      { studentId, examId },
      { $set: { teacherComment: teacherComment.trim() } },
      { new: true, upsert: true, runValidators: true }
    );
    return res.json(reportCard);
  } catch (error) { return failure(res, error); }
};

exports.outstandingFees = async (req, res) => {
  try {
    const fees = await models.fees.find().populate({
      path: 'studentId',
      populate: { path: 'classId', select: 'name section academicYear' }
    });
    const outstanding = fees.filter(fee => fee.balance > 0).map(fee => ({
      student: fee.studentId,
      className: fee.studentId?.classId ? [fee.studentId.classId.name, fee.studentId.classId.section].filter(Boolean).join(' · ') : 'Unassigned',
      term: fee.term,
      academicYear: fee.academicYear,
      amountDue: fee.amountDue,
      amountPaid: fee.amountPaid,
      balance: fee.balance,
      status: fee.status
    }));
    return res.json(outstanding);
  } catch (error) { return failure(res, error); }
};

exports.classStudentsFeeStatus = async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ message: 'Select a class.' });
    if (!mongoose.isValidObjectId(classId)) return res.status(400).json({ message: 'Invalid class ID.' });

    const classExists = await models.classes.exists({ _id: classId });
    if (!classExists) return res.status(404).json({ message: 'Class not found.' });

    const students = await models.students.find({ classId }).select('admissionNo firstName lastName gender dob address guardianName guardianPhone email status');
    const fees = await models.fees.find({ studentId: { $in: students.map(s => s._id) } }).select('studentId amountDue payments status');

    const studentMap = new Map(students.map(s => [String(s._id), s]));
    const feeMap = new Map(fees.map(f => [String(f.studentId), f]));

    const data = students.map(student => {
      const fee = feeMap.get(student._id) || { amountDue: 0, amountPaid: 0, status: 'Unpaid' };
      const totalPaid = (fee.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, fee.amountDue - totalPaid);
      let paymentStatus = 'Unpaid';
      if (fee.status) paymentStatus = fee.status;
      else if (balance === 0) paymentStatus = 'Paid';
      else paymentStatus = 'Partial';

      return {
        admissionNo: student.admissionNo,
        name: student.firstName + ' ' + student.lastName,
        className: [student.classId?.name, student.classId?.section].filter(Boolean).join(' · ') || 'Unassigned',
        gender: student.gender || '',
        paymentStatus,
        amountDue: fee.amountDue,
        amountPaid: totalPaid,
        balance
      };
    });

    return res.json(data);
  } catch (error) { return failure(res, error); }
};

exports.applyFeeStructure = async (req, res, next) => {
  if (req.params.resource !== 'fees' || !req.body?.feeStructureId) return next();
  if (!mongoose.isValidObjectId(req.body.feeStructureId)) return res.status(400).json({ message: 'Select a valid fee structure.' });
  try {
    const [feeStructure, student] = await Promise.all([
      models.feeStructures.findById(req.body.feeStructureId),
      models.students.findById(req.body.studentId).populate('classId')
    ]);
    if (!feeStructure || !student) return res.status(404).json({ message: 'The selected fee structure or student could not be found.' });
    const className = String(student.classId?.name || '').toUpperCase().replace(/\s+/g, '');
    const structureLevel = feeStructure.classLevel.toUpperCase().replace(/\s+/g, '');
    const range = structureLevel.match(/^([A-Z]+)(\d+)-([A-Z]+)?(\d+)$/);
    const studentLevel = className.match(/^([A-Z]+)(\d+)$/);
    const matchesRange = range && studentLevel && range[1] === studentLevel[1] && (!range[3] || range[3] === range[1])
      && Number(studentLevel[2]) >= Number(range[2]) && Number(studentLevel[2]) <= Number(range[4]);
    if (structureLevel !== className && !matchesRange) {
      return res.status(400).json({ message: 'This fee structure does not apply to the selected student’s class.' });
    }
    req.body.amountDue = feeStructure.amountDue;
    req.body.term = feeStructure.term;
    req.body.academicYear = feeStructure.academicYear;
    return next();
  } catch (error) { return failure(res, error); }
};

exports.dashboard = async (req, res) => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);
    const [students, teachers, classes, subjects, attendance, exams, results, feeRows, recentStudents, recentExams, attendanceToday] = await Promise.all([
      models.students.countDocuments(), models.teachers.countDocuments(), models.classes.countDocuments(),
      models.subjects.countDocuments(), models.attendance.countDocuments(), models.exams.countDocuments(),
      models.results.countDocuments(),
      models.fees.find().select('amountDue payments'),
      models.students.find().sort({ createdAt: -1 }).limit(5).populate({ path: 'classId', select: 'name section academicYear' }),
      models.exams.find().sort({ startDate: 1, createdAt: -1 }).limit(5).populate('classId'),
      models.attendance.aggregate([
        { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);
    const due = feeRows.reduce((total, fee) => total + fee.amountDue, 0);
    const paid = feeRows.reduce((total, fee) => total + fee.payments.reduce((sum, payment) => sum + payment.amount, 0), 0);
    return res.json({
      totals: { students, teachers, classes, subjects, attendance, exams, results },
      fees: { due, paid, balance: Math.max(0, due - paid) },
      attendanceToday: Object.fromEntries(attendanceToday.map(row => [row._id, row.count])),
      recentStudents, recentExams
    });
  } catch (error) { return failure(res, error); }
};
