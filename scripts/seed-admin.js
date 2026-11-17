require('dotenv').config();
const crypto = require('crypto');
const { promisify } = require('util');
const mongoose = require('mongoose');
const { admins, students } = require('../src/models');

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

async function seedAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const name = String(process.env.ADMIN_NAME || 'School Administrator').trim();
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env before seeding.');
  }
  await admins.findOneAndUpdate(
    { email },
    { email, name, passwordHash: await hashPassword(password), role: 'ADMIN', $unset: { studentId: 1 } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  console.log(`Administrator ready: ${email}`);
}

async function seedStudent() {
  const email = String(process.env.STUDENT_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.STUDENT_PASSWORD || '');
  const admissionNo = String(process.env.STUDENT_ADMISSION_NO || '').trim();
  if (!email) return; // student seeding is optional
  if (!password || password.length < 8) {
    throw new Error('STUDENT_EMAIL is set, so STUDENT_PASSWORD must be at least 8 characters.');
  }
  if (!admissionNo) {
    throw new Error('STUDENT_EMAIL is set, so STUDENT_ADMISSION_NO must reference an existing student record.');
  }
  const student = await students.findOne({ admissionNo });
  if (!student) {
    throw new Error(`No student found with admission number "${admissionNo}". Create the student in the Students module first, then run the seed again.`);
  }
  const name = `${student.firstName} ${student.lastName}`.trim();
  await admins.findOneAndUpdate(
    { email },
    { email, name, passwordHash: await hashPassword(password), role: 'STUDENT', studentId: student._id },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  console.log(`Student login ready: ${email}  →  ${admissionNo} (${name})`);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_management');
  await seedAdmin();
  await seedStudent();
}

main()
  .catch(error => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
