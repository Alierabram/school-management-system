const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");
const Student = require("../models/Student");
const AuditLog = require("../models/AuditLog");
const { protect, authorize, ROLES } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const GENDERS = ["Male", "Female"];
const SEMESTERS = ["Semester I", "Semester II"];
const ACADEMIC_STATUSES = ["Active", "On Probation", "Suspended", "Graduated", "Deferred"];
const TUITION_STATUSES = ["Cleared", "Partial", "Pending"];
const GRADE_POINTS = { A: 4.0, "B+": 3.5, B: 3.0, "C+": 2.5, C: 2.0, D: 1.5, F: 0.0 };
const DEFAULT_TUITION_TOTAL = 1800000;
const EXAM_PERMIT_UNLOCK_RATIO = 0.7;

const SORT_FIELDS = {
  createdAt: "createdAt",
  fullName: "fullName",
  regNo: "regNo",
  yearOfStudy: "yearOfStudy",
  programme: "programme",
  department: "department",
  enrolledDate: "enrolledDate"
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REG_NO_RE = /^[A-Z0-9][A-Z0-9/.\-]{3,39}$/;
const PHONE_RE = /^[+\d\s().-]{7,30}$/;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateStudentPayload(body = {}) {
  const errors = [];
  const fullName = text(body.fullName);
  const regNo = text(body.regNo).toUpperCase();
  const email = text(body.email).toLowerCase();
  const gender = text(body.gender);
  const phone = text(body.phone);
  const nationality = text(body.nationality) || "Ugandan";
  const programme = text(body.programme);
  const department = text(body.department);
  const yearOfStudy = Number(body.yearOfStudy);
  const semester = text(body.semester) || "Semester I";
  const academicStatus = text(body.academicStatus) || "Active";
  const tuitionStatus = text(body.tuitionStatus) || "Pending";
  const guardianName = text(body.guardianName);
  const guardianPhone = text(body.guardianPhone);

  if (fullName.length < 2) errors.push("Full name is required.");
  else if (fullName.length > 120) errors.push("Full name must be 120 characters or fewer.");

  if (!regNo) errors.push("Registration number is required.");
  else if (!REG_NO_RE.test(regNo)) {
    errors.push("Registration number must be 4-40 characters using letters, numbers, slashes, dots or dashes.");
  }

  if (!email || !EMAIL_RE.test(email)) errors.push("A valid email address is required.");
  else if (email.length > 150) errors.push("Email must be 150 characters or fewer.");

  if (!GENDERS.includes(gender)) errors.push("Gender must be Male or Female.");
  if (phone && !PHONE_RE.test(phone)) errors.push("Phone number is invalid.");
  if (nationality.length > 60) errors.push("Nationality must be 60 characters or fewer.");
  if (!programme) errors.push("Programme is required.");
  else if (programme.length > 120) errors.push("Programme must be 120 characters or fewer.");
  if (!department) errors.push("Department is required.");
  else if (department.length > 120) errors.push("Department must be 120 characters or fewer.");
  if (!Number.isInteger(yearOfStudy) || yearOfStudy < 1 || yearOfStudy > 4) {
    errors.push("Year of study must be a whole number from 1 to 4.");
  }
  if (!SEMESTERS.includes(semester)) errors.push("Semester must be Semester I or Semester II.");
  if (!ACADEMIC_STATUSES.includes(academicStatus)) errors.push("Academic status is invalid.");
  if (!TUITION_STATUSES.includes(tuitionStatus)) errors.push("Tuition status is invalid.");
  if (guardianName.length > 120) errors.push("Guardian name must be 120 characters or fewer.");
  if (guardianPhone && !PHONE_RE.test(guardianPhone)) errors.push("Guardian phone number is invalid.");

  const dob = body.dateOfBirth ? parseDate(body.dateOfBirth) : null;
  if (body.dateOfBirth && !dob) errors.push("Date of birth is invalid.");
  const enrolledDate = body.enrolledDate ? parseDate(body.enrolledDate) : null;

  if (errors.length) return { errors, value: null };

  const value = {
    regNo,
    fullName,
    gender,
    dateOfBirth: dob,
    email,
    phone,
    nationality,
    programme,
    department,
    yearOfStudy,
    semester,
    academicStatus,
    tuitionStatus,
    guardianName,
    guardianPhone,
    enrolledDate
  };

  for (const key of Object.keys(value)) {
    if (value[key] === undefined || value[key] === "") delete value[key];
  }

  return { errors, value };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildStudentQuery(query = {}) {
  const q = text(query.q).slice(0, 100);
  const programme = text(query.programme).slice(0, 120);
  const department = text(query.department).slice(0, 120);
  const yearOfStudy = Number(text(query.yearOfStudy));
  const academicStatus = text(query.academicStatus);
  const tuitionStatus = text(query.tuitionStatus);

  const filter = {};
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ fullName: pattern }, { regNo: pattern }, { email: pattern }];
  }
  if (programme) filter.programme = programme;
  if (department) filter.department = department;
  if (Number.isInteger(yearOfStudy) && yearOfStudy >= 1 && yearOfStudy <= 4) filter.yearOfStudy = yearOfStudy;
  if (ACADEMIC_STATUSES.includes(academicStatus)) filter.academicStatus = academicStatus;
  if (TUITION_STATUSES.includes(tuitionStatus)) filter.tuitionStatus = tuitionStatus;

  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 10;
  page = Math.min(page, 100000);
  limit = Math.min(limit, 200);

  const sortBy = SORT_FIELDS[text(query.sort)] || "createdAt";
  const order = text(query.order).toLowerCase() === "asc" ? 1 : -1;

  return { filter, page, limit, sort: { [sortBy]: order, _id: 1 } };
}

const EXAM_PERMIT_UNLOCK_THRESHOLD = 0.7;

// Public verification (no auth) - wildcard so regNo with slashes works
router.get("/public/verify/*", async (req, res, next) => {
  try {
    const raw = req.params[0] || "";
    const regNo = decodeURIComponent(raw).trim().toUpperCase();
    const student = await Student.findOne({ regNo }).lean();
    if (!student) {
      return res.json({ verified: false, data: null, reason: "NOT_FOUND" });
    }
    const activeStatuses = ["Active", "On Probation", "Suspended"];
    const isActive = activeStatuses.includes(student.academicStatus);
    const cleared = student.tuitionStatus === "Cleared";
    res.json({
      verified: isActive,
      data: {
        regNo: student.regNo,
        fullName: student.fullName,
        programme: student.programme,
        department: student.department,
        yearOfStudy: student.yearOfStudy,
        semester: student.semester,
        academicStatus: student.academicStatus,
        email: student.email,
        phone: student.phone,
        tuitionStatus: student.tuitionStatus,
        verifiedAt: new Date().toISOString()
      },
      reason: isActive ? null : "INACTIVE",
      tuitionCleared: cleared
    });
  } catch (err) {
    next(err);
  }
});

router.use(protect);
router.use(authorize("Registrar", "Accounts", "HOD"));

router.get("/", async (req, res, next) => {
  try {
    const { filter, page, limit, sort } = buildStudentQuery(req.query);
    const [data, total] = await Promise.all([
      Student.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Student.countDocuments(filter)
    ]);
    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const [total, active, tuitionCleared, programmes, departments] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ academicStatus: "Active" }),
      Student.countDocuments({ tuitionStatus: "Cleared" }),
      Student.distinct("programme"),
      Student.distinct("department")
    ]);
    res.json({
      data: {
        total,
        active,
        tuitionCleared,
        programmes: programmes.filter(Boolean).length,
        departments: departments.filter(Boolean).length
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/options", async (req, res, next) => {
  try {
    const [programmes, departments] = await Promise.all([
      Student.distinct("programme"),
      Student.distinct("department")
    ]);
    res.json({
      data: {
        programmes: programmes.filter(Boolean).sort((a, b) => a.localeCompare(b)),
        departments: departments.filter(Boolean).sort((a, b) => a.localeCompare(b))
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/chart", async (req, res, next) => {
  try {
    const rows = await Student.aggregate([
      { $group: { _id: "$programme", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]);
    res.json({
      data: rows.map((r) => ({ programme: r._id, count: r.count })).filter(Boolean)
    });
  } catch (err) {
    next(err);
  }
});

router.get("/enrollment-chart", async (req, res, next) => {
  try {
    const rows = await Student.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]);
    res.json({
      data: rows.map((r) => ({ department: r._id, count: r.count })).filter(Boolean)
    });
  } catch (err) {
    next(err);
  }
});

router.get("/tuition-chart", async (req, res, next) => {
  try {
    const cleared = await Student.countDocuments({ tuitionStatus: "Cleared" });
    const partial = await Student.countDocuments({ tuitionStatus: "Partial" });
    const pending = await Student.countDocuments({ tuitionStatus: "Pending" });
    res.json({
      data: {
        cleared,
        partial,
        pending,
        total: cleared + partial + pending
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/academic-year-chart", async (req, res, next) => {
  try {
    const rows = await Student.aggregate([
      { $group: { _id: "$yearOfStudy", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({
      data: rows.map((r) => ({ year: r._id, count: r.count })).filter(Boolean)
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid student record ID." });
    }
    const student = await Student.findById(req.params.id).lean();
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ data: student });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const { errors, value } = validateStudentPayload(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  try {
    const student = await Student.create(value);
    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: "CREATE",
      targetRecord: student.regNo,
      details: `Created student record ${student.regNo}`
    });
    res.status(201).json({ data: student });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid student record ID." });
  }
  const { errors, value } = validateStudentPayload(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { $set: value }, {
      new: true,
      runValidators: true
    }).lean();
    if (!student) return res.status(404).json({ error: "Student not found." });
    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: "UPDATE",
      targetRecord: student.regNo,
      details: `Updated student record ${student.regNo}`
    });
    res.json({ data: student });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid student record ID." });
  }
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found." });
    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: "DELETE",
      targetRecord: student.regNo,
      details: `Deleted student record ${student.regNo}`
    });
    res.json({ data: { message: "Student record deleted." } });
  } catch (err) {
    next(err);
  }
});

// Add course / update marks
router.post("/:id/courses", authorize("Registrar", "HOD"), async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found." });
    const course = req.body || {};
    const code = String(course.courseCode || "").toUpperCase().trim();
    if (!code) return res.status(400).json({ error: "Course code is required." });
    const existing = student.courses.find(c => c.courseCode === code);
    if (existing) {
      existing.courseName = course.courseName || existing.courseName;
      existing.creditUnits = course.creditUnits || existing.creditUnits;
      existing.courseworkMarks = course.courseworkMarks ?? existing.courseworkMarks;
      existing.examMarks = course.examMarks ?? existing.examMarks;
      student.computeGrade(existing);
    } else {
      const newCourse = {
        courseCode: code,
        courseName: course.courseName || code,
        creditUnits: course.creditUnits || 3,
        courseworkMarks: course.courseworkMarks ?? null,
        examMarks: course.examMarks ?? null,
        semester: course.semester || student.semester || "Semester I"
      };
      student.courses.push(newCourse);
      student.computeGrade(newCourse);
    }
    await student.save();
    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: "COURSE_UPDATE",
      targetRecord: student.regNo,
      details: `Updated course ${code} for ${student.fullName}`
    });
    res.json({ data: student });
  } catch (err) {
    next(err);
  }
});

// Record tuition payment
router.post("/:id/tuition", authorize("Registrar", "Accounts"), async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found." });
    const paid = Number(req.body?.paid);
    if (Number.isNaN(paid) || paid < 0) return res.status(400).json({ error: "Payment amount must be a positive number." });
    student.tuitionPaid = paid;
    student.computeTuition();
    await student.save();
    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: "PAYMENT",
      targetRecord: student.regNo,
      details: `Recorded payment of ${paid} UGX for ${student.fullName}`
    });
    res.json({ data: student });
  } catch (err) {
    next(err);
  }
});

// Bulk CSV import (Registrar only)
router.post("/bulk-import", authorize("Registrar"), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "A CSV file is required." });
    }
    const raw = req.file.buffer.toString("utf8");
    const rows = [];
    const stream = Readable.from(raw.split("\n").map(line => line.trim()).filter(Boolean).join("\n"));

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    const requiredHeaders = ["regNo", "fullName", "email"];
    const headers = Object.keys(rows[0] || {}).map(h => h.trim());
    const missing = requiredHeaders.filter(h => !headers.includes(h));
    if (missing.length) {
      return res.status(400).json({ error: `CSV template headers must include ${missing.join(", ")}.` });
    }

    const studentsToCreate = [];
    const errors = [];

    rows.forEach((row, idx) => {
      const obj = {};
      headers.forEach(h => { obj[h] = row[h]; });
      const fullName = String(obj.fullName || "").trim();
      const regNo = String(obj.regNo || "").trim().toUpperCase();
      const email = String(obj.email || "").trim().toLowerCase();
      const programme = String(obj.programme || "").trim();
      const department = String(obj.department || "").trim();
      const yearOfStudy = Number(obj.yearOfStudy);
      const semester = String(obj.semester || "Semester I");
      const academicStatus = String(obj.academicStatus || "Active");
      const tuitionStatus = String(obj.tuitionStatus || "Pending");

      const value = {
        fullName,
        regNo,
        gender: ["Male", "Female"].includes(String(obj.gender || "")) ? String(obj.gender) : "Male",
        email,
        programme,
        department,
        yearOfStudy: Number.isInteger(yearOfStudy) && yearOfStudy >= 1 && yearOfStudy <= 4 ? yearOfStudy : 1,
        semester,
        academicStatus,
        tuitionStatus
      };
      const { errors: perrs, value: valid } = validateStudentPayload(value);
      if (perrs.length) {
        errors.push(`Row ${idx + 2}: ${perrs.join(" ")}`);
      } else {
        studentsToCreate.push(valid);
      }
    });

    const result = await Student.insertMany(studentsToCreate, { ordered: false });
    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: "BULK_IMPORT",
      targetRecord: `${result.length} records`,
      details: `Bulk imported ${result.length} students via CSV`
    });
    res.json({
      data: {
        imported: result.length,
        failed: errors.length,
        errors
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.validateStudentPayload = validateStudentPayload;
module.exports.buildStudentQuery = buildStudentQuery;
module.exports.GRADE_POINTS = GRADE_POINTS;
module.exports.EXAM_PERMIT_UNLOCK_THRESHOLD = EXAM_PERMIT_UNLOCK_RATIO;
module.exports.DEFAULT_TUITION_TOTAL = DEFAULT_TUITION_TOTAL;
