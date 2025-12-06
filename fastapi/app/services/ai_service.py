"""
AI service for generating clinical notes from transcripts.
Supports both OpenAI and Google Gemini.
"""

import logging
from datetime import datetime
from typing import Dict, Optional, Any
import json
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
    
    async def generate_response(
        self,
        prompt: str,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        Generate a raw text response from the configured AI provider.

        Used by downstream services that expect free-form JSON/text outputs.
        """
        if not self.provider:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY",
            )
        
        system_prompt = system_prompt or "You are MediEase Clinic's clinical documentation assistant."
        target_model = model or settings.openai_model
        
        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model=target_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                )
                return response.choices[0].message.content
            
            if self.provider == "gemini":
                response = self.client.generate_content(f"{system_prompt}\n\n{prompt}")
                return response.text
        
        except Exception as e:
            logger.error(f"AI response generation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate AI response: {str(e)}",
            )

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

    async def chat(self, prompt: str, context: Optional[str] = None) -> str:
        """
        General purpose medical assistant chat.

        Args:
            prompt: clinician prompt/question
            context: optional additional context to prime the model

        Returns:
            Model-generated response string
        """
        if not self.provider:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY",
            )

        composed_prompt = prompt
        if context:
            composed_prompt = (
                "Context:\n"
                f"{context}\n\n"
                "Question:\n"
                f"{prompt}"
            )

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are MediEase Clinic's medical assistant. "
                                "Provide concise, evidence-based answers and include cautions "
                                "when recommending treatments. Do not share protected health "
                                "information beyond the provided context."
                            ),
                        },
                        {"role": "user", "content": composed_prompt},
                    ],
                    temperature=0.5,
                    max_tokens=600,
                )
                return response.choices[0].message.content.strip()

            if self.provider == "gemini":
                response = self.client.generate_content(
                    (
                        "You are MediEase Clinic's medical assistant. "
                        "Provide concise, clinically relevant answers. "
                        "Cite caution when making recommendations.\n\n"
                        f"{composed_prompt}"
                    )
                )
                return response.text.strip()

        except Exception as e:
            logger.error(f"AI chat failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate AI response: {str(e)}",
            )

    async def generate_patient_insights(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI-driven patient insights used for the consultation page.

        This is used when the patient is checked in, and can be re-used after
        consultation if needed.
        """
        # Basic fallback if no AI provider is configured
        if not self.provider:
            logger.warning("No AI provider configured, using heuristic insights")

            chief_complaint = patient_data.get("chiefComplaint") or ""
            condition = patient_data.get("condition") or ""
            plan = patient_data.get("carePlanSummary") or ""

            key_findings = []
            for field in ("chiefComplaint", "currentSymptoms", "condition"):
                value = patient_data.get(field)
                if value:
                    key_findings.append(str(value))

            recommendations = []
            if plan:
                recommendations.append(str(plan))

            return {
                "riskAssessment": condition or "Risk assessment not available",
                "riskLevel": "medium",
                "successRate": patient_data.get("insights", {}).get("successRate", "N/A"),
                "keyFindings": key_findings,
                "recommendations": recommendations,
                "lastUpdatedAt": datetime.utcnow().isoformat(),
            }

        # Build a compact context for the model
        context: Dict[str, Any] = {
            "demographics": {
                "firstName": patient_data.get("firstName"),
                "lastName": patient_data.get("lastName"),
                "age": patient_data.get("age"),
                "gender": patient_data.get("gender"),
                "bloodGroup": patient_data.get("bloodGroup"),
                "dateOfBirth": patient_data.get("dateOfBirth"),
            },
            "contact": {
                "phone": patient_data.get("phone"),
                "email": patient_data.get("email"),
            },
            "clinical": {
                "allergies": patient_data.get("allergies"),
                "currentMedications": patient_data.get("currentMedications"),
                "chiefComplaint": patient_data.get("chiefComplaint"),
                "currentSymptoms": patient_data.get("currentSymptoms"),
                "condition": patient_data.get("condition"),
                "carePlanSummary": patient_data.get("carePlanSummary"),
                "followUpPlan": patient_data.get("followUpPlan"),
                "lastVisit": patient_data.get("lastVisit"),
            },
            "history": {
                # Optional longitudinal history summary prepared by the caller
                "summary": patient_data.get("historySummary"),
            },
        }

        prompt = (
            "You are MediEase Clinic's AI assistant. Analyze the following patient profile and "
            "produce concise, clinically useful insights for the doctor before a consultation.\n\n"
            "Patient data (JSON):\n"
            f"{json.dumps(context, indent=2)}\n\n"
            "Return ONLY a JSON object with the following exact keys:\n"
            "{\n"
            '  "riskAssessment": "Short sentence describing overall risk profile",\n'
            '  "riskLevel": "low" | "medium" | "high",\n'
            '  "successRate": "Estimated treatment success probability as a percentage string like \\"90%\\",\n'
            '  "keyFindings": ["bullet 1", "bullet 2", ...],\n'
            '  "recommendations": ["recommendation 1", "recommendation 2", ...]\n'
            "}\n\n"
            "Guidelines:\n"
            "- Be conservative and clinically reasonable.\n"
            "- Base your reasoning ONLY on the provided data.\n"
            "- If some fields are missing, still provide best-effort insights without hallucinating new facts.\n"
            "- Keep keyFindings and recommendations focused and high-yield.\n"
        )

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are MediEase Clinic's medical risk and recommendations assistant. "
                                "Always respond with STRICT JSON only."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.3,
                    response_format={"type": "json_object"},
                )
                raw = response.choices[0].message.content
            elif self.provider == "gemini":
                # Gemini path: ask for JSON and attempt to parse
                response = self.client.generate_content(
                    "Return ONLY JSON.\n\n" + prompt
                )
                raw = response.text
            else:
                # Should not happen, but guard anyway
                logger.warning("Unsupported AI provider: %s", self.provider)
                return await self.generate_patient_insights(patient_data)

            data = json.loads(raw)

            insights = {
                "riskAssessment": data.get("riskAssessment") or "Risk assessment not available",
                "riskLevel": data.get("riskLevel") or "medium",
                "successRate": data.get("successRate") or "N/A",
                "keyFindings": data.get("keyFindings") or [],
                "recommendations": data.get("recommendations") or [],
                "lastUpdatedAt": datetime.utcnow().isoformat(),
            }

            return insights

        except Exception as exc:  # pragma: no cover - defensive
            logger.error("AI patient insights generation failed: %s", exc, exc_info=True)
            # Fall back to heuristic insights if model call fails
            return await self.generate_patient_insights(patient_data)


# Global AI service instance
ai_service = AIService()

