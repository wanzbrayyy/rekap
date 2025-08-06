const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database Connected');
  } catch (err) {
    console.error('❌ DB Error:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
