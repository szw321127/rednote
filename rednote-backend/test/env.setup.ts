process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-1234567890-1234567890';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'test-jwt-refresh-secret-1234567890-1234567890';
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || 'test-session-secret-1234567890-1234567890';
