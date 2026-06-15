const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retry } = require('./retry');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

async function extractLogData(base64Image, mimeType) {
  if (!genAI) {
    throw new Error('Gemini API credentials are not configured on the server.');
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType
    }
  };

  const prompt = `
Analyze the entire document page in the provided image.
Perform the following extraction steps to convert it into structured records:
1. Detect all table columns and detect all rows.
2. Infer any unclear column headers from row contents.
3. Create intelligent, descriptive header names when headers are missing or unclear.
4. Normalize inconsistent spacing in the values, while preserving their original meaning and details.
5. Extract handwriting, printed text, numbers, and dates accurately.
6. If a cell contains no value, set it as an empty string.

You must output valid JSON matching the following schema:
{
  "headers": ["HeaderName1", "HeaderName2", "HeaderName3", ...],
  "rows": [
    {
      "HeaderName1": "row 1 value 1",
      "HeaderName2": "row 1 value 2",
      "HeaderName3": "row 1 value 3"
    },
    ...
  ]
}

Only return a JSON object that adheres strictly to this structure. Do not wrap the JSON object inside markdown backticks.
  `.trim();

  // Retry the content generation API call up to 3 times to handle rate limits or transient Google API failures
  const text = await retry(async () => {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  }, 3, 1500);

  // Clean the text from markdown code blocks in case Gemini ignored the prompt instructions
  let cleanedText = text.trim();
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```[a-zA-Z]*\n/, "");
    cleanedText = cleanedText.replace(/\n```$/, "");
    cleanedText = cleanedText.trim();
  }

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini failed to return valid JSON. Response text was:", text);
    throw new Error("Intelligent extraction could not parse the document structure correctly.");
  }
}

module.exports = {
  extractLogData
};
