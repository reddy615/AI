const mongoose = require('mongoose');

async function connectDB() {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-interview';
  const fallbackUri = 'mongodb://127.0.0.1:27017/ai-interview';

  try {
    await mongoose.connect(primaryUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connected (${primaryUri.includes('mongodb+srv') ? 'atlas' : 'local'})`);
    return;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    if (primaryUri === fallbackUri) {
      throw error;
    }

    console.warn('Primary MongoDB connection failed, trying local MongoDB fallback:', error.message);
    await mongoose.connect(fallbackUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected (local fallback)');
  }
}

module.exports = connectDB;
