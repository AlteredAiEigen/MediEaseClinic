"""
AI service for generating clinical notes from transcripts.
Supports both OpenAI and Google Gemini.
"""

import logging
from typing import Dict, Optional
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered clinical note generation."""
    
    def __init__(self):
        """Initialize AI service with available provider."""
        self.provider = None
        self.client = None
        
        # Try OpenAI first
        if settings.openai_api_key:
            try:
                import openai
                self.client = openai.OpenAI(api_key=settings.openai_api_key)
                self.provider = "openai"
                logger.info("Initialized OpenAI for clinical notes")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI: {e}")
        
        # Fallback to Gemini
        if not self.provider and settings.gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.gemini_api_key)
                self.client = genai.GenerativeModel(settings.gemini_model)
                self.provider = "gemini"
                logger.info("Initialized Gemini for clinical notes")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")
        
        if not self.provider:
            logger.warning("No AI provider available. Clinical notes will require manual input.")
    
    async def generate_clinical_notes(self, transcript: str, patient_context: Optional[str] = None) -> Dict:
        """
        Generate structured clinical notes from consultation transcript.
        
        Args:
            transcript: Consultation transcript text
            patient_context: Optional patient medical history context
        
        Returns:
            Dict with structured clinical note fields
        """
        if not self.provider:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY"
            )
        
        try:
            prompt = self._build_clinical_notes_prompt(transcript, patient_context)
            
            if self.provider == "openai":
                return await self._generate_with_openai(prompt)
            elif self.provider == "gemini":
                return await self._generate_with_gemini(prompt)
        
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate clinical notes: {str(e)}"
            )
    
    def _build_clinical_notes_prompt(self, transcript: str, patient_context: Optional[str] = None) -> str:
        """Build prompt for clinical note generation."""
        prompt = f"""You are a medical AI assistant. Analyze this doctor-patient consultation transcript and extract structured clinical information.

Consultation Transcript:
{transcript}
"""
        
        if patient_context:
            prompt += f"\nPatient Medical History Context:\n{patient_context}\n"
        
        prompt += """
Please extract and format the following information in JSON format:

{
  "chiefComplaint": "Main reason for visit",
  "symptoms": ["list", "of", "symptoms"],
  "diagnosis": "Preliminary or confirmed diagnosis",
  "treatmentPlan": "Recommended treatment plan",
  "prescriptions": [
    {
      "medication": "name",
      "dosage": "dosage",
      "frequency": "frequency",
      "duration": "duration",
      "instructions": "special instructions"
    }
  ],
  "recommendations": "Doctor's recommendations",
  "followUpRequired": true/false,
  "followUpDate": "suggested follow-up date or null",
  "notes": "Additional clinical notes"
}

Important:
- Be accurate and professional
- Only extract information explicitly mentioned
- Use medical terminology appropriately
- If information is not available, use null or empty string
- Format prescriptions as a list even if single medication
"""
        
        return prompt
    
    async def _generate_with_openai(self, prompt: str) -> Dict:
        """Generate clinical notes using OpenAI."""
        try:
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You are a medical AI assistant specializing in clinical documentation."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent medical output
                response_format={"type": "json_object"}
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            
            logger.info("Successfully generated clinical notes with OpenAI")
            return result
        
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise
    
    async def _generate_with_gemini(self, prompt: str) -> Dict:
        """Generate clinical notes using Google Gemini."""
        try:
            response = self.client.generate_content(prompt)
            
            # Extract JSON from response
            import json
            import re
            
            # Try to find JSON in response
            text = response.text
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            
            if json_match:
                result = json.loads(json_match.group())
            else:
                # Fallback: parse as best as possible
                result = {
                    "chiefComplaint": "",
                    "symptoms": [],
                    "diagnosis": "",
                    "treatmentPlan": text,
                    "prescriptions": [],
                    "recommendations": "",
                    "followUpRequired": False,
                    "followUpDate": None,
                    "notes": text
                }
            
            logger.info("Successfully generated clinical notes with Gemini")
            return result
        
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise
    
    async def summarize_medical_history(self, medical_history: str) -> str:
        """
        Summarize patient's medical history.
        
        Args:
            medical_history: Full medical history text
        
        Returns:
            Concise summary
        """
        if not self.provider:
            return medical_history
        
        try:
            prompt = f"""Summarize the following patient medical history in 2-3 concise sentences, highlighting key conditions, medications, and risk factors:

{medical_history}

Summary:"""
            
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": "You are a medical AI assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=200
                )
                return response.choices[0].message.content.strip()
            
            elif self.provider == "gemini":
                response = self.client.generate_content(prompt)
                return response.text.strip()
        
        except Exception as e:
            logger.error(f"History summarization failed: {e}")
            return medical_history


# Global AI service instance
ai_service = AIService()

