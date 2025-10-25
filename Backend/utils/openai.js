const OpenAI = require('openai');

// Lazy initialize OpenAI client
let openai = null;

const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
};

/**
 * Extract structured clinical data from transcript
 * @param {string} transcript - Recording transcript
 * @returns {Promise<Object>} - Extracted clinical data
 */
const extractClinicalDataFromTranscript = async (transcript) => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is required');
    }

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
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI assistant that extracts structured clinical data from transcripts. Always return valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    // Parse JSON response
    const clinicalData = JSON.parse(content);
    
    return {
      success: true,
      data: clinicalData
    };
  } catch (error) {
    console.error('OpenAI extract clinical data error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Generate treatment plan based on symptoms and diagnosis
 * @param {string} symptoms - Patient symptoms
 * @param {string} diagnosis - Diagnosis
 * @returns {Promise<Object>} - Generated treatment plan
 */
const generateTreatmentPlan = async (symptoms, diagnosis) => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    if (!symptoms || !diagnosis) {
      throw new Error('Symptoms and diagnosis are required');
    }

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
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI assistant. Provide treatment suggestions for educational purposes only. Always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    const treatmentPlan = JSON.parse(content);
    
    return {
      success: true,
      data: treatmentPlan
    };
  } catch (error) {
    console.error('OpenAI generate treatment plan error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Generate prescription from clinical notes
 * @param {Object} clinicalNote - Clinical note object
 * @returns {Promise<Object>} - Generated prescription
 */
const generatePrescriptionFromNotes = async (clinicalNote) => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    if (!clinicalNote) {
      throw new Error('Clinical note is required');
    }

    const { diagnosis, currentSymptoms, treatmentPlan } = clinicalNote;

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
]`;

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI assistant. Generate prescription suggestions for educational purposes only. Always return valid JSON array only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    const medications = JSON.parse(content);
    
    return {
      success: true,
      data: medications
    };
  } catch (error) {
    console.error('OpenAI generate prescription error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Summarize clinical consultation
 * @param {string} transcript - Full consultation transcript
 * @returns {Promise<Object>} - Summary
 */
const summarizeConsultation = async (transcript) => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is required');
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI assistant. Create concise, professional clinical summaries.'
        },
        {
          role: 'user',
          content: `Summarize the following medical consultation in 2-3 concise paragraphs:\n\n${transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const summary = response.choices[0].message.content;
    
    return {
      success: true,
      data: summary
    };
  } catch (error) {
    console.error('OpenAI summarize consultation error:', error);
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

