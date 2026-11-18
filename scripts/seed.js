require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const AuditLog = require("../models/AuditLog");

const USERS = [
  {
    name: "Bugema University Registrar",
    email: "registrar@bugemauniv.ac.ug",
    password: "Admin@2026",
    role: "Registrar"
  },
  {
    name: "Tuition Accounts Officer",
    email: "accounts@bugemauniv.ac.ug",
    password: "Accounts@2026",
    role: "Accounts"
  },
  {
    name: "Department Head",
    email: "hod@bugemauniv.ac.ug",
    password: "Hod@2026",
    role: "HOD"
  }
];

function buildInitialUsers(env = process.env) {
  if (env.NODE_ENV !== "production") return USERS;

  const email = String(env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(env.INITIAL_ADMIN_PASSWORD || "");
  if (!email || !password) {
    throw new Error("Production requires INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD to bootstrap the registrar account.");
  }
  if (password.length < 12) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be at least 12 characters.");
  }

  return [{
    name: "BugemaDesk Registrar",
    email,
    password,
    role: "Registrar"
  }];
}

const SEED_STUDENTS = [
  {
    regNo: "24/BSE/BU/R/0016",
    fullName: "Brian Ssemakula",
    gender: "Male",
    dateOfBirth: new Date("2004-03-12"),
    email: "brian.ssemakula@student.bugemauniv.ac.ug",
    phone: "+256 772 415 890",
    nationality: "Ugandan",
    programme: "BSc. Software Engineering",
    department: "Computing & Informatics",
    yearOfStudy: 2,
    semester: "Semester I",
    academicStatus: "Active",
    tuitionStatus: "Cleared",
    guardianName: "Mr. Joseph Ssemakula",
    guardianPhone: "+256 772 555 101",
    enrolledDate: new Date("2024-08-19")
  },
  {
    regNo: "24/BIT/BU/R/0017",
    fullName: "Sarah Nakato",
    gender: "Female",
    dateOfBirth: new Date("2005-07-24"),
    email: "sarah.nakato@student.bugemauniv.ac.ug",
    phone: "+256 772 332 418",
    nationality: "Ugandan",
    programme: "BSc. Information Technology",
    department: "Computing & Informatics",
    yearOfStudy: 1,
    semester: "Semester II",
    academicStatus: "Active",
    tuitionStatus: "Partial",
    guardianName: "Mrs. Harriet Nakato",
    guardianPhone: "+256 772 332 419",
    enrolledDate: new Date("2024-08-19")
  },
  {
    regNo: "23/BBA/BU/R/0045",
    fullName: "David Ochieng",
    gender: "Male",
    dateOfBirth: new Date("2003-01-30"),
    email: "david.ochieng@student.bugemauniv.ac.ug",
    phone: "+256 701 228 774",
    nationality: "Ugandan",
    programme: "BBA Accounting",
    department: "Business",
    yearOfStudy: 3,
    semester: "Semester I",
    academicStatus: "Active",
    tuitionStatus: "Cleared",
    guardianName: "Mr. Peter Ochieng",
    guardianPhone: "+256 701 228 775",
    enrolledDate: new Date("2023-08-21")
  },
  {
    regNo: "24/BNS/BU/R/0021",
    fullName: "Grace Achieng",
    gender: "Female",
    dateOfBirth: new Date("2004-11-05"),
    email: "grace.achieng@student.bugemauniv.ac.ug",
    phone: "+256 782 909 663",
    nationality: "Ugandan",
    programme: "BSc. Network Systems",
    department: "Computing & Informatics",
    yearOfStudy: 2,
    semester: "Semester II",
    academicStatus: "On Probation",
    tuitionStatus: "Pending",
    guardianName: "Ms. Agnes Achieng",
    guardianPhone: "+256 782 909 664",
    enrolledDate: new Date("2024-08-19")
  },
  {
    regNo: "22/BSE/BU/R/0008",
    fullName: "Peter Mugisha",
    gender: "Male",
    dateOfBirth: new Date("2002-05-18"),
    email: "peter.mugisha@student.bugemauniv.ac.ug",
    phone: "+256 772 640 221",
    nationality: "Ugandan",
    programme: "BSc. Software Engineering",
    department: "Computing & Informatics",
    yearOfStudy: 4,
    semester: "Semester I",
    academicStatus: "Graduated",
    tuitionStatus: "Cleared",
    guardianName: "Mr. Emmanuel Mugisha",
    guardianPhone: "+256 772 640 222",
    enrolledDate: new Date("2022-08-15")
  },
  {
    regNo: "23/BIT/BU/R/0033",
    fullName: "Faith Namubiru",
    gender: "Female",
    dateOfBirth: new Date("2003-09-09"),
    email: "faith.namubiru@student.bugemauniv.ac.ug",
    phone: "+256 701 774 550",
    nationality: "Ugandan",
    programme: "BSc. Information Technology",
    department: "Computing & Informatics",
    yearOfStudy: 3,
    semester: "Semester II",
    academicStatus: "Active",
    tuitionStatus: "Cleared",
    guardianName: "Mrs. Rose Namubiru",
    guardianPhone: "+256 701 774 551",
    enrolledDate: new Date("2023-08-21")
  },
  {
    regNo: "24/BBA/BU/R/0052",
    fullName: "Joseph Tumwine",
    gender: "Male",
    dateOfBirth: new Date("2005-02-14"),
    email: "joseph.tumwine@student.bugemauniv.ac.ug",
    phone: "+256 782 116 903",
    nationality: "Ugandan",
    programme: "BBA Accounting",
    department: "Business",
    yearOfStudy: 1,
    semester: "Semester I",
    academicStatus: "Active",
    tuitionStatus: "Pending",
    guardianName: "Mr. Charles Tumwine",
    guardianPhone: "+256 782 116 904",
    enrolledDate: new Date("2024-08-19")
  },
  {
    regNo: "23/BED/BU/R/0019",
    fullName: "Esther Nansubuga",
    gender: "Female",
    dateOfBirth: new Date("2003-06-27"),
    email: "esther.nansubuga@student.bugemauniv.ac.ug",
    phone: "+256 772 883 402",
    nationality: "Ugandan",
    programme: "BSc. Education",
    department: "Education",
    yearOfStudy: 3,
    semester: "Semester I",
    academicStatus: "Active",
    tuitionStatus: "Partial",
    guardianName: "Mrs. Beatrice Nansubuga",
    guardianPhone: "+256 772 883 403",
    enrolledDate: new Date("2023-08-21")
  },
  {
    regNo: "24/BNS/BU/R/0027",
    fullName: "Daniel Okello",
    gender: "Male",
    dateOfBirth: new Date("2004-04-03"),
    email: "daniel.okello@student.bugemauniv.ac.ug",
    phone: "+256 701 445 218",
    nationality: "Ugandan",
    programme: "BSc. Network Systems",
    department: "Computing & Informatics",
    yearOfStudy: 2,
    semester: "Semester I",
    academicStatus: "Deferred",
    tuitionStatus: "Pending",
    guardianName: "Mr. Samuel Okello",
    guardianPhone: "+256 701 445 219",
    enrolledDate: new Date("2024-08-19")
  },
  {
    regNo: "22/BBA/BU/R/0011",
    fullName: "Rehema Nakimuli",
    gender: "Female",
    dateOfBirth: new Date("2002-12-11"),
    email: "rehema.nakimuli@student.bugemauniv.ac.ug",
    phone: "+256 772 990 337",
    nationality: "Ugandan",
    programme: "BBA Accounting",
    department: "Business",
    yearOfStudy: 4,
    semester: "Semester II",
    academicStatus: "Graduated",
    tuitionStatus: "Cleared",
    guardianName: "Mrs. Sarah Nakimuli",
    guardianPhone: "+256 772 990 338",
    enrolledDate: new Date("2022-08-15")
  },
  {
    regNo: "23/BSE/BU/R/0040",
    fullName: "Samuel Kato",
    gender: "Male",
    dateOfBirth: new Date("2003-03-22"),
    email: "samuel.kato@student.bugemauniv.ac.ug",
    phone: "+256 782 330 145",
    nationality: "Ugandan",
    programme: "BSc. Software Engineering",
    department: "Computing & Informatics",
    yearOfStudy: 3,
    semester: "Semester II",
    academicStatus: "Suspended",
    tuitionStatus: "Pending",
    guardianName: "Mr. David Kato",
    guardianPhone: "+256 782 330 146",
    enrolledDate: new Date("2023-08-21")
  },
  {
    regNo: "24/BED/BU/R/0060",
    fullName: "Mary Apio",
    gender: "Female",
    dateOfBirth: new Date("2005-10-08"),
    email: "mary.apio@student.bugemauniv.ac.ug",
    phone: "+256 701 662 889",
    nationality: "Ugandan",
    programme: "BSc. Education",
    department: "Education",
    yearOfStudy: 1,
    semester: "Semester II",
    academicStatus: "Active",
    tuitionStatus: "Cleared",
    guardianName: "Mrs. Grace Apio",
    guardianPhone: "+256 701 662 890",
    enrolledDate: new Date("2024-08-19")
  }
];

async function seedDatabase() {
  const usersToSeed = buildInitialUsers();
  for (const user of usersToSeed) {
    const existing = await User.findOne({ email: user.email });
    if (!existing) {
      await User.create(user);
      console.log(`Seeded user: ${user.email} (${user.role})`);
    }
  }

  const studentCount = await Student.countDocuments();
  if (studentCount === 0) {
    const seeded = await Student.insertMany(SEED_STUDENTS);
    console.log(`Seeded ${seeded.length} student records.`);
  }

  const auditCount = await AuditLog.countDocuments();
  if (auditCount === 0) {
    const registrar = usersToSeed.find((user) => user.role === "Registrar") || usersToSeed[0];
    const accounts = usersToSeed.find((user) => user.role === "Accounts") || registrar;
    const students = await Student.find().limit(2).select("regNo fullName");
    await AuditLog.insertMany([
      {
        actorEmail: registrar.email,
        actorRole: registrar.role,
        action: "CREATE",
        targetRecord: students[0]?.regNo || "sample",
        details: "Seeded initial student record",
        timestamp: new Date(Date.now() - 86400000 * 2)
      },
      {
        actorEmail: accounts.email,
        actorRole: accounts.role,
        action: "PAYMENT",
        targetRecord: students[1]?.regNo || "sample",
        details: "Recorded seed tuition payment",
        timestamp: new Date(Date.now() - 86400000)
      }
    ]);
    console.log("Seeded initial audit log entries.");
  }
}

if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bugemadesk";
  mongoose
    .connect(MONGODB_URI)
    .then(() => seedDatabase())
    .then(() => mongoose.connection.close())
    .then(() => {
      console.log("Seeding complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err.message);
      process.exit(1);
    });
}

module.exports = { seedDatabase, SEED_STUDENTS, USERS, buildInitialUsers };