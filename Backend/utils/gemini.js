const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract structured clinical data from transcript using Gemini
 * @param {string} transcript - Recording transcript
 * @returns {Promise<Object>} - Extracted clinical data
 */
const extractClinicalDataFromTranscript = async (transcript) => {
  try {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is required');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a medical AI assistant specialized in extracting structured clinical information from doctor-patient consultation transcripts.

Analyze the following medical consultation transcript and extract structured information in JSON format:

Transcript:
"""
${transcript}
"""

Extract and return ONLY a valid JSON object with the following structure (use null for missing information):
{
  "chiefComplaint": "Brief description of main complaint",
  "currentSymptoms": "List of current symptoms",
  "painLevel": "Pain level 0-10 if mentioned",
  "vitals": {
    "bloodPressure": "BP reading if mentioned",
    "heartRate": "Heart rate if mentioned",
    "temperature": "Temperature if mentioned",
    "oxygenSaturation": "O2 saturation if mentioned"
  },
  "diagnosis": "Preliminary or final diagnosis",
  "treatmentPlan": "Recommended treatment plan",
  "recommendations": "General recommendations and advice",
  "prescriptions": [
    {
      "name": "Medication name",
      "dosage": "Dosage amount",
      "frequency": "How often to take",
      "duration": "How long to take",
      "instructions": "Special instructions"
    }
  ],
  "followUp": "Follow-up instructions if any"
}

Return ONLY the JSON object, no additional text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const clinicalData = JSON.parse(text);
    
    return {
      success: true,
      data: clinicalData
    };
  } catch (error) {
    console.error('Gemini extract clinical data error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Generate treatment plan based on symptoms and diagnosis using Gemini
 * @param {string} symptoms - Patient symptoms
 * @param {string} diagnosis - Diagnosis
 * @returns {Promise<Object>} - Generated treatment plan
 */
const generateTreatmentPlan = async (symptoms, diagnosis) => {
  try {
    if (!symptoms || !diagnosis) {
      throw new Error('Symptoms and diagnosis are required');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Based on the following clinical information, suggest a comprehensive treatment plan:

Symptoms: ${symptoms}
Diagnosis: ${diagnosis}

Provide a detailed treatment plan in JSON format:
{
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Recommended dosage",
      "frequency": "Frequency of administration",
      "duration": "Treatment duration",
      "purpose": "Why this medication"
    }
  ],
  "lifestyle": [
    "Lifestyle recommendation 1",
    "Lifestyle recommendation 2"
  ],
  "dietary": [
    "Dietary advice 1",
    "Dietary advice 2"
  ],
  "precautions": [
    "Precaution 1",
    "Precaution 2"
  ],
  "followUp": "Follow-up schedule recommendation"
}

Return ONLY the JSON object, no additional text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const treatmentPlan = JSON.parse(text);
    
    return {
      success: true,
      data: treatmentPlan
    };
  } catch (error) {
    console.error('Gemini generate treatment plan error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Generate prescription from clinical notes using Gemini
 * @param {Object} clinicalNote - Clinical note object
 * @returns {Promise<Object>} - Generated prescription
 */
const generatePrescriptionFromNotes = async (clinicalNote) => {
  try {
    if (!clinicalNote) {
      throw new Error('Clinical note is required');
    }

    const { diagnosis, currentSymptoms, treatmentPlan } = clinicalNote;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Based on the following clinical information, generate appropriate medication prescriptions:

Diagnosis: ${diagnosis || 'Not specified'}
Symptoms: ${currentSymptoms || 'Not specified'}
Treatment Plan: ${treatmentPlan || 'Not specified'}

Generate a JSON array of medications:
[
  {
    "name": "Medication name",
    "dosage": "Specific dosage (e.g., 500mg)",
    "frequency": "How often (e.g., Twice daily)",
    "duration": "How long (e.g., 7 days)",
    "instructions": "Special instructions (e.g., Take after meals)"
  }
]

Return ONLY the JSON array, no additional text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const medications = JSON.parse(text);
    
    return {
      success: true,
      data: medications
    };
  } catch (error) {
    console.error('Gemini generate prescription error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Summarize clinical consultation using Gemini
 * @param {string} transcript - Full consultation transcript
 * @returns {Promise<Object>} - Summary
 */
const summarizeConsultation = async (transcript) => {
  try {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is required');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Summarize the following medical consultation in 2-3 concise paragraphs. Be professional and accurate:\n\n${transcript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    return {
      success: true,
      data: summary
    };
  } catch (error) {
    console.error('Gemini summarize consultation error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

module.exports = {
  extractClinicalDataFromTranscript,
  generateTreatmentPlan,
  generatePrescriptionFromNotes,
  summarizeConsultation
};

