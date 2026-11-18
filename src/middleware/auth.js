/* ── Role-Based Access Control middleware ──────────────────────
   Roles live on the user account: 'ADMIN', 'STUDENT' or 'TEACHER'.
   The session stores userId, role and (for students/teachers) the
   associated profile id. Every protected route runs through requireAuth
   first; requireRole() narrows access by role. */

function attachUser(req) {
  const session = req.session || {};
  if (!session.userId) return null;
  req.user = {
    id: session.userId,
    role: session.role || 'ADMIN',
    studentId: session.studentId || null,
    teacherId: session.teacherId || null,
    email: session.user?.email,
    name: session.user?.name,
    admissionNo: session.user?.admissionNo,
    classId: session.user?.classId
  };
  return req.user;
}

/* Any authenticated user (ADMIN, STUDENT or TEACHER). */
function requireAuth(req, res, next) {
  if (attachUser(req)) return next();
  return res.status(401).json({ message: 'Please sign in to continue.' });
}

/* Restrict to one or more roles, e.g. requireRole('ADMIN'). */
function requireRole(...roles) {
  const allowed = new Set(roles);
  return function (req, res, next) {
    const user = attachUser(req);
    if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
    if (!allowed.has(user.role)) return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    return next();
  };
}

const requireAdmin = requireRole('ADMIN');
const requireStudent = requireRole('STUDENT');
const requireTeacher = requireRole('TEACHER');
const requireTeacherOrAdmin = requireRole('ADMIN', 'TEACHER');

/* Returns the logged-in student's profile id, or null for admins (who see everything). */
function studentScope(req) {
  return req.user?.role === 'STUDENT' ? req.user.studentId : null;
}

/* Apply student-scoped filtering to a Mongoose query for resources owned by students. */
function applyStudentScope(query, resource) {
  if (req.user?.role === 'STUDENT') {
    const studentId = req.user.studentId;
    if (resource === 'results') return query.where('studentId').equals(studentId);
    if (resource === 'attendance') return query.where('studentId').equals(studentId);
    if (resource === 'fees') return query.where('studentId').equals(studentId);
    if (resource === 'students') return query.where('_id').equals(studentId);
  }
  return query;
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireRole = requireRole;
module.exports.requireAdmin = requireAdmin;
module.exports.requireStudent = requireStudent;
module.exports.requireTeacher = requireTeacher;
module.exports.requireTeacherOrAdmin = requireTeacherOrAdmin;
module.exports.studentScope = studentScope;
module.exports.applyStudentScope = applyStudentScope;
