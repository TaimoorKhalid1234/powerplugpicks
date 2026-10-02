-- Better Auth 1.7 authentication schema. Dates use epoch milliseconds.
CREATE TABLE IF NOT EXISTS user (
 id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL COLLATE NOCASE UNIQUE,
 emailVerified INTEGER NOT NULL DEFAULT 0, image TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
 role TEXT NOT NULL DEFAULT 'AUTHOR' CHECK(role IN ('OWNER','ADMIN','EDITOR','AUTHOR','ANALYST')),
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), twoFactorEnabled INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS session (
 id TEXT PRIMARY KEY NOT NULL, expiresAt INTEGER NOT NULL, token TEXT NOT NULL UNIQUE,
 createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, ipAddress TEXT, userAgent TEXT,
 userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS session_user_idx ON session(userId);
CREATE TABLE IF NOT EXISTS account (
 id TEXT PRIMARY KEY NOT NULL, accountId TEXT NOT NULL, providerId TEXT NOT NULL,
 userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
 accessToken TEXT, refreshToken TEXT, idToken TEXT, accessTokenExpiresAt INTEGER,
 refreshTokenExpiresAt INTEGER, scope TEXT, password TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS account_user_idx ON account(userId);
CREATE TABLE IF NOT EXISTS verification (
 id TEXT PRIMARY KEY NOT NULL, identifier TEXT NOT NULL, value TEXT NOT NULL,
 expiresAt INTEGER NOT NULL, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);
CREATE TABLE IF NOT EXISTS twoFactor (
 id TEXT PRIMARY KEY NOT NULL, secret TEXT NOT NULL, backupCodes TEXT NOT NULL,
 userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, verified INTEGER DEFAULT 1,
 failedVerificationCount INTEGER DEFAULT 0, lockedUntil INTEGER
);
CREATE INDEX IF NOT EXISTS two_factor_user_idx ON twoFactor(userId);
CREATE TABLE IF NOT EXISTS rateLimit (
 id TEXT PRIMARY KEY NOT NULL, key TEXT NOT NULL UNIQUE, count INTEGER NOT NULL, lastRequest INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS bootstrap_lock (
 id INTEGER PRIMARY KEY CHECK(id = 1), claim TEXT NOT NULL, createdAt INTEGER NOT NULL, completedAt INTEGER
);
