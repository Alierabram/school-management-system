require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const { admins } = require('./src/models');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test');
    
    const adminData = {
      email: 'admin@school.com',
      name: 'School Administrator',
      passwordHash: await bcryptjs.hash('Admin@1234', 10),
      role: 'ADMIN'
    };
    
    const admin = await admins.findOneAndUpdate(
      { email: 'admin@school.com' },
      adminData,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    
    console.log('Admin user created/updated successfully');
    console.log('Email: admin@school.com');
    console.log('Role: ADMIN');
    
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();