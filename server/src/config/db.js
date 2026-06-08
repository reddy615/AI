const mongoose = require('mongoose');

async function connectDB() {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-interview';
  
  const isAtlas = primaryUri.includes('mongodb+srv');
  const sanitizedUri = primaryUri.replace(/:[^:@]*@/, ':***@'); // hide password
  const hostname = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB';
  
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
    await mongoose.connect(primaryUri, connectionOptions);
    return { success: true, message: 'Connected to MongoDB' };
  } catch (error) {
    console.error('[db.js] MongoDB connection failed:', error.message);
    throw error;
  }
}

mongoose.connection.on('error', (error) => {
  console.error('[mongoose] MongoDB connection error:', error.message);
});

module.exports = connectDB;
