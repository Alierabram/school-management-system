require('dotenv').config();
const crypto = require('crypto');
const { promisify } = require('util');
const mongoose = require('mongoose');
const models = require('../src/models');

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

const CLASSES = [
  { name: 'Senior One', sections: ['A', 'B'], academicYear: '2025-2026' },
  { name: 'Senior Two', sections: ['A', 'B'], academicYear: '2025-2026' },
  { name: 'Senior Three', sections: ['A', 'B'], academicYear: '2025-2026' },
  { name: 'Senior Four', sections: ['A', 'B'], academicYear: '2025-2026' }
];

const ARTS_SUBJECTS = [
  { name: 'English Language', code: 'ENG-S1' },
  { name: 'History', code: 'HIST-S1' },
  { name: 'Geography', code: 'GEOG-S1' },
  { name: 'Entrepreneurship', code: 'ENT-S1' },
  { name: 'Literature', code: 'LIT-S1' },
  { name: 'CRE/IRE', code: 'CRE-S1' }
];

const SCIENCE_SUBJECTS = [
  { name: 'Mathematics', code: 'MATH-S1' },
  { name: 'Physics', code: 'PHYS-S1' },
  { name: 'Chemistry', code: 'CHEM-S1' },
  { name: 'Biology', code: 'BIO-S1' },
  { name: 'Agriculture', code: 'AGRI-S1' },
  { name: 'Computer Studies', code: 'COMP-S1' }
];

const TEACHERS = [
  { staffNo: 'T-10001', firstName: 'John', lastName: 'Mugisha', phone: '0711111111', email: 'john.mugisha@school.local' },
  { staffNo: 'T-10002', firstName: 'Mary', lastName: 'Nkomo', phone: '0711222222', email: 'mary.nkomo@school.local' },
  { staffNo: 'T-10003', firstName: 'Peter', lastName: 'Okello', phone: '0711333333', email: 'peter.okello@school.local' },
  { staffNo: 'T-10004', firstName: 'Sarah', lastName: 'Kemigisha', phone: '0711444444', email: 'sarah.kemigisha@school.local' },
  { staffNo: 'T-10005', firstName: 'David', lastName: 'Watson', phone: '0711555555', email: 'david.watson@school.local' },
  { staffNo: 'T-10006', firstName: 'Agnes', lastName: 'Mbale', phone: '0711666666', email: 'agnes.mbale@school.local' },
  { staffNo: 'T-10007', firstName: 'James', lastName: 'Namwang', phone: '0711777777', email: 'james.namwang@school.local' },
  { staffNo: 'T-10008', firstName: 'Linda', lastName: 'Akello', phone: '0711888888', email: 'linda.akello@school.local' },
  { staffNo: 'T-10011', firstName: 'Sarah', lastName: 'Akello', phone: '0712111222', email: 'sarah.akello@school.local' },
  { staffNo: 'T-10009', firstName: 'Samuel', lastName: 'Okwiri', phone: '0711999999', email: 'samuel.okwiri@school.local' },
  { staffNo: 'T-10010', firstName: 'Rebecca', lastName: 'Nakato', phone: '0712000000', email: 'rebecca.nakato@school.local' }
];

const STUDENTS = [
  { admissionNo: '20001', firstName: 'Ahmad', lastName: 'Tajudin', gender: 'Male', guardianName: 'Tajudin Family', guardianPhone: '0700111222', email: 'ahmad.tajudin@gmail.com' },
  { admissionNo: '20002', firstName: 'Fatima', lastName: 'Nkosi', gender: 'Female', guardianName: 'Nkosi Family', guardianPhone: '0700222333', email: 'fatima.nkosi@gmail.com' },
  { admissionNo: '20003', firstName: 'James', lastName: 'Mukendi', gender: 'Male', guardianName: 'Mukendi Family', guardianPhone: '0700333444', email: 'james.mukendi@gmail.com' },
  { admissionNo: '20004', firstName: 'Grace', lastName: 'Akom', gender: 'Female', guardianName: 'Akom Family', guardianPhone: '0700444555', email: 'grace.akom@gmail.com' },
  { admissionNo: '20005', firstName: 'Peter', lastName: 'Okello', gender: 'Male', guardianName: 'Okello Family', guardianPhone: '0700555666', email: 'peter.okello@gmail.com' },
  { admissionNo: '20006', firstName: 'Davib', lastName: 'Thon Nhial', gender: 'Male', guardianName: 'Nhial Family', guardianPhone: '079865678990', email: 'thon@gmail.com' },
  { admissionNo: '20007', firstName: 'Mary', lastName: 'Atim', gender: 'Female', guardianName: 'Atim Family', guardianPhone: '0700666777', email: 'mary.atim@gmail.com' },
  { admissionNo: '20008', firstName: 'Jok', lastName: 'Deng', gender: 'Male', guardianName: 'Deng Family', guardianPhone: '0700777888', email: 'jok.deng@gmail.com' },
  { admissionNo: '20009', firstName: 'Agnes', lastName: 'Lukudu', gender: 'Female', guardianName: 'Lukudu Family', guardianPhone: '0700888999', email: 'agnes.lukudu@gmail.com' },
  { admissionNo: '20010', firstName: 'Samuel', lastName: 'Okwiri', gender: 'Male', guardianName: 'Okwiri Family', guardianPhone: '0700999000', email: 'samuel.okwiri2@gmail.com' }
];

const GRADES = [
  { mark: 85, grade: 'D1', remarks: 'Excellent work, keep it up!' },
  { mark: 78, grade: 'D2', remarks: 'Good work, needs improvement in presentation.' },
  { mark: 72, grade: 'D3', remarks: 'Satisfactory, review weak areas.' },
  { mark: 62, grade: 'D5', remarks: 'Pass, focus on understanding concepts.' },
  { mark: 52, grade: 'P7', remarks: 'Minimum pass, work on consistency.' },
  { mark: 42, grade: 'P8', remarks: 'Below pass, intensive revision needed.' },
  { mark: 35, grade: 'F9', remarks: 'Fail, need extra support from teacher.' }
];

async function seedSubjects() {
  console.log('Seeding subjects...');
  const classes = await models.classes.find({});
  const classIdMap = new Map(classes.map(c => [c.name, c._id]));
  const teachers = await models.teachers.find({});

  const allSubjectNames = new Set();
  for (const s of ARTS_SUBJECTS) allSubjectNames.add(s.name);
  for (const s of SCIENCE_SUBJECTS) allSubjectNames.add(s.name);

  let counter = 1;
  for (const name of allSubjectNames) {
    const code = `SUBJ-${String(counter).padStart(4, '0')}`;
    counter += 1;
    const isArts = ARTS_SUBJECTS.find(s => s.name === name);
    const classId = classIdMap.get('Senior One');
    if (classId) {
      await models.subjects.findOneAndUpdate(
        { name, code },
        { name, code, classId, teacherId: teachers[counter % teachers.length]?._id || null },
        { upsert: true, new: true, runValidators: true }
      );
    }
  }
  console.log('Subjects seeded successfully.');
}

async function seedClasses() {
  console.log('Seeding classes...');
  for (const c of CLASSES) {
    for (const section of c.sections) {
      await models.classes.findOneAndUpdate(
        { name: c.name, section, academicYear: c.academicYear },
        { name: c.name, section, academicYear: c.academicYear, capacity: 40 },
        { upsert: true, new: true, runValidators: true }
      );
    }
  }
  console.log('Classes seeded successfully.');
}

async function seedTeachers() {
  console.log('Seeding teachers...');
  for (const t of TEACHERS) {
    await models.teachers.findOneAndUpdate(
      { staffNo: t.staffNo },
      {
        staffNo: t.staffNo,
        firstName: t.firstName,
        lastName: t.lastName,
        gender: 'Other',
        phone: t.phone,
        email: t.email,
        specialization: 'Various',
        hireDate: new Date('2020-01-01'),
        status: 'Active'
      },
      { upsert: true, new: true, runValidators: true }
    );
  }
  console.log('Teachers seeded successfully.');

  const passwordHash = await hashPassword('ChangeMe-Teacher-2026');
  const teachers = await models.teachers.find({});
  for (const t of teachers) {
    await models.admins.findOneAndUpdate(
      { teacherId: t._id },
      { email: t.email, name: `${t.firstName} ${t.lastName}`, passwordHash, role: 'TEACHER', teacherId: t._id, classId: null },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

const classNames = ['Senior One', 'Senior Two', 'Senior Three', 'Senior Four'];

async function seedStudents() {
  console.log('Seeding students...');
  const classes = await models.classes.find({ name: { $regex: /^Senior/ } });
  const classIdMap = new Map(classes.map(c => [`${c.name} ${c.section}`, c._id]));
  const sections = ['A', 'B'];

  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];
    const className = classNames[Math.floor(i / 2) % 4];
    const section = sections[i % 2];
    const classId = classIdMap.get(`${className} ${section}`);

    await models.students.findOneAndUpdate(
      { admissionNo: s.admissionNo },
      {
        admissionNo: s.admissionNo,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        dob: new Date('2008-01-01'),
        classId: classId,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        email: s.email,
        address: 'School Hostel',
        status: 'Active'
      },
      { upsert: true, new: true, runValidators: true }
    );
  }
  console.log('Students seeded successfully.');

  const passwordHash = await hashPassword('ChangeMe-Student-2026');
  const students = await models.students.find({});
  for (const s of students) {
    await models.admins.findOneAndUpdate(
      { studentId: s._id },
      { email: s.email, name: `${s.firstName} ${s.lastName}`, passwordHash, role: 'STUDENT', studentId: s._id },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

async function seedFees() {
  console.log('Seeding fees...');
  const students = await models.students.find({});

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    for (const term of ['Term 1', 'Term 2', 'Term 3']) {
      const amountDue = 300000;
      let amountPaid;
      if (i < 5) {
        amountPaid = amountDue;
      } else {
        amountPaid = amountDue * 0.5;
      }

      await models.fees.findOneAndUpdate(
        { studentId: s._id, term, academicYear: '2025-2026' },
        {
          studentId: s._id,
          term,
          academicYear: '2025-2026',
          amountDue,
          payments: amountPaid > 0 ? [{
            receiptNo: `SF-${Date.now() - i * 1000}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            amount: amountPaid,
            date: new Date(),
            method: 'Mobile Money',
            reference: `MPN-${1000000000 + i + 100}`
          }] : []
        },
        { upsert: true, new: true, runValidators: true }
      );
    }
  }
  console.log('Fees seeded successfully.');
}

async function seedAttendance() {
  console.log('Seeding attendance...');
  const students = await models.students.find({});
  const allClasses = await models.classes.find({ name: { $regex: /^Senior/ } });

  const today = new Date();
  for (const s of students) {
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const random = Math.random();
      let status = 'Present';
      if (random < 0.1) status = 'Absent';
      else if (random < 0.15) status = 'Late';
      else if (random < 0.17) status = 'Excused';

      await models.attendance.findOneAndUpdate(
        { date: new Date(date.toISOString().slice(0, 10)), studentId: s._id },
        {
          date: new Date(date.toISOString().slice(0, 10)),
          classId: s.classId,
          studentId: s._id,
          status,
          remarks: ''
        },
        { upsert: true, new: true, runValidators: true }
      );
    }
  }
  console.log('Attendance seeded successfully.');
}

async function seedExams() {
  console.log('Seeding exams...');
  const classes = await models.classes.find({});
  const exams = [
    { title: 'Mid-Term Examination', term: 'Term 1', status: 'Completed', startDate: new Date('2026-02-01'), endDate: new Date('2026-02-05') },
    { title: 'End-of-Term Examination', term: 'Term 2', status: 'Scheduled', startDate: new Date('2026-04-01'), endDate: new Date('2026-04-05') }
  ];

  const examList = [];
  for (const exam of exams) {
    for (const c of classes) {
      const examRecord = await models.exams.findOneAndUpdate(
        { title: exam.title, classId: c._id, term: exam.term },
        {
          title: exam.title,
          term: exam.term,
          academicYear: '2025-2026',
          classId: c._id,
          startDate: exam.startDate,
          endDate: exam.endDate,
          status: exam.status
        },
        { upsert: true, new: true, runValidators: true }
      );
      examList.push(examRecord);
    }
  }
  console.log('Exams seeded successfully.');

  const firstExam = examList[0];
  const students = await models.students.find({});
  const subjects = await models.subjects.find({});

  for (const s of students) {
    for (const sub of subjects) {
      const gradeData = GRADES[Math.floor(Math.random() * GRADES.length)];
      await models.results.findOneAndUpdate(
        { studentId: s._id, examId: firstExam._id, subjectId: sub._id },
        {
          studentId: s._id,
          examId: firstExam._id,
          subjectId: sub._id,
          marksObtained: gradeData.mark,
          maxMarks: 100,
          grade: gradeData.grade,
          remarks: gradeData.remarks
        },
        { upsert: true, new: true, runValidators: true }
      );
    }
    await models.reportCards.findOneAndUpdate(
      { studentId: s._id, examId: firstExam._id },
      { studentId: s._id, examId: firstExam._id, teacherComment: 'Excellent work this term!' },
      { upsert: true, new: true, runValidators: true }
    );
  }
  console.log('Results seeded successfully.');
}

async function seedTimetable() {
  console.log('Seeding timetable...');
  const classes = await models.classes.find({});
  const subjects = await models.subjects.find({});
  const teachers = await models.teachers.find({});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  for (const c of classes) {
    for (let i = 0; i < 25; i++) {
      const subject = subjects[i % subjects.length];
      const teacher = teachers[i % teachers.length];
      const day = days[i % 5];
      const period = ((i % 8) + 1);
      const hour = 8 + Math.floor(period / 4);
      const minute = ((period % 4) * 15);

      await models.timetables.findOneAndUpdate(
        { classId: c._id, dayOfWeek: day, periodNumber: period, academicYear: '2025-2026' },
        {
          classId: c._id,
          subjectId: subject._id,
          teacherId: teacher._id,
          dayOfWeek: day,
          periodNumber: period,
          startTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
          endTime: `${String(hour).padStart(2, '0')}:${String(minute + 15).padStart(2, '0')}:00`,
          room: `Room ${String(Math.floor(i / 2) + 1).padStart(2, '0')}`,
          academicYear: '2025-2026',
          term: 'Term 1'
        },
        { upsert: true, new: true, runValidators: true }
      );
    }
  }
  console.log('Timetable seeded successfully.');
}

async function seedAnnouncements() {
  console.log('Seeding announcements...');
  const announcements = [
    { title: 'School Uniform Policy Update', content: 'New uniforms will be mandatory starting Term 2. Please ensure all students have their proper school attire.', academicYear: '2025-2026', term: 'Term 1' },
    { title: 'Parents Meeting', content: 'A meeting for all parents will be held on 15th November 2026 to discuss the upcoming academic year', academicYear: '2025-2026', term: 'Term 1' },
    { title: 'Half-Day Friday', content: 'All classes will have half-day sessions on Fridays for staff development.', academicYear: '2025-2026', term: 'Term 1' }
  ];
  for (const a of announcements) {
    await models.announcements.findOneAndUpdate(
      { title: a.title, academicYear: a.academicYear },
      { title: a.title, content: a.content, audience: 'all', academicYear: a.academicYear, term: a.term, isActive: true },
      { upsert: true, new: true, runValidators: true }
    );
  }
  console.log('Announcements seeded successfully.');
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_management');
  console.log('Connected to MongoDB');

  await seedClasses();
  await seedTeachers();
  await seedSubjects();
  await seedStudents();
  await seedFees();
  await seedAttendance();
  await seedExams();
  await seedTimetable();
  await seedAnnouncements();

  const counts = {
    classes: await models.classes.countDocuments(),
    subjects: await models.subjects.countDocuments(),
    teachers: await models.teachers.countDocuments(),
    students: await models.students.countDocuments(),
    fees: await models.fees.countDocuments(),
    attendance: await models.attendance.countDocuments(),
    exams: await models.exams.countDocuments(),
    results: await models.results.countDocuments(),
    timetable: await models.timetables.countDocuments(),
    announcements: await models.announcements.countDocuments()
  };
  console.log('\n✅ All seed data created successfully!');
  console.log('\n📊 Summary:');
  for (const key in counts) {
    console.log(`   ${key}: ${counts[key]}`);
  }

  await mongoose.disconnect();
}

main().catch(error => {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
});
