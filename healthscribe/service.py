import os
import json
import logging
from typing import Dict, Any, List

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthscribe")

def load_env():
    # Search paths for the environment file
    paths_to_check = [
        ".env",
        "../.env",
        "healthscribe/.env",
        "/home/aryan/Desktop/work/MedCare/.env"
    ]
    for path in paths_to_check:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ[k.strip()] = v.strip().strip("'\"")
                logger.info(f"Loaded environment variables from: {path}")
                break
            except Exception as e:
                logger.warning(f"Failed to read .env file at {path}: {e}")

# Load environment variables on startup
load_env()

# Structured mock cases for offline/demo mode with citation mappings
MOCK_CASES = {
    "ramesh": {
        "transcription": [
            {"id": "t1", "speaker": "Doctor", "time": "00:00", "text": "Good morning, Ramesh. Glad to see you are ready for discharge. Let's go over your plan."},
            {"id": "t2", "speaker": "Patient", "time": "00:06", "text": "Good morning, Doctor. Thank you. Yes, I'm feeling much better after the stent procedure."},
            {"id": "t3", "speaker": "Doctor", "time": "00:12", "text": "Excellent. Now, you had a heart attack, an anterior wall STEMI, and we placed a drug-eluting stent in your LAD artery. Because of this, you must take Tab Aspirin 75mg once daily and Tab Clopidogrel 75mg once daily, both after breakfast. These are blood thinners, and they are critical to keep the stent open. Do not stop them under any circumstances."},
            {"id": "t4", "speaker": "Patient", "time": "00:32", "text": "Understood. I will take them every morning. What about my diabetes?"},
            {"id": "t5", "speaker": "Doctor", "time": "00:38", "text": "Yes, your HbA1c was 8.4% and fasting glucose was 184 mg/dL. We are prescribing Tab Metformin 500mg twice daily with meals. Also, your blood pressure was elevated at 160/100, so we're starting Tab Lisinopril 5mg in the morning, and Tab Amlodipine 5mg once daily. For your cholesterol and heart protection, you'll take Tab Atorvastatin 80mg at night and Tab Metoprolol 25mg twice daily. Remember, you are allergic to penicillin, correct?"},
            {"id": "t6", "speaker": "Patient", "time": "01:05", "text": "Yes, doctor. I get severe rashes and hives from penicillin."},
            {"id": "t7", "speaker": "Doctor", "time": "01:11", "text": "Got it, we have documented that. For your diet, you must follow a strict low-salt, low-sugar, low-fat cardiac and diabetic diet. And you need to follow up with cardiology in one week, and endocrinology in four weeks. If you experience any sudden chest pain, shortness of breath, or dizziness, go to the emergency room immediately."}
        ],
        "notes_sections": [
            {
                "title": "Admitting Diagnosis",
                "items": [
                    {"text": "Acute Myocardial Infarction (STEMI — Anterior wall) - Post Primary PCI with Drug-Eluting Stent (DES) to LAD artery.", "citations": ["t3"]}
                ]
            },
            {
                "title": "History of Present Illness",
                "items": [
                    {"text": "65-year-old male with history of diabetes and hypertension, admitted for acute chest pain due to STEMI.", "citations": ["t3", "t5"]},
                    {"text": "Successfully treated with primary coronary intervention (PCI). Patient states feeling significantly better at discharge.", "citations": ["t2", "t3"]}
                ]
            },
            {
                "title": "Medications Prescribed",
                "items": [
                    {"text": "Dual antiplatelet therapy: Tab Aspirin 75mg once daily after breakfast + Tab Clopidogrel 75mg once daily after breakfast (crucial for stent open maintenance).", "citations": ["t3"]},
                    {"text": "Antihypertensives: Tab Lisinopril 5mg once daily morning + Tab Amlodipine 5mg once daily (for blood pressure control).", "citations": ["t5"]},
                    {"text": "Lipid-lowering and rate-control: Tab Atorvastatin 80mg once daily night + Tab Metoprolol 25mg twice daily.", "citations": ["t5"]},
                    {"text": "Antidiabetic: Tab Metformin 500mg twice daily with meals (for glycemic control).", "citations": ["t5"]}
                ]
            },
            {
                "title": "Allergies",
                "items": [
                    {"text": "Penicillin: Documented severe reaction (rash and hives). Penicillin-class drugs are strictly contraindicated.", "citations": ["t5", "t6"]}
                ]
            },
            {
                "title": "Diet & Follow-up Plans",
                "items": [
                    {"text": "Follow strict diabetic + cardiac diet (restricted salt, simple sugars, and saturated fat).", "citations": ["t7"]},
                    {"text": "Cardiology outpatient clinic visit scheduled in 1 week.", "citations": ["t7"]},
                    {"text": "Endocrinology follow-up scheduled in 4 weeks.", "citations": ["t7"]}
                ]
            }
        ],
        "summary": [
            {"text": "You are being discharged after treatment for a heart attack. A stent was successfully placed in your LAD artery to restore blood flow.", "citations": ["t3"]},
            {"text": "It is absolutely critical that you take your dual blood thinners (Aspirin and Clopidogrel) every single morning after breakfast to prevent stent thrombosis.", "citations": ["t3"]},
            {"text": "Your blood sugar and blood pressure medications have been adjusted. Take Metformin with meals and your BP medications as directed.", "citations": ["t5"]},
            {"text": "Adhere to a strict low-salt, low-fat, low-sugar diet, and seek emergency room care immediately if chest pain or shortness of breath recurs.", "citations": ["t7"]}
        ],
        "objectives": [
            {"text": "Maintain stent patency via strict compliance with dual antiplatelet therapy (DAPT).", "citations": ["t3"]},
            {"text": "Optimize blood pressure target below 130/80 mmHg (discharge BP was 160/100 mmHg).", "citations": ["t5"]},
            {"text": "Optimize glycemic control (lower HbA1c from 8.4% towards target < 7.0%).", "citations": ["t5"]}
        ],
        "key_points": [
            {"text": "CRITICAL: Never stop Aspirin or Clopidogrel without explicit cardiologist approval.", "citations": ["t3"]},
            {"text": "Avoid penicillin-class antibiotics due to documented rash and hives allergy.", "citations": ["t5", "t6"]},
            {"text": "Seek emergency medical care immediately for chest pain, shortness of breath, or dizziness.", "citations": ["t7"]}
        ],
        "extracted_entities": {
            "name": "Ramesh Kumar",
            "age": 65,
            "sex": "Male",
            "weight_kg": 70.0,
            "blood_group": "O+",
            "allergies": "penicillin",
            "discharge_text": (
                "DISCHARGE SUMMARY\nPatient: Ramesh Kumar | Age: 65 | Sex: Male\n"
                "Primary Diagnosis: Acute STEMI post PCI with DES to LAD; Type 2 Diabetes; Hypertension.\n"
                "Investigations: Troponin I: 45.2 ng/mL, HbA1c: 8.4%, BP: 160/100 mmHg.\n"
                "Discharge Medications: Aspirin 75mg OD after breakfast; Clopidogrel 75mg OD after breakfast; Atorvastatin 80mg OD night; Metoprolol 25mg BD; Lisinopril 5mg OD morning; Metformin 500mg BD with meals; Amlodipine 5mg OD.\n"
                "Allergies: Penicillin (rash).\n"
                "Follow up: Cardiology 1 week, Endocrinology 4 weeks."
            )
        }
    },
    "priya": {
        "transcription": [
            {"id": "t1", "speaker": "Doctor", "time": "00:00", "text": "Welcome, Priya. Your enteric fever, or typhoid, has resolved well. Your blood culture was positive for Salmonella typhi, but fortunately it was sensitive to Cefixime, which is the antibiotic you've been on."},
            {"id": "t2", "speaker": "Patient", "time": "00:15", "text": "Yes, Doctor, my fever is completely gone and I'm feeling much stronger."},
            {"id": "t3", "speaker": "Doctor", "time": "00:20", "text": "Excellent. Your temperature on admission was 103.4, but now you are afebrile. We are discharging you with Tab Cefixime 400mg twice daily, and you must complete this antibiotic for 7 more days. Do not stop early, even if you feel 100% fine, because the infection can return."},
            {"id": "t4", "speaker": "Patient", "time": "00:40", "text": "I will finish the whole course, doctor. What should I take if I get a mild fever again?"},
            {"id": "t5", "speaker": "Doctor", "time": "00:46", "text": "If you get a fever, you can take Tab Paracetamol 500mg, but only as needed. And use ORS sachets as needed for hydration. Your liver enzymes were slightly elevated, ALT 68 and AST 72, which is common in typhoid, but it will normalize as you recover. For your diet, you must eat a typhoid-specific diet, which means soft, easily digestible, and completely bland food. Avoid all oily, spicy, and raw foods. Drink only boiled or bottled water."},
            {"id": "t6", "speaker": "Patient", "time": "01:18", "text": "Okay. Any allergies I need to watch out for?"},
            {"id": "t7", "speaker": "Doctor", "time": "01:22", "text": "You have no known drug allergies, which is great. Take plenty of rest and drink lots of fluids. Come back to see us if the high fever returns or if you have severe abdominal pain."}
        ],
        "notes_sections": [
            {
                "title": "Admitting Diagnosis",
                "items": [
                    {"text": "Enteric Fever (Typhoid) — Blood culture positive for Salmonella typhi.", "citations": ["t1"]}
                ]
            },
            {
                "title": "History of Present Illness",
                "items": [
                    {"text": "32-year-old female presenting with high fever (103.4°F) and transaminitis (ALT 68, AST 72).", "citations": ["t1", "t5"]},
                    {"text": "Treated inpatient with antibiotics, now stable and completely afebrile.", "citations": ["t2", "t3"]}
                ]
            },
            {
                "title": "Medications Prescribed",
                "items": [
                    {"text": "Antibiotics: Tab Cefixime 400mg twice daily for 7 more days (essential course completion).", "citations": ["t3"]},
                    {"text": "Antipyretics: Tab Paracetamol 500mg orally as needed for recurrent fever.", "citations": ["t5"]},
                    {"text": "Hydration: Oral Rehydration Salts (ORS) sachets as needed for fluid balance.", "citations": ["t5"]}
                ]
            },
            {
                "title": "Allergies",
                "items": [
                    {"text": "No Known Drug Allergies (NKDA).", "citations": ["t6", "t7"]}
                ]
            },
            {
                "title": "Diet & Hygiene",
                "items": [
                    {"text": "Soft, easily digestible, completely bland food (e.g. curd rice, plain khichdi). Avoid spicy/oily foods.", "citations": ["t5"]},
                    {"text": "Strict hydration hygiene: drink only boiled or bottled water.", "citations": ["t5"]},
                    {"text": "Follow-up in 1 week, or sooner if fever returns or severe abdominal pain occurs.", "citations": ["t7"]}
                ]
            }
        ],
        "summary": [
            {"text": "You are recovering well from Typhoid fever. The Salmonella infection was successfully treated.", "citations": ["t1"]},
            {"text": "Take your Cefixime antibiotic twice daily for exactly 7 more days. Do not stop early.", "citations": ["t3"]},
            {"text": "Eat soft, bland, home-cooked food and drink only boiled or clean bottled water.", "citations": ["t5"]},
            {"text": "Take Paracetamol only if you develop body aches or fever, and rest plenty.", "citations": ["t5"]}
        ],
        "objectives": [
            {"text": "Eradicate Salmonella infection and prevent relapse via full antibiotic course compliance.", "citations": ["t3"]},
            {"text": "Maintain hydration and monitor resolving transaminitis.", "citations": ["t5"]}
        ],
        "key_points": [
            {"text": "CRITICAL: Complete the Cefixime antibiotic course even if you feel 100% recovered.", "citations": ["t3"]},
            {"text": "Avoid raw food, street food, and tap water to prevent re-infection.", "citations": ["t5"]},
            {"text": "Return immediately if high fever returns or severe abdominal pain develops.", "citations": ["t7"]}
        ],
        "extracted_entities": {
            "name": "Priya Sharma",
            "age": 32,
            "sex": "Female",
            "weight_kg": 55.0,
            "blood_group": "B+",
            "allergies": "",
            "discharge_text": (
                "DISCHARGE SUMMARY\nPatient: Priya Sharma | Age: 32 | Sex: Female\n"
                "Primary Diagnosis: Enteric Fever (Typhoid) — Salmonella typhi positive.\n"
                "Investigations: Temp: 103.4°F, AST: 72, ALT: 68.\n"
                "Discharge Medications: Cefixime 400mg BD for 7 days; Paracetamol 500mg PRN; ORS sachet PRN.\n"
                "Allergies: NKDA.\n"
                "Diet: Soft, bland typhoid diet. Drink boiled water."
            )
        }
    },
    "arjun": {
        "transcription": [
            {"id": "t1", "speaker": "Doctor", "time": "00:00", "text": "Hello, Arjun. We are ready to discharge you today. Let's go over your plan. You were admitted with worsening shortness of breath due to decompensated congestive heart failure. Your ejection fraction is 35%. Also, you have Stage 3 Chronic Kidney Disease with an eGFR of 38, and long-standing high blood pressure."},
            {"id": "t2", "speaker": "Patient", "time": "00:22", "text": "Yes, doctor. I am breathing much easier now."},
            {"id": "t3", "speaker": "Doctor", "time": "00:26", "text": "Good. Because of your heart and kidney condition, we must manage your fluids and medications very carefully. For your heart failure, we are discharging you on Tab Furosemide 40mg once daily in the morning. This is a water pill to keep fluid from building up in your lungs. We're also prescribing Tab Losartan 50mg once daily and Tab Carvedilol 6.25mg twice daily with food. For heart protection and blood pressure, you'll take Tab Spironolactone 25mg once daily in the morning, and Tab Atorvastatin 20mg once daily at night. Now, we must note your allergies: you are severely allergic to penicillin, which causes anaphylaxis, and sulfonamide antibiotics, which give you a bad rash."},
            {"id": "t4", "speaker": "Patient", "time": "01:05", "text": "Yes, that is correct. I have to avoid those."},
            {"id": "t5", "speaker": "Doctor", "time": "01:09", "text": "Absolutely. For your diet, you must adhere to a strict low-sodium diet, less than 1.5 grams of salt per day. Also, you have a fluid restriction of exactly 1.5 liters per day. Measure all water, tea, and soups. Since your kidney function is reduced and potassium was slightly high at 5.2, you must follow a low-potassium diet. Avoid bananas, potatoes, and tomatoes. You should weigh yourself every single morning after using the bathroom. If you gain more than 2 kg in a single day, or 3 kg in a week, call us immediately. Also, monitor your blood pressure. If you experience shortness of breath at rest, swelling in your ankles, or dizziness, seek medical attention right away."}
        ],
        "notes_sections": [
            {
                "title": "Admitting Diagnosis",
                "items": [
                    {"text": "Decompensated Congestive Heart Failure (NYHA Class III to II, EF 35%).", "citations": ["t1"]},
                    {"text": "Chronic Kidney Disease Stage 3 (eGFR 38 mL/min) + Essential Hypertension.", "citations": ["t1"]}
                ]
            },
            {
                "title": "Investigations & Labs",
                "items": [
                    {"text": "Serum potassium mildly elevated (5.2 mEq/L); Creatinine 2.1 mg/dL; BP 150/95 mmHg.", "citations": ["t1", "t5"]}
                ]
            },
            {
                "title": "Medications Prescribed",
                "items": [
                    {"text": "Water pill: Tab Furosemide 40mg once daily in the morning (loop diuretic to prevent pulmonary congestion).", "citations": ["t3"]},
                    {"text": "BP and Heart Failure: Tab Losartan 50mg once daily + Tab Carvedilol 6.25mg twice daily with food.", "citations": ["t3"]},
                    {"text": "Aldosterone Antagonist: Tab Spironolactone 25mg once daily in the morning (requires potassium monitoring).", "citations": ["t3"]},
                    {"text": "Cholesterol: Tab Atorvastatin 20mg once daily night.", "citations": ["t3"]}
                ]
            },
            {
                "title": "Contraindicated Allergies",
                "items": [
                    {"text": "Penicillin: Causes anaphylaxis (absolute contraindication).", "citations": ["t3", "t4"]},
                    {"text": "Sulfonamides: Causes severe allergic rash.", "citations": ["t3", "t4"]}
                ]
            },
            {
                "title": "Dietary & Fluid Restrictions",
                "items": [
                    {"text": "Strict sodium restriction (<1.5g salt per day).", "citations": ["t5"]},
                    {"text": "Strict fluid limit: 1.5 Liters per day (total measured fluid intake).", "citations": ["t5"]},
                    {"text": "Low-potassium diet: Avoid high potassium foods like bananas, potatoes, tomatoes, and coconut water.", "citations": ["t5"]}
                ]
            },
            {
                "title": "Daily Monitoring Log",
                "items": [
                    {"text": "Record weight every morning after voiding. Call immediately if weight increases >2kg in 24 hours.", "citations": ["t5"]}
                ]
            }
        ],
        "summary": [
            {"text": "You are being discharged after stabilizing from heart failure. Your heart function is reduced (35% EF) and kidney function is impaired.", "citations": ["t1"]},
            {"text": "Take your morning water pill (Furosemide) daily to prevent water from filling your lungs and making it hard to breathe.", "citations": ["t3"]},
            {"text": "You must strictly limit salt (<1.5g/day) and total fluid intake to 1.5 Liters per day.", "citations": ["t5"]},
            {"text": "Weigh yourself every morning. Call your doctor immediately if you gain more than 2 kg in a single day.", "citations": ["t5"]}
        ],
        "objectives": [
            {"text": "Maintain euvolemia (fluid balance) and prevent HF readmission.", "citations": ["t3", "t5"]},
            {"text": "Manage hypertension and prevent worsening hyperkalemia (current potassium 5.2).", "citations": ["t1", "t5"]}
        ],
        "key_points": [
            {"text": "CRITICAL: Strict fluid restriction of 1.5 Liters per day.", "citations": ["t5"]},
            {"text": "DO NOT take any penicillin or sulfa drugs due to severe allergy risk.", "citations": ["t3", "t4"]},
            {"text": "Weigh yourself daily and watch for ankle swelling or shortness of breath.", "citations": ["t5"]}
        ],
        "extracted_entities": {
            "name": "Arjun Singh",
            "age": 72,
            "sex": "Male",
            "weight_kg": 82.0,
            "blood_group": "AB+",
            "allergies": "penicillin, sulfonamide",
            "discharge_text": (
                "DISCHARGE SUMMARY\nPatient: Arjun Singh | Age: 72 | Sex: Male\n"
                "Primary Diagnosis: Worsening Congestive Heart Failure (EF 35%); CKD Stage 3 (eGFR 38); Hypertension.\n"
                "Investigations: BNP: 210 pg/mL, Creatinine: 2.1 mg/dL, Potassium: 5.2 mEq/L, BP: 150/95 mmHg.\n"
                "Discharge Medications: Furosemide 40mg OD morning; Losartan 50mg OD; Carvedilol 6.25mg BD with food; Spironolactone 25mg OD morning; Atorvastatin 20mg OD night.\n"
                "Allergies: Penicillin (anaphylaxis), Sulfonamide (rash).\n"
                "Diet: Sodium < 1.5g/day. Fluid limit 1.5L/day. Low potassium diet."
            )
        }
    },
    "general": {
        "transcription": [
            {"id": "t1", "speaker": "Doctor", "time": "00:00", "text": "Hello, patient. I have reviewed your clinical records. You've had a respiratory tract infection. We are going to prescribe you Tab Amoxicillin 500mg three times a day for 5 days to clear the infection. Also, take Tab Paracetamol 650mg as needed for body aches or fever. Make sure to drink plenty of fluids and rest."},
            {"id": "t2", "speaker": "Patient", "time": "00:20", "text": "Thank you, Doctor. I will do that."},
            {"id": "t3", "speaker": "Doctor", "time": "00:24", "text": "Excellent. If you develop any breathing difficulties or rash, contact us immediately."}
        ],
        "notes_sections": [
            {
                "title": "Diagnosis",
                "items": [
                    {"text": "Acute Upper Respiratory Tract Infection (URTI).", "citations": ["t1"]}
                ]
            },
            {
                "title": "Medications Prescribed",
                "items": [
                    {"text": "Antibiotics: Tab Amoxicillin 500mg three times daily for 5 days.", "citations": ["t1"]},
                    {"text": "Antipyretics: Tab Paracetamol 650mg orally as needed for pain or fever.", "citations": ["t1"]}
                ]
            },
            {
                "title": "Instructions",
                "items": [
                    {"text": "Rest for 2-3 days and maintain adequate hydration.", "citations": ["t1", "t2"]},
                    {"text": "Monitor for rash or difficulty breathing and report immediately.", "citations": ["t3"]}
                ]
            }
        ],
        "summary": [
            {"text": "You have an upper respiratory tract infection. Take the Amoxicillin antibiotic three times a day for 5 days. Drink warm liquids and rest.", "citations": ["t1"]}
        ],
        "objectives": [
            {"text": "Eradicate bacterial infection.", "citations": ["t1"]},
            {"text": "Relieve fever and muscle aches.", "citations": ["t1"]}
        ],
        "key_points": [
            {"text": "Complete the full antibiotic course.", "citations": ["t1"]},
            {"text": "Rest and push fluids.", "citations": ["t1", "t2"]},
            {"text": "Report allergic symptoms immediately.", "citations": ["t3"]}
        ],
        "extracted_entities": {
            "name": "John Doe",
            "age": 45,
            "sex": "Male",
            "weight_kg": 75.0,
            "blood_group": "A+",
            "allergies": "",
            "discharge_text": (
                "DISCHARGE SUMMARY\nPatient: John Doe | Age: 45 | Sex: Male\n"
                "Primary Diagnosis: Acute Upper Respiratory Tract Infection.\n"
                "Discharge Medications: Amoxicillin 500mg TDS for 5 days; Paracetamol 650mg PRN.\n"
                "Allergies: NKDA.\n"
                "Diet: Regular diet. Increase warm fluids."
            )
        }
    }
}

def transcribe_audio_to_notes(audio_file_path: str, filename: str) -> Dict[str, Any]:
    """
    Transcribes an audio file and generates structured notes with citation mappings.
    If GEMINI_API_KEY is found, calls Gemini.
    Otherwise, returns structured mock data.
    """
    import time
    # Load env file in case it was modified after server startup
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # 1. Check if Gemini API is available
    if api_key:
        logger.info("GEMINI_API_KEY found. Calling Gemini API for structured transcription and clinical mapping...")
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            
            # Helper for retries on transient errors
            def generate_content_with_retry(model, contents, config, max_retries=3, initial_delay=2):
                for attempt in range(max_retries):
                    try:
                        return client.models.generate_content(
                            model=model,
                            contents=contents,
                            config=config
                        )
                    except Exception as exc:
                        exc_str = str(exc)
                        if "503" in exc_str or "UNAVAILABLE" in exc_str or "429" in exc_str or "ResourceExhausted" in exc_str:
                            delay = initial_delay * (2 ** attempt)
                            logger.warning(f"Gemini API returned retryable error (attempt {attempt + 1}/{max_retries}): {exc}. Retrying in {delay}s...")
                            time.sleep(delay)
                        else:
                            raise exc
                # Final attempt
                return client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config
                )

            logger.info(f"Uploading file {audio_file_path} to Gemini Files API...")
            audio_file = client.files.upload(file=audio_file_path)
            logger.info(f"File uploaded successfully. URI: {audio_file.uri}")
            
            # --- CALL 1: VERBATIM TRANSCRIPTION ---
            logger.info("Call 1: Transcribing audio verbatim...")
            transcription_prompt = """
            You are a precise, verbatim speech-to-text diarization system.
            Transcribe the provided audio recording of a medical encounter or discharge session completely and verbatim.
            
            Instructions:
            - Divide the transcription into individual dialogue turns.
            - Assign each turn an incremental ID ("t1", "t2", "t3", etc.).
            - Note the timestamp (format: "MM:SS") and speaker (e.g., "Doctor", "Patient", "Clinician", or their specific names if known).
            - It is CRITICAL that you transcribe the ENTIRE audio file verbatim from start to finish. Do NOT summarize, shorten, or omit any sentences, conversations, small talk, or greetings. Every single utterance must be represented as a dialogue turn.
            
            Format your response strictly as a JSON object matching this structure:
            {
              "transcription": [
                {
                  "id": "t1",
                  "speaker": "Speaker Name",
                  "time": "MM:SS",
                  "text": "Verbatim statement text"
                },
                ...
              ]
            }
            Do not include any markdown wrapper or ```json blocks in your output. Just return raw JSON.
            """
            
            response1 = generate_content_with_retry(
                model='gemini-2.5-flash',
                contents=[audio_file, transcription_prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            # Clean up the file from Google GenAI servers
            try:
                client.files.delete(name=audio_file.name)
                logger.info("Cleaned up uploaded file from Gemini storage.")
            except Exception as delete_err:
                logger.warning(f"Could not delete temporary file: {delete_err}")
                
            res_text1 = response1.text.strip()
            if res_text1.startswith("```json"):
                res_text1 = res_text1.split("```json")[1].split("```")[0].strip()
            elif res_text1.startswith("```"):
                res_text1 = res_text1.split("```")[1].split("```")[0].strip()
                
            trans_data = json.loads(res_text1)
            turns = trans_data.get("transcription", [])
            logger.info(f"Successfully transcribed {len(turns)} turns from audio.")
            
            # --- CALL 2: CLINICAL ANALYSIS & CITATION MAPPING ---
            logger.info("Call 2: Generating clinical analysis and structured notes...")
            analysis_prompt = f"""
            You are an expert clinical scribe. Analyze the following verbatim medical encounter transcript:
            
            [TRANSCRIPT]
            {json.dumps(turns, indent=2)}
            [/TRANSCRIPT]
            
            Based on this transcript, generate:
            1. Clinical Notes: Group notes into categories/sections (e.g. Admitting Diagnosis, History of Present Illness, Medications Prescribed, Diet & Follow-up, Allergies). For each bullet point or note item, you MUST map it to supporting transcript turn IDs in a "citations" array (e.g., ["t1", "t2"]).
            2. Summary: A patient-friendly recovery summary. Break it into paragraphs or items, each containing a list of turn IDs as citations.
            3. Key Objectives: Key clinical recovery goals with citations.
            4. Key Points: Key takeaways with citations.
            5. Extracted Demographics & Clinical Details: Extract the patient's name, age, sex, weight, blood group, allergies (comma-separated or blank if none), and reconstruct a concise "discharge_text" which captures the clinical summary.

            Format your response strictly as a JSON object matching this structure:
            {{
              "notes_sections": [
                {{
                  "title": "Section Title",
                  "items": [
                    {{
                      "text": "Note statement description",
                      "citations": ["t1", "t3"]
                    }}
                  ]
                }}
              ],
              "summary": [
                {{
                  "text": "Summary paragraph or item",
                  "citations": ["t2"]
                }}
              ],
              "objectives": [
                {{
                  "text": "Objective description",
                  "citations": ["t1"]
                }}
              ],
              "key_points": [
                {{
                  "text": "Key takeaway description",
                  "citations": ["t3"]
                }}
              ],
              "extracted_entities": {{
                "name": "PATIENT_NAME",
                "age": 45,
                "sex": "Male/Female/Other",
                "weight_kg": 75.0,
                "blood_group": "O+/A+/etc",
                "allergies": "penicillin, sulfa",
                "discharge_text": "RECONSTRUCTED_DISCHARGE_SUMMARY_TEXT"
              }}
            }}
            Do not include any markdown wrapper or ```json blocks in your output. Just return raw JSON.
            """
            
            response2 = generate_content_with_retry(
                model='gemini-2.5-flash',
                contents=analysis_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            res_text2 = response2.text.strip()
            if res_text2.startswith("```json"):
                res_text2 = res_text2.split("```json")[1].split("```")[0].strip()
            elif res_text2.startswith("```"):
                res_text2 = res_text2.split("```")[1].split("```")[0].strip()
                
            analysis_data = json.loads(res_text2)
            
            # Combine Call 1 transcription and Call 2 analysis
            combined_data = {
                "transcription": turns,
                "notes_sections": analysis_data.get("notes_sections", []),
                "summary": analysis_data.get("summary", []),
                "objectives": analysis_data.get("objectives", []),
                "key_points": analysis_data.get("key_points", []),
                "extracted_entities": analysis_data.get("extracted_entities", {})
            }
            
            return combined_data
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}. Falling back to mock data.")
            # Fall through to mock logic on failure
            
    # 2. Offline / Mock Mode
    logger.info("Running in mock/demo mode (either no API key or API call failed).")
    fn = filename.lower()
    
    if "ramesh" in fn:
        case_key = "ramesh"
    elif "priya" in fn:
        case_key = "priya"
    elif "arjun" in fn:
        case_key = "arjun"
    else:
        case_key = "general"
        
    logger.info(f"Matched mock case: {case_key}")
    return MOCK_CASES[case_key]
