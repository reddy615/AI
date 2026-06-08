const mongoose = require('mongoose');

function parseMongoUri(uri) {
  // Basic parse without exposing credentials
  // Expect format: mongodb[s]://[user:pass@]host1[,host2...][/dbname][?options]
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  const protocolMatch = trimmed.match(/^(mongodb(\+srv)?):\/\/(.*)$/i);
  if (!protocolMatch) return null;
  const protocol = protocolMatch[1];
  const rest = protocolMatch[3]; // userinfo@hosts/... or hosts/...

  // split off database and options
  const slashIndex = rest.indexOf('/');
  const hostsAndAuth = slashIndex === -1 ? rest : rest.slice(0, slashIndex);
  const afterSlash = slashIndex === -1 ? '' : rest.slice(slashIndex + 1);
  const [dbPartAndQuery] = [afterSlash];

  // host portion may contain userinfo before @
  const atIndex = hostsAndAuth.lastIndexOf('@');
  const hostPart = atIndex === -1 ? hostsAndAuth : hostsAndAuth.slice(atIndex + 1);

  // first host
  const hosts = hostPart.split(',').map((h) => h.trim()).filter(Boolean);
  const clusterHost = hosts.length ? hosts[0] : null;

  // db name before ?
  let dbName = null;
  if (dbPartAndQuery) {
    const qIndex = dbPartAndQuery.indexOf('?');
    dbName = qIndex === -1 ? dbPartAndQuery : dbPartAndQuery.slice(0, qIndex);
    dbName = dbName || null;
  }

  // extract authSource if present in query
  let authSource = null;
  if (dbPartAndQuery) {
    const qIndex = dbPartAndQuery.indexOf('?');
    const query = qIndex === -1 ? '' : dbPartAndQuery.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    if (params.has('authSource')) authSource = params.get('authSource');
  }

  return {
    protocol,
    clusterHost,
    dbName,
    authSource,
    raw: trimmed,
  };
}

function validateMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return { valid: false, reason: 'MONGO_URI is empty or not a string' };
  const trimmed = uri.trim();
  // Must start with mongodb:// or mongodb+srv://
  if (!/^mongodb(\+srv)?:\/\//i.test(trimmed)) return { valid: false, reason: 'Protocol must be mongodb:// or mongodb+srv://' };

  // Check for duplicate @ (more than one) in the credentials/hosts area
  const protocolRemoved = trimmed.replace(/^mongodb(\+srv)?:\/\//i, '');
  const beforeSlash = protocolRemoved.split('/')[0];
  const atCount = (beforeSlash.match(/@/g) || []).length;
  if (atCount > 1) return { valid: false, reason: 'Malformed URI: multiple @ symbols detected' };

  // detect whitespace/newline
  if (/\s/.test(trimmed)) return { valid: false, reason: 'Whitespace detected in MONGO_URI' };

  // If credentials present, ensure colon separates user and pass
  const credMatch = beforeSlash.match(/^(.*@)/);
  if (credMatch) {
    const userinfo = beforeSlash.split('@')[0];
    if (userinfo && !userinfo.includes(':')) return { valid: false, reason: 'Malformed credentials in URI (missing colon between user and password)' };
    const password = userinfo.split(':')[1] || '';
    if (/[\s@]/.test(password)) return { valid: false, reason: 'Unencoded characters in password' };
  }

  return { valid: true };
}

async function connectDB() {
  console.log('Mongo URI exists:', !!process.env.MONGO_URI);

  const primaryUri = process.env.MONGO_URI;
  if (!primaryUri) {
    throw new Error('MONGO_URI is not set in the environment');
  }

  const validation = validateMongoUri(primaryUri);
  if (!validation.valid) {
    console.error('MONGO_URI validation failed:', validation.reason);
    throw new Error(`MONGO_URI validation failed: ${validation.reason}`);
  }

  const parsed = parseMongoUri(primaryUri);
  const isAtlas = parsed && parsed.protocol && parsed.protocol.toLowerCase().includes('srv');

  const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 60000,
    maxPoolSize: 10,
    minPoolSize: 2,
  };

  if (isAtlas) {
    connectionOptions.retryWrites = true;
    connectionOptions.directConnection = false;
  }

  try {
    await mongoose.connect(primaryUri, connectionOptions);
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

function getDiagnostics() {
  const readyState = mongoose.connection.readyState;
  const parsed = parseMongoUri(process.env.MONGO_URI || '');
  const clusterHost = parsed?.clusterHost || null;
  const dbName = parsed?.dbName || null;
  const authSource = parsed?.authSource || null;

  // Railway env presence heuristic
  const railwayLoaded = Object.keys(process.env).some((k) => k.startsWith('RAILWAY_')) || Boolean(process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_ENV);

  return {
    connected: readyState === 1,
    readyState,
    clusterHost,
    dbName,
    authSource,
    railwayEnvDetected: railwayLoaded,
  };
}

module.exports = connectDB;
module.exports.getDiagnostics = getDiagnostics;
module.exports.parseMongoUri = parseMongoUri;
module.exports.validateMongoUri = validateMongoUri;
