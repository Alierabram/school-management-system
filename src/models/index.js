const mongoose = require('mongoose');
const { Schema } = mongoose;

const genderOptions = ['Female', 'Male', 'Other'];
const termOptions = ['Term 1', 'Term 2', 'Term 3'];
const paymentOptions = ['Cash', 'Mobile Money (MTN / Airtel)', 'Bank Deposit', 'Bank Check'];
const gradeForPercentage = percentage => percentage >= 80 ? 'D1' : percentage >= 75 ? 'D2' : percentage >= 70 ? 'C3' : percentage >= 65 ? 'C4' : percentage >= 60 ? 'C5' : percentage >= 55 ? 'C6' : percentage >= 50 ? 'P7' : percentage >= 45 ? 'P8' : 'F9';
const remarkForGrade = grade => ({ D1: 'Distinction', D2: 'Distinction', C3: 'Credit', C4: 'Credit', C5: 'Credit', C6: 'Credit', P7: 'Pass', P8: 'Pass', F9: 'Fail' })[grade];

/* User accounts. The collection is named "admins" for backward compatibility but
   holds both ADMIN and STUDENT accounts, distinguished by the `role` field. */
const adminSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'STUDENT', 'TEACHER'], default: 'ADMIN', required: true },
  /* For STUDENT accounts only: links the login to a Student profile record. */
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null },
  /* For TEACHER accounts only: links the login to a Teacher profile record. */
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', default: null }
}, { timestamps: true });

const studentSchema = new Schema({
  admissionNo: { type: String, required: true, trim: true, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  gender: { type: String, enum: genderOptions, required: true },
  dob: { type: Date, default: null },
  classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass', default: null },
  guardianName: { type: String, trim: true, default: '' },
  guardianPhone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  address: { type: String, trim: true, default: '' },
  passwordHash: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const teacherSchema = new Schema({
  staffNo: { type: String, required: true, trim: true, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  gender: { type: String, enum: genderOptions, required: true },
  phone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  specialization: { type: String, trim: true, default: '' },
  hireDate: { type: Date, default: null },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const classSchema = new Schema({
  name: { type: String, required: true, trim: true },
  section: { type: String, trim: true, default: '' },
  academicYear: { type: String, required: true, trim: true },
  classTeacher: { type: Schema.Types.ObjectId, ref: 'Teacher', default: null },
  capacity: { type: Number, min: 1, default: 40 }
}, { timestamps: true });
classSchema.index({ name: 1, section: 1, academicYear: 1 }, { unique: true });

const subjectSchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', default: null }
}, { timestamps: true });

const attendanceSchema = new Schema({
  date: { type: Date, required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'], required: true, default: 'Present' },
  remarks: { type: String, trim: true, default: '' }
}, { timestamps: true });
attendanceSchema.index({ date: 1, studentId: 1 }, { unique: true });

const examSchema = new Schema({
  title: { type: String, required: true, trim: true },
  term: { type: String, enum: termOptions, required: true },
  academicYear: { type: String, required: true, trim: true },
  classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  date: { type: Date, default: null },
  status: { type: String, enum: ['Draft', 'Scheduled', 'Completed'], default: 'Scheduled' }
}, { timestamps: true });
examSchema.pre('validate', function () {
  const start = this.startDate || this.date;
  if (start && this.endDate && this.endDate < start) this.invalidate('endDate', 'End date cannot be before the start date.');
});

const resultSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  marksObtained: { type: Number, required: true, min: 0 },
  maxMarks: { type: Number, required: true, min: 1, default: 100 },
  grade: { type: String, default: '—' },
  remarks: { type: String, trim: true, default: '' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
resultSchema.index({ studentId: 1, examId: 1, subjectId: 1 }, { unique: true });
resultSchema.pre('validate', function () {
  if (typeof this.marksObtained === 'number' && typeof this.maxMarks === 'number' && this.maxMarks > 0) {
    if (this.marksObtained > this.maxMarks) this.invalidate('marksObtained', 'Marks obtained cannot exceed maximum marks.');
    const percent = this.marksObtained / this.maxMarks * 100;
    this.grade = gradeForPercentage(percent);
    if (!this.remarks) this.remarks = remarkForGrade(this.grade);
  }
});
resultSchema.virtual('percentage').get(function () {
  return this.maxMarks > 0 ? Math.round(this.marksObtained / this.maxMarks * 10000) / 100 : 0;
});

const paymentSchema = new Schema({
  receiptNo: { type: String, required: true, trim: true, default: () => `SF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}` },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true },
  paymentMethod: { type: String, enum: paymentOptions, required: true, default: 'Cash' },
  reference: { type: String, trim: true, default: '' }
}, { timestamps: true });

const feeSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  term: { type: String, enum: termOptions, required: true },
  academicYear: { type: String, required: true, trim: true },
  amountDue: { type: Number, required: true, min: 0 },
  payments: { type: [paymentSchema], default: [] }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
feeSchema.index({ 'payments.receiptNo': 1 }, { unique: true, sparse: true });
feeSchema.virtual('amountPaid').get(function () {
  return this.payments.reduce((total, payment) => total + payment.amount, 0);
});
feeSchema.virtual('balance').get(function () {
  return Math.max(0, this.amountDue - this.amountPaid);
});
feeSchema.virtual('status').get(function () {
  if (this.amountPaid === 0) return 'Unpaid';
  return this.balance === 0 ? 'Paid' : 'Partial';
});
feeSchema.pre('validate', function () {
  if (this.amountPaid > this.amountDue) this.invalidate('payments', 'Payments cannot exceed the amount due.');
});

const feeStructureSchema = new Schema({
  classLevel: { type: String, required: true, trim: true },
  academicYear: { type: String, required: true, trim: true },
  term: { type: String, enum: termOptions, required: true },
  amountDue: { type: Number, required: true, min: 0 }
}, { timestamps: true });
feeStructureSchema.index({ classLevel: 1, academicYear: 1, term: 1 }, { unique: true });

const reportCardSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  teacherComment: { type: String, trim: true, maxlength: 2000, default: '' }
}, { timestamps: true });
reportCardSchema.index({ studentId: 1, examId: 1 }, { unique: true });

/* Student timetable / class period slots */
const timetableSchema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], required: true },
  periodNumber: { type: Number, min: 1, max: 10, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String, trim: true, default: '' },
  academicYear: { type: String, required: true, trim: true },
  term: { type: String, enum: termOptions, required: true }
}, { timestamps: true });
timetableSchema.index({ classId: 1, dayOfWeek: 1, periodNumber: 1 }, { unique: true });

/* Assignments / homework */
const assignmentSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  dueDate: { type: Date, required: true },
  academicYear: { type: String, required: true, trim: true },
  term: { type: String, enum: termOptions, required: true }
}, { timestamps: true });

const assignmentSubmissionSchema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  submittedAt: { type: Date, default: null },
  status: { type: String, enum: ['submitted', 'pending'], default: 'pending' },
  grade: { type: Number, min: 0, max: 100, default: null },
  feedback: { type: String, trim: true, default: '' }
}, { timestamps: true });
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

/* School announcements / bulletins */
const announcementSchema = new Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  audience: { type: String, enum: ['all', 'students', 'teachers', 'parents'], default: 'students' },
  academicYear: { type: String, required: true, trim: true },
  term: { type: String, enum: termOptions, required: true },
  publishedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = {
  admins: mongoose.model('Admin', adminSchema),
  students: mongoose.model('Student', studentSchema),
  teachers: mongoose.model('Teacher', teacherSchema),
  classes: mongoose.model('SchoolClass', classSchema),
  subjects: mongoose.model('Subject', subjectSchema),
  attendance: mongoose.model('Attendance', attendanceSchema),
  exams: mongoose.model('Exam', examSchema),
  results: mongoose.model('Result', resultSchema),
  fees: mongoose.model('Fee', feeSchema),
  feeStructures: mongoose.model('FeeStructure', feeStructureSchema),
  reportCards: mongoose.model('ReportCard', reportCardSchema),
  timetables: mongoose.model('Timetable', timetableSchema),
  assignments: mongoose.model('Assignment', assignmentSchema),
  assignmentSubmissions: mongoose.model('AssignmentSubmission', assignmentSubmissionSchema),
  announcements: mongoose.model('Announcement', announcementSchema)
};
