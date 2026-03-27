"""
AI service for generating clinical notes from transcripts.
Supports both OpenAI and Google Gemini.
"""

import logging
from datetime import datetime
from typing import Dict, Optional, Any, List
import json
from fastapi import HTTPException, status

from app.config import settings
from app.utils.pii_sanitizer import patient_dict_for_llm, strip_text_pii

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
        response_format: Optional[dict] = None,
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
                response_kwargs = {
                    "model": target_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                }

                # Only use response_format for models that support it
                # GPT-4-turbo and newer models support JSON mode, base GPT-4 does not
                if response_format and target_model in ["gpt-4-turbo", "gpt-4-turbo-preview", "gpt-4o", "gpt-4o-mini"]:
                    response_kwargs["response_format"] = response_format

                response = self.client.chat.completions.create(**response_kwargs)
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

    async def analyze_prescription_image(self, image_url: str) -> Dict[str, Any]:
        """
        Analyze a prescription image using GPT-4o with vision and extract
        structured medicines and tests.

        This uses the existing OpenAI setup (OPENAI_API_KEY) and requires
        network-accessible image URLs (e.g., S3 HTTPS URLs).
        """
        if not self.provider or self.provider != "openai":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI provider not configured. Please set OPENAI_API_KEY for GPT-4o image analysis.",
            )

        if not image_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image URL is required for prescription analysis.",
            )

        system_prompt = (
            "You are a medical AI assistant specialized in extracting structured information from prescription images. "
            "Your task is to accurately read and extract all relevant details from the prescription in a clean, structured JSON format suitable for an Electronic Health Record (EHR) system. "
            "Accuracy and precision are critical - do not guess or infer information that is not clearly visible."
        )

        user_text = """
Your job is to extract and accurately transcribe the following details from the provided prescription image:

1. Patient's full name
2. Patient's age (handle different formats like "42y", "42yrs", "42", "42 years")
3. Patient's gender
4. Doctor's full name
5. Doctor's license number
6. Prescription date (in YYYY-MM-DD format)
7. List of medications including:
   - Medication name
   - Dosage
   - Frequency
   - Duration
   IMPORTANT: Prescriptions often contain MULTIPLE medications. You MUST scan the ENTIRE prescription image systematically - look for medications listed in rows, columns, numbered lists, or any other format. Each distinct medication should be extracted as a separate entry in the medicines array.
8. Additional notes or instructions. Provide detailed and enhanced notes using bullet points. Organize the notes in clear bullet points for better readability.
   - Provide detailed and enhanced notes using bullet points.
   - If there are headings or categories within the notes, ensure the bullet points are organized under those headings.
   - Use clear and concise language to enhance readability.
   - Ensure the notes are structured in a way that makes them easy to follow and understand.

IMPORTANT INSTRUCTIONS:
- Before extracting information, mentally enhance the image for better readability if needed. Pay close attention to details, adjust your focus to different areas of the prescription, and carefully examine each section.
- CRITICAL FIRST STEP: Before extracting medications, scan the ENTIRE prescription image and mentally list ALL text that could be a medication. Look for patterns like: medication names, "Tab", "T.", "Capsule", "Syrup", "Injection", dosage numbers, frequency indicators (BD, TDS, OD, etc.), or any text that appears to be prescribing a medication. Count how many distinct medications you can identify before you start extracting.
- Ensure that each extracted field is accurate and clear. If any information is not legible or missing, indicate it as 'Not available' (not null).
- Do not guess or infer any information that is not clearly legible.
- Do not make assumptions or guesses about missing information.
- Pay close attention to details like medication names, dosages, and frequencies. Extract them exactly as written.
- For medication names, preserve the exact spelling and capitalization as shown on the prescription.
- For dosages, include both the number and unit (e.g., "500 mg", "10 ml", "2 tablets").
- For frequencies, preserve the exact format used (e.g., "1-0-1", "BD", "TDS", "twice daily").
- For dates, if only partial information is available (e.g., only day and month), use the current year and mark as estimated if needed.

Extract ALL structured details with this exact JSON schema:

{
  "patientName": "Patient's full name as written on prescription (string, or 'Not available' if not legible or missing)",
  "patientAge": "Patient's age - normalize to number format like '42' (handle formats: '42y', '42yrs', '42 years', '42', etc.) (string, or 'Not available' if not legible or missing)",
  "patientGender": "Patient's gender - normalize to 'Male', 'Female', 'M', or 'F' (string, or 'Not available' if not legible or missing)",
  "doctorName": "Doctor's full name as written on prescription (string, or 'Not available' if not legible or missing)",
  "doctorLicenseNumber": "Doctor's license/registration number if visible (string, or 'Not available' if not legible or missing)",
  "prescriptionDate": "Prescription date in YYYY-MM-DD format (e.g., '2024-01-15'). If only partial date available, use best estimate with current year (string, or 'Not available' if not legible or missing)",
  "medicines": [
    {
      "name": "Medicine name - extract exactly as written, preserve spelling and capitalization (string)",
      "dosage": "Dose and units exactly as written, e.g. '500 mg', '10 ml', '2 tablets' (string)",
      "frequency": "How often exactly as written, e.g. '1-0-1', 'twice daily', 'BD', 'TDS' (string)",
      "duration": "Duration exactly as written, e.g. '5 days', '2 weeks', '1 month' (string)",
      "instructions": "Any additional instructions such as 'before food', 'after food', 'with meals' - extract exactly as written (string, can be empty if none)"
    }
  ],
  "tests": [
    {
      "name": "Lab or imaging test name exactly as written, e.g. 'CBC', 'X-Ray Chest', 'Blood Sugar' (string)",
      "instructions": "Any instructions for the test exactly as written, e.g. 'Fasting required', 'Morning sample' (string, can be empty if none)"
    }
  ],
  "followUpRequired": "Boolean: true if follow-up appointment or review is mentioned anywhere in the prescription (e.g., 'follow up in 2 weeks', 'review after 5 days', 'come back in 1 month', 'repeat visit', 'follow-up needed'). false if no follow-up is mentioned (boolean)",
  "followUpDuration": "If followUpRequired is true, extract the duration text exactly as written (e.g., '2 weeks', '5 days', '1 month', '3 months'). If follow-up is mentioned but no specific duration is given, use 'Not specified'. If followUpRequired is false, use null (string or null)",
  "additionalNotes": "Any additional notes, instructions, or remarks from the prescription. Format with clear bullet points (•) for better readability. If there are headings or categories, organize bullet points under those headings. Use clear and concise language. If no additional notes, return 'Not available' (string, or 'Not available' if not found)"
}

CRITICAL RULES:
1. Use the EXACT keys as shown above: patientName, patientAge, patientGender, doctorName, doctorLicenseNumber, prescriptionDate, medicines, tests, followUpRequired, followUpDuration, additionalNotes
2. For patientAge: Normalize all age formats to a simple number string (e.g., "42y" → "42", "42 years" → "42", "42yrs" → "42")
3. For prescriptionDate: Always convert to YYYY-MM-DD format. If only day/month visible, use current year. If date is completely unclear or missing, return 'Not available'
4. For followUpRequired: Look for phrases like "follow up", "follow-up", "review", "come back", "repeat visit", "revisit", "check back", "followup" (case-insensitive). Set to true if ANY mention of follow-up is found, false otherwise.
5. For followUpDuration: Extract the duration text EXACTLY as written (e.g., "2 weeks", "5 days", "1 month", "3 months"). If follow-up is mentioned but no duration specified, use "Not specified". If followUpRequired is false, use null.
6. For additionalNotes: 
   - Format with bullet points (•) for each point
   - If there are categories/headings, organize bullets under headings
   - Use clear, concise language
   - If multiple paragraphs exist, convert to bullet points
   - Preserve the meaning and intent of the original notes
7. If a field is not found, not legible, or unclear, use 'Not available' (NOT null, NOT empty string) - EXCEPT for followUpDuration which can be null if followUpRequired is false
8. If there are no medicines, return "medicines": []
9. If there are no tests, return "tests": []
10. Do NOT add any other top-level fields
11. Do NOT return markdown or code fences, only a single valid JSON object
12. Be thorough - extract ALL visible information from the prescription
13. Extract medication details EXACTLY as written - do not abbreviate or modify
14. Pay special attention to medication names, dosages, and frequencies - these are critical for patient safety
15. If you cannot clearly read a medication name, dosage, or frequency, mark the entire medicine entry with 'Not available' for unclear fields
16. CRITICAL: You MUST extract ALL medications listed on the prescription. Scan the entire prescription image carefully - medications may be listed in different sections, rows, columns, numbered lists, bullet points, or formats. Count each distinct medication separately. If you see multiple medications, you MUST include ALL of them in the medicines array. Do not skip any medications, even if they appear in different parts of the prescription or have different formatting.
17. Before finalizing your response, double-check: Count the number of distinct medications you found. Ensure the medicines array contains exactly that many entries. If you initially found only one medication, re-examine the entire prescription image systematically - scan from top to bottom, left to right, looking for any text that might indicate a medication (look for patterns like "Tab", "T.", "Capsule", "Syrup", medication names, dosages, frequencies). If you find only one medication, ask yourself: "Could there be another medication listed elsewhere on this prescription?" and scan again before finalizing.
18. Medications can appear in various formats: "Tab XYZ", "T. ABC", "Capsule DEF", "Syrup GHI", numbered lists (1., 2., etc.), or simply as medication names followed by dosage/frequency. Extract ALL of them regardless of format.

Example additionalNotes format:
"• Take medications with food to avoid stomach upset
• Complete the full course even if symptoms improve
• Avoid alcohol while on medication
• Follow-up appointment recommended after 1 week"

Remember: Accuracy is paramount. When in doubt, use 'Not available' rather than guessing.
""".strip()

        try:
            # Use configurable vision-capable model (default: gpt-4o-mini for lower cost)
            vision_model = getattr(settings, "openai_vision_model", None) or settings.openai_model
            response = self.client.chat.completions.create(
                model=vision_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_text},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url,
                                },
                            },
                        ],
                    },
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )

            raw = response.choices[0].message.content
            result = json.loads(raw)
            logger.info("Successfully analyzed prescription image with GPT-4o")
            return result

        except Exception as e:
            logger.error(f"GPT-4o prescription image analysis failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to analyze prescription image: {str(e)}",
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

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings using OpenAI (required for RAG)."""
        if not texts:
            return []
        if not settings.openai_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI API key required for embeddings",
            )
        try:
            import openai

            emb_client = openai.OpenAI(api_key=settings.openai_api_key)
            out: List[List[float]] = []
            batch_size = 64
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                resp = emb_client.embeddings.create(
                    model=settings.openai_embedding_model,
                    input=batch,
                )
                out.extend([item.embedding for item in resp.data])
            return out
        except Exception as e:
            logger.error("Embedding failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Embedding failed: {str(e)}",
            )

    async def chat_consultation_rag(
        self,
        user_message: str,
        retrieved_chunks: List[str],
        prior_messages: List[Dict[str, str]],
    ) -> str:
        """
        Doctor assistant grounded in retrieved patient chart chunks.
        """
        if not self.provider:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY",
            )

        context_block = "\n\n---\n\n".join(retrieved_chunks) if retrieved_chunks else ""
        system = (
            "You are MediEase Clinic's clinical assistant. The doctor is asking about ONE patient. "
            "Use ONLY the information in the Retrieved chart excerpts below. "
            "Excerpts may include a patient profile (allergies, current medications, chief complaint) "
            "and visit history. If medications or allergies are listed there, you may cite them directly. "
            "If the excerpts do not contain enough information to answer, reply briefly: say clearly "
            "that this is not found in the chart or in any past appointment history for this patient, "
            "and suggest asking the patient directly (or verifying with them) for that detail. "
            "Do not use stiff boilerplate phrases. "
            "Do not invent diagnoses, lab values, or medications not implied by the excerpts. "
            "Be concise. This is decision support, not a diagnosis."
        )

        try:
            if self.provider == "openai":
                msgs: List[Dict[str, str]] = [{"role": "system", "content": system}]
                for m in prior_messages[-12:]:
                    r, c = m.get("role"), m.get("content")
                    if r in ("user", "assistant") and c:
                        msgs.append({"role": r, "content": c})
                final_user = (
                    f"Retrieved chart excerpts:\n{context_block}\n\nDoctor question:\n{user_message}"
                )
                msgs.append({"role": "user", "content": final_user})
                response = self.client.chat.completions.create(
                    model=settings.openai_model,
                    messages=msgs,
                    temperature=0.3,
                    max_tokens=900,
                )
                return (response.choices[0].message.content or "").strip()

            if self.provider == "gemini":
                history_lines = []
                for m in prior_messages[-12:]:
                    if m.get("content"):
                        history_lines.append(f"{m.get('role', 'user')}: {m['content']}")
                composed = (
                    f"{system}\n\nRetrieved chart excerpts:\n{context_block}\n\n"
                    f"Prior chat:\n{chr(10).join(history_lines)}\n\nDoctor question:\n{user_message}"
                )
                response = self.client.generate_content(composed)
                return (response.text or "").strip()

        except Exception as e:
            logger.error("RAG chat failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate AI response: {str(e)}",
            )

        raise HTTPException(status_code=500, detail="Unsupported provider")

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
                "clinicalPearls": [],
                "suggestedQuestionsForClinician": [],
                "redFlagsToConsider": [],
                "disclaimer": "This is AI-assisted decision support, not a diagnosis.",
                "lastUpdatedAt": datetime.utcnow().isoformat(),
            }

        # De-identified profile + longitudinal narrative (no names, phone, email, insurance numbers)
        safe_profile = patient_dict_for_llm(patient_data)
        narrative = patient_data.get("cumulativeClinicalNarrative") or patient_data.get(
            "historySummary"
        )
        narrative = strip_text_pii(narrative) if narrative else ""

        context: Dict[str, Any] = {
            "deIdentifiedProfile": safe_profile,
            "longitudinalCumulativeRecords": narrative,
        }

        prompt = (
            "You are MediEase Clinic's AI assistant. Analyze the following de-identified patient "
            "profile and cumulative longitudinal clinical record summary. Produce concise, clinically "
            "useful insights for the doctor before or during a consultation.\n\n"
            "Data (JSON):\n"
            f"{json.dumps(context, indent=2)}\n\n"
            "Return ONLY a JSON object with the following keys:\n"
            "{\n"
            '  "riskAssessment": "Short sentence describing overall risk profile",\n'
            '  "riskLevel": "low" | "medium" | "high",\n'
            '  "successRate": "Estimated treatment success probability as a percentage string like \\"90%\\" or \\"N/A\\"",\n'
            '  "keyFindings": ["bullet 1", "bullet 2", ...],\n'
            '  "recommendations": ["recommendation 1", "recommendation 2", ...],\n'
            '  "clinicalPearls": ["optional short pearls tied to the chart"],\n'
            '  "suggestedQuestionsForClinician": ["questions the doctor may ask the patient"],\n'
            '  "redFlagsToConsider": ["potential red flags or follow-up triggers from the chart"],\n'
            '  "disclaimer": "This is AI-assisted decision support, not a diagnosis."\n'
            "}\n\n"
            "Guidelines:\n"
            "- Be conservative and clinically reasonable.\n"
            "- Base your reasoning ONLY on the provided data.\n"
            "- Do not invent diagnoses, medications, or lab values not implied by the data.\n"
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
                "clinicalPearls": data.get("clinicalPearls") or [],
                "suggestedQuestionsForClinician": data.get("suggestedQuestionsForClinician") or [],
                "redFlagsToConsider": data.get("redFlagsToConsider") or [],
                "disclaimer": data.get("disclaimer")
                or "This is AI-assisted decision support, not a diagnosis.",
                "lastUpdatedAt": datetime.utcnow().isoformat(),
            }

            return insights

        except Exception as exc:  # pragma: no cover - defensive
            logger.error("AI patient insights generation failed: %s", exc, exc_info=True)
            # Fall back to heuristic insights if model call fails
            return await self.generate_patient_insights(patient_data)


# Global AI service instance
ai_service = AIService()

