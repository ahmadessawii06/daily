import mongoose from 'mongoose';

// Disable command buffering so queries fail-fast when DB is offline instead of hanging
mongoose.set('bufferCommands', false);
// With buffering disabled, models must not create collections before connect().
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);

let authFailed = false;

function getMongoUri(): string | null {
  const uri = (process.env.MONGODB_URI || '').trim();
  if (!uri) return null;

  // Ignore placeholder strings
  if (
    uri.includes('<username>') ||
    uri.includes('<password>') ||
    uri.includes('<db_password>') ||
    uri.includes('<cluster>') ||
    uri.includes('<dbname>')
  ) {
    return null;
  }

  return uri;
}

let connectionPromise: Promise<typeof mongoose | null> | null = null;
let lastError: string | null = null;

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDbLastError(): string | null {
  return lastError;
}

// Fixed messages keep connection credentials out of server logs.
export function describeDbFailure(err: any): string {
  const details = `${err?.code || err?.cause?.code || ''} ${err?.message || ''}`.toLowerCase();
  if (err?.code === 18 || /bad auth|authentication failed|authenticationfailed/.test(details))
    return 'Authentication failed: check Atlas database username and password';
  if (/enotfound|eai_again|querysrv|querytxt/.test(details))
    return 'DNS lookup failed: check Atlas cluster hostname and DNS availability';
  if (err?.name === 'MongoParseError' || /invalid connection string|invalid scheme|uri malformed/.test(details))
    return 'Invalid MongoDB URI: check connection string and encode password special characters';
  if (/tls|ssl|certificate/.test(details))
    return 'TLS connection failed: check cluster TLS configuration';
  if (/ServerSelectionError$/.test(err?.name || '') || /etimedout|econnrefused|econnreset/.test(details))
    return 'Cluster unreachable: check Atlas Network Access, cluster status and connectivity';
  return 'MongoDB connection failed: check cluster configuration';
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (mongoose.connection.readyState === 1) {
    lastError = null;
    return mongoose;
  }

  if (authFailed) {
    return null;
  }

  const uri = getMongoUri();
  if (!uri) {
    lastError = 'MongoDB URI not set - operating in persistent local file database mode';
    return null;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
    }).then(() => {
      lastError = null;
      authFailed = false;
      return mongoose;
    });

    return await connectionPromise;
  } catch (err: any) {
    lastError = describeDbFailure(err);
    if (lastError.startsWith('Authentication failed:')) {
      authFailed = true;
    }
    return null;
  } finally {
    connectionPromise = null;
  }
}
