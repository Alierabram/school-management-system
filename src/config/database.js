const mongoose = require('mongoose');

async function connectDatabase() {
  mongoose.set('bufferCommands', false);
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_management', {
    serverSelectionTimeoutMS: 10000
  });
  await mongoose.connection.collection('fees').updateMany(
    { amountPaid: { $gt: 0 }, payments: { $exists: false } },
    [{
      $set: {
        payments: [{
          amount: '$amountPaid',
          date: { $ifNull: ['$paymentDate', '$$NOW'] },
          paymentMethod: { $ifNull: ['$paymentMethod', 'Cash'] },
          reference: { $ifNull: ['$reference', ''] }
        }]
      }
    }, {
      $unset: ['amountPaid', 'paymentDate', 'paymentMethod', 'reference', 'status']
    }]
  );
  console.log('Connected to MongoDB.');
}

module.exports = connectDatabase;
