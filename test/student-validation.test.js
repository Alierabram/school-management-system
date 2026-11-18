const test = require("node:test");
const assert = require("node:assert/strict");
const { validateStudentPayload, buildStudentQuery } = require("../routes/studentRoutes");

const baseValid = {
  fullName: "Test Student",
  regNo: "24/BSE/BU/R/0099",
  email: "test@student.bugemauniv.ac.ug",
  gender: "Male",
  programme: "BSc. Software Engineering",
  department: "Computing & Informatics",
  yearOfStudy: 2,
  semester: "Semester I",
  academicStatus: "Active",
  tuitionStatus: "Pending",
  nationality: "Ugandan"
};

test("validateStudentPayload accepts a valid payload", () => {
  const { errors, value } = validateStudentPayload(baseValid);
  assert.equal(errors.length, 0);
  assert.equal(value.regNo, "24/BSE/BU/R/0099");
  assert.equal(value.email, "test@student.bugemauniv.ac.ug");
});

test("validateStudentPayload rejects missing required fields", () => {
  const { errors } = validateStudentPayload({});
  assert.ok(errors.length > 0);
  assert.ok(errors.some(e => e.includes("Full name")));
  assert.ok(errors.some(e => e.includes("Registration number")));
  assert.ok(errors.some(e => e.includes("email")));
  assert.ok(errors.some(e => e.includes("Gender")));
  assert.ok(errors.some(e => e.includes("Programme")));
  assert.ok(errors.some(e => e.includes("Department")));
  assert.ok(errors.some(e => e.includes("Year of study")));
});

test("validateStudentPayload rejects invalid year of study", () => {
  const { errors } = validateStudentPayload({ ...baseValid, yearOfStudy: 5 });
  assert.ok(errors.some(e => e.includes("Year of study")));
});

test("validateStudentPayload rejects invalid email", () => {
  const { errors } = validateStudentPayload({ ...baseValid, email: "not-an-email" });
  assert.ok(errors.some(e => e.includes("email")));
});

test("validateStudentPayload rejects invalid regNo format", () => {
  const { errors } = validateStudentPayload({ ...baseValid, regNo: "invalid@reg" });
  assert.ok(errors.some(e => e.includes("Registration number")));
});

test("validateStudentPayload normalizes regNo to uppercase", () => {
  const { value } = validateStudentPayload({ ...baseValid, regNo: "  24/bse/bu/r/0010  " });
  assert.equal(value.regNo, "24/BSE/BU/R/0010");
});

test("validateStudentPayload normalizes email to lowercase", () => {
  const { value } = validateStudentPayload({ ...baseValid, email: "  USER@EXAMPLE.COM  " });
  assert.equal(value.email, "user@example.com");
});

test("validateStudentPayload omits empty optional fields", () => {
  const { value } = validateStudentPayload({ ...baseValid, phone: "", guardianName: "" });
  assert.ok(!value.phone);
  assert.ok(!value.guardianName);
});

test("buildStudentQuery builds filter for search", () => {
  const { filter } = buildStudentQuery({ q: "John" });
  assert.ok(filter.$or);
  assert.ok(filter.$or.some(c => c.fullName instanceof RegExp));
});

test("buildStudentQuery handles programme filter", () => {
  const { filter } = buildStudentQuery({ programme: "BSc. Software Engineering" });
  assert.equal(filter.programme, "BSc. Software Engineering");
});

test("buildStudentQuery handles pagination defaults", () => {
  const { page, limit } = buildStudentQuery({});
  assert.equal(page, 1);
  assert.equal(limit, 10);
});

test("buildStudentQuery defaults sort to createdAt desc", () => {
  const { sort } = buildStudentQuery({});
  assert.equal(sort.createdAt, -1);
});

test("buildStudentQuery parses custom sort", () => {
  const { sort } = buildStudentQuery({ sort: "fullName", order: "asc" });
  assert.equal(sort.fullName, 1);
});