const crypto = require('crypto');
const { promisify } = require('util');
const { admins, students, teachers } = require('../models');

const scrypt = promisify(crypto.scrypt);

async function verifyPassword(password, encodedHash) {
  const [algorithm, salt, hash] = String(encodedHash).split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

exports.me = (req, res) => {
  res.json({
    authenticated: Boolean(req.session && req.session.userId),
    role: req.session && req.session.role ? req.session.role : null,
    studentId: req.session && req.session.studentId ? req.session.studentId : null,
    teacherId: req.session && req.session.teacherId ? req.session.teacherId : null,
    user: req.session.user || null
  });
};

exports.login = async (req, res, next) => {
  try {
    const loginId = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    if (!loginId || !password || password.length > 200) {
      return res.status(400).json({ message: 'Enter your email/staff number and password.' });
    }

    let user = null;
    let role = 'ADMIN';
    let studentProfile = null;
    let teacherProfile = null;

    // 1. Try exact email match in admins collection (handles admin, student, and teacher email logins)
    user = await admins.findOne({ email: loginId.toLowerCase() });
    if (user) {
      role = user.role || 'ADMIN';
      if (role === 'STUDENT' && user.studentId) {
        studentProfile = await students.findById(user.studentId);
      } else if (role === 'TEACHER' && user.teacherId) {
        teacherProfile = await teachers.findById(user.teacherId);
      }
    }

    // 2. If not found, try staff number lookup (teachers)
    if (!user) {
      const teacher = await teachers.findOne({ staffNo: loginId.toUpperCase() });
      if (teacher) {
        // Find the linked admin entry for this teacher
        user = await admins.findOne({ teacherId: String(teacher._id) });
        if (user) {
          role = 'TEACHER';
          teacherProfile = teacher;
        }
      }
    }

    // 3. Try admission number lookup (students)
    if (!user) {
      const student = await students.findOne({ admissionNo: loginId.toUpperCase() });
      if (student) {
        user = await admins.findOne({ studentId: String(student._id) });
        if (user) {
          role = 'STUDENT';
          studentProfile = student;
        }
      }
    }

    // 4. Fallback: search students/teachers collections by email
    if (!user) {
      studentProfile = await students.findOne({ email: loginId.toLowerCase() });
      if (!studentProfile) {
        teacherProfile = await teachers.findOne({ email: loginId.toLowerCase() });
      }
      if (studentProfile) {
        user = await admins.findOne({ studentId: String(studentProfile._id) });
        if (user) role = 'STUDENT';
      } else if (teacherProfile) {
        user = await admins.findOne({ teacherId: String(teacherProfile._id) });
        if (user) role = 'TEACHER';
      }
    }

    if (!user) return res.status(401).json({ message: 'Incorrect credentials.' });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Incorrect credentials.' });

    // For students, check status from student profile
    if (role === 'STUDENT' && studentProfile && String(studentProfile.status || '') !== 'Active') {
      return res.status(403).json({ message: 'Your student account is inactive. Contact the school office.' });
    }
    // For teachers, check status from teacher profile
    if (role === 'TEACHER' && teacherProfile && String(teacherProfile.status || '') !== 'Active') {
      return res.status(403).json({ message: 'Your teacher account is inactive. Contact the school office.' });
    }

    // Build payload
    const studentId = role === 'STUDENT' ? (studentProfile ? String(studentProfile._id) : (user.studentId ? String(user.studentId) : null)) : null;
    const teacherId = role === 'TEACHER' ? (teacherProfile ? String(teacherProfile._id) : (user.teacherId ? String(user.teacherId) : null)) : null;
    const payload = {
      userId: String(user._id),
      role,
      studentId,
      teacherId,
      user: {
        email: user.email || (studentProfile?.email || teacherProfile?.email || ''),
        name: (studentProfile?.firstName && studentProfile?.lastName)
          ? `${studentProfile.firstName} ${studentProfile.lastName}`
          : (teacherProfile?.firstName && teacherProfile?.lastName)
            ? `${teacherProfile.firstName} ${teacherProfile.lastName}`
            : (user.name || user.email || studentProfile?.admissionNo || teacherProfile?.staffNo || 'User'),
        role,
        studentId,
        teacherId,
        admissionNo: studentProfile?.admissionNo || null,
        staffNo: teacherProfile?.staffNo || null,
        classId: studentProfile?.classId || teacherProfile?.classId || null
      }
    };

    req.session.regenerate(error => {
      if (error) return next(error);
      req.session.userId = payload.userId;
      req.session.role = payload.role;
      req.session.studentId = payload.studentId;
      req.session.teacherId = payload.teacherId;
      req.session.user = payload.user;
      req.session.save(saveError => {
        if (saveError) return next(saveError);
        return res.json({ authenticated: true, role: payload.role, user: payload.user });
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie('school.sid', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    return res.json({ authenticated: false });
  });
};

module.exports = exports;