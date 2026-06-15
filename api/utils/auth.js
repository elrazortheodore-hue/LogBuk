const jwt = require('jsonwebtoken');

const SESSION_SECRET = process.env.SESSION_SECRET;
const UPLOAD_PIN = process.env.UPLOAD_PIN;
const VIEWER_PIN = process.env.VIEWER_PIN;

function verifyPin(pin, type) {
  if (type === 'upload') {
    return pin === UPLOAD_PIN;
  } else if (type === 'viewer') {
    return pin === VIEWER_PIN;
  }
  return false;
}

function issueSessionToken(type) {
  if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not configured on the server.');
  }
  // Sessions expire strictly in 10 minutes (600 seconds)
  return jwt.sign({ type }, SESSION_SECRET, { expiresIn: '10m' });
}

function verifySessionToken(token, expectedType) {
  if (!token || !SESSION_SECRET) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, SESSION_SECRET);
    if (decoded && decoded.type === expectedType) {
      return decoded;
    }
  } catch (error) {
    console.error('Session validation error:', error.message);
  }
  return null;
}

module.exports = {
  verifyPin,
  issueSessionToken,
  verifySessionToken
};
