#!/usr/bin/env python3
"""
Debug script for structured notes extraction.
Tests the extract_structured_notes method directly.
"""

import asyncio
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.aws_service import aws_service

async def test_notes_extraction():
    """Test the notes extraction with the transcription from the failed recording."""

    # Transcription from the failed recording
    transcript = """आप स्पीकर में रखना अपना । Hi doctor डॉक्टर मुझे बहुत cold and cough हो रहा है काफी दिनों से मेरे गले में पैन है और कभी कभी माइग्रेन का भी इश्यू हो रहा है । आप currently किसी medication को intake कर रहे हो? हाँ मुझे आह medicine D five आह दो तीन महीने से उसे कर रही हूँ मैं । तो आई थिंक मैं जुलाई से उसे कर रही हूँ एंड उससे थोड़ा बेहतर लगता है मगर आई थिंक अब कुछ चेंज चाहिए होगा । आप आपकी फैमिली में इस तरह की कोई हिस्ट्री है माइग्रेन की या डायबिटिक की या किसी और तरह की डिजीज? आह मैंने सुना था कि मेरी grandma को था migraine का इश्यू आह मगर उन्होंने कुछ ऐसा इलाज नहीं कराया था । ओके आप किस profession में काम करते हो? आह मैं IT में हूँ । थोड़ा लैपटॉप का भी काम बहुत ज्यादा रहता है । आईटी तो नाइन हॉर्स मुझे वर्क करना रहता है स्क्रीन टाइम । ओके । और आपने लास्ट टाइम कब appointment ली थी? इसके regarding या किसी और चीज़ के regarding? आह मैंने आपके अंडर नहीं लिया था । मैं एक्चुअली अपने होम टाइम अंबिकापुर में एक डॉक्टर से अपॉइंटमेंट लिया था वह टेस्ट करा रही थी । अभी मैं यहाँ मूव हुई हूँ तो आपके साथ पहला अपॉइंटमेंट है । ओके ।"""

    patient_context = {
        "age": None,
        "gender": None,
        "medicalHistory": [],
        "allergies": [],
        "chiefComplaint": None
    }

    print("Testing structured notes extraction...")
    print(f"Transcript length: {len(transcript)} characters")
    print(f"Patient context: {patient_context}")
    print("\n" + "="*80 + "\n")

    try:
        result = await aws_service.extract_structured_notes(transcript, patient_context)
        print("Result:")
        print(f"Success: {result.get('success')}")
        print(f"Error: {result.get('error')}")

        if result.get('success'):
            print("Structured notes extracted successfully!")
            structured_notes = result.get('structured_notes', {})
            for key, value in structured_notes.items():
                print(f"{key}: {value}")
        else:
            print(f"Raw response: {result.get('raw_response', 'No raw response')}")

    except Exception as e:
        print(f"Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_notes_extraction())
