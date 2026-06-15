const { verifyPin, issueSessionToken } = require('./utils/auth');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { pin, type } = req.body || {};

  if (!pin || !type) {
    return res.status(400).json({ error: 'PIN and access type are required.' });
  }

  if (type !== 'upload' && type !== 'viewer') {
    return res.status(400).json({ error: 'Invalid access type.' });
  }

  const isValid = verifyPin(pin, type);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  try {
    const token = issueSessionToken(type);
    const responseData = { success: true, token };
    
    // Pass the database URL to the viewer client for dynamic Firebase initialization
    if (type === 'viewer') {
      responseData.databaseUrl = process.env.FIREBASE_DB_URL;
    }
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Session signing error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
