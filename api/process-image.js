const { verifySessionToken } = require('./utils/auth');
const { uploadToCloudinary } = require('./utils/cloudinary');
const { extractLogData } = require('./utils/gemini');
const { writeLogToFirebase } = require('./utils/firebase');

module.exports = async (req, res) => {
  // Only allow POST requests for security and data processing
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Verify session token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Missing token.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifySessionToken(token, 'upload');
  if (!decoded) {
    return res.status(401).json({ error: 'Session expired or invalid PIN.' });
  }

  // 2. Validate input image payload
  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: 'Missing image payload' });
  }

  // 3. Extract base64 details and MIME type
  let base64Data = image;
  let mimeType = 'image/jpeg';
  if (image.startsWith('data:')) {
    const parts = image.match(/^data:([^;]+);base64,(.*)$/);
    if (parts) {
      mimeType = parts[1];
      base64Data = parts[2];
    } else {
      return res.status(400).json({ error: 'Invalid base64 image format.' });
    }
  }

  try {
    // 4. Archive image to Cloudinary
    // We pass the full base64 data URI format so Cloudinary uploader parses it correctly.
    const fullBase64Uri = image.startsWith('data:') ? image : `data:${mimeType};base64,${base64Data}`;
    const imageUrl = await uploadToCloudinary(fullBase64Uri);

    // 5. Intelligent Document Processing via Gemini 2.5 Flash
    let extractedData;
    try {
      extractedData = await extractLogData(base64Data, mimeType);
    } catch (geminiError) {
      console.error('Gemini extraction failure:', geminiError);
      return res.status(422).json({ error: 'Processing could not be completed.' });
    }

    // Validate extracted data format is correct
    if (!extractedData || !Array.isArray(extractedData.headers) || !Array.isArray(extractedData.rows)) {
      console.error('Invalid extraction data schema returned:', extractedData);
      return res.status(422).json({ error: 'Processing could not be completed.' });
    }

    // 6. Write records to Firebase Realtime Database
    const logRecord = {
      headers: extractedData.headers,
      rows: extractedData.rows,
      imageUrl: imageUrl,
      createdAt: new Date().toISOString()
    };

    try {
      await writeLogToFirebase(logRecord);
    } catch (firebaseError) {
      console.error('Firebase DB write failure:', firebaseError);
      return res.status(502).json({ error: 'Upload failed. Please try again.' });
    }

    // Return the response containing structured records
    return res.status(200).json({
      success: true,
      headers: logRecord.headers,
      rows: logRecord.rows,
      imageUrl: logRecord.imageUrl
    });

  } catch (error) {
    console.error('General pipeline processing failure:', error);
    return res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
};
