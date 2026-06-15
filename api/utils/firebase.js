const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

async function writeLogToFirebase(logData) {
  if (!FIREBASE_DB_URL) {
    throw new Error('Firebase database URL environment variable is missing.');
  }

  // Ensure there are no trailing slashes on our DB URL
  const baseUrl = FIREBASE_DB_URL.endsWith('/') 
    ? FIREBASE_DB_URL.slice(0, -1) 
    : FIREBASE_DB_URL;

  const url = FIREBASE_SECRET 
    ? `${baseUrl}/logs.json?auth=${FIREBASE_SECRET}`
    : `${baseUrl}/logs.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(logData)
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Firebase write operation failed: ${response.status} - ${errorMsg}`);
  }

  const result = await response.json();
  return result;
}

module.exports = {
  writeLogToFirebase
};
