const mongoose = require('mongoose');

async function connectDB() {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-interview';

  await mongoose.connect(primaryUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`MongoDB connected (${primaryUri.includes('mongodb+srv') ? 'atlas' : 'local'})`);
}

module.exports = connectDB;
