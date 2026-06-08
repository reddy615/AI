const mongoose = require('mongoose');

async function connectDB() {
  console.log('Mongo URI exists:', !!process.env.MONGO_URI);

  const primaryUri = process.env.MONGO_URI;
  if (!primaryUri) {
    throw new Error('MONGO_URI is not set in the environment');
  }

  const isAtlas = primaryUri.includes('mongodb+srv');

  const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 60000,
    maxPoolSize: 10,
    minPoolSize: 2,
  };

  // For Atlas SRV, TLS is implicit. Do not explicitly set tls=true
  if (isAtlas) {
    connectionOptions.retryWrites = true;
    connectionOptions.directConnection = false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    console.log('MongoDB Connected');
    return { success: true, message: 'Connected to MongoDB' };
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    throw error;
  }
}

mongoose.connection.on('error', (error) => {
  console.error('[mongoose] MongoDB connection error:', error.message);
});

module.exports = connectDB;
