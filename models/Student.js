const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, trim: true, maxlength: 20, uppercase: true },
    courseName: { type: String, required: true, trim: true, maxlength: 120 },
    creditUnits: { type: Number, required: true, min: 1, max: 10 },
    courseworkMarks: { type: Number, min: 0, max: 40, default: null },
    examMarks: { type: Number, min: 0, max: 60, default: null },
    totalMarks: { type: Number, min: 0, max: 100, default: null },
    grade: { type: String, enum: ["A", "B+", "B", "C+", "C", "D", "F", ""], default: "" },
    gradePoint: { type: Number, min: 0, max: 4, default: null },
    semester: { type: String, enum: ["Semester I", "Semester II"], default: "Semester I" }
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 40 },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    dateOfBirth: { type: Date },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 150 },
    phone: { type: String, trim: true, maxlength: 30 },
    nationality: { type: String, default: "Ugandan", trim: true, maxlength: 60 },
    programme: { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, required: true, trim: true, maxlength: 120 },
    yearOfStudy: { type: Number, required: true, min: 1, max: 4 },
    semester: { type: String, enum: ["Semester I", "Semester II"], default: "Semester I" },
    academicStatus: {
      type: String,
      enum: ["Active", "On Probation", "Suspended", "Graduated", "Deferred"],
      default: "Active"
    },
    courses: [courseSchema],
    cgpa: { type: Number, min: 0, max: 4, default: null },
    tuitionTotal: { type: Number, default: 1800000 },
    tuitionPaid: { type: Number, default: 0 },
    tuitionBalance: { type: Number, default: 1800000 },
    tuitionStatus: { type: String, enum: ["Cleared", "Partial", "Pending"], default: "Pending" },
    guardianName: { type: String, trim: true, maxlength: 120 },
    guardianPhone: { type: String, trim: true, maxlength: 30 },
    enrolledDate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

studentSchema.index({ fullName: 1 });
studentSchema.index({ programme: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ yearOfStudy: 1 });
studentSchema.index({ academicStatus: 1 });
studentSchema.index({ tuitionStatus: 1 });

function gradeFor(marks) {
  if (marks === null || marks === undefined || Number.isNaN(marks)) return { grade: "", gradePoint: null };
  if (marks >= 70) return { grade: "A", gradePoint: 4.0 };
  if (marks >= 65) return { grade: "B+", gradePoint: 3.5 };
  if (marks >= 60) return { grade: "B", gradePoint: 3.0 };
  if (marks >= 55) return { grade: "C+", gradePoint: 2.5 };
  if (marks >= 50) return { grade: "C", gradePoint: 2.0 };
  if (marks >= 45) return { grade: "D", gradePoint: 1.5 };
  return { grade: "F", gradePoint: 0.0 };
}

studentSchema.methods.computeGrade = function (course) {
    const coursework = course.courseworkMarks !== null && course.courseworkMarks !== undefined ? course.courseworkMarks : 0;
    const exam = course.examMarks !== null && course.examMarks !== undefined ? course.examMarks : 0;
    if (course.courseworkMarks === null || course.examMarks === null) return;
    course.totalMarks = coursework + exam;
    const result = gradeFor(course.totalMarks);
    course.grade = result.grade;
    course.gradePoint = result.gradePoint;
    this.computeCGPA();
  };

studentSchema.methods.computeCGPA = function () {
  const graded = (this.courses || []).filter(c => c.gradePoint !== null && c.gradePoint !== undefined);
  if (!graded.length) {
    this.cgpa = null;
    return;
  }
  let totalPoints = 0;
  let totalCredits = 0;
  graded.forEach(c => {
    totalPoints += c.gradePoint * (c.creditUnits || 0);
    totalCredits += c.creditUnits || 0;
  });
  this.cgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null;
};

studentSchema.methods.computeTuition = function () {
  this.tuitionBalance = Math.max(0, (this.tuitionTotal || 0) - (this.tuitionPaid || 0));
  if (this.tuitionBalance === 0) this.tuitionStatus = "Cleared";
  else if (this.tuitionPaid > 0) this.tuitionStatus = "Partial";
  else this.tuitionStatus = "Pending";
};

studentSchema.pre("save", function () {
  this.computeTuition();
  this.computeCGPA();
});

module.exports = mongoose.model("Student", studentSchema);