import os
import shutil
import tempfile
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from service import transcribe_audio_to_notes, logger, load_env

app = FastAPI(
    title="HealthScribe — Clinical Audio Transcription & Summary Service",
    description="Independent service to transcribe patient-doctor audio encounters and generate clinical notes, summaries, and key objectives.",
    version="1.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/healthscribe/config")
def get_config():
    """Returns configuration details, such as whether a live Gemini API key is configured."""
    load_env()
    has_api_key = bool(os.environ.get("GEMINI_API_KEY"))
    return {
        "live_transcription_enabled": has_api_key,
        "mode": "live" if has_api_key else "mock/demo"
    }

@app.post("/api/healthscribe/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Upload an audio file to transcribe it and generate summary/notes.
    Accepts standard audio formats (mp3, wav, m4a, ogg, etc.).
    """
    logger.info(f"Received transcription request for file: {file.filename}")
    
    # Save the uploaded file to a temporary file path
    suffix = os.path.splitext(file.filename)[1] if file.filename else ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = temp_file.name
        try:
            shutil.copyfileobj(file.file, temp_file)
        except Exception as e:
            logger.error(f"Failed to save uploaded file: {e}")
            raise HTTPException(status_code=500, detail="Failed to save uploaded audio file.")
            
    try:
        # Run transcription & summary generation
        results = transcribe_audio_to_notes(temp_path, file.filename or "")
        return results
    except Exception as e:
        logger.error(f"Error during audio processing: {e}")
        raise HTTPException(status_code=500, detail=f"Audio transcription service error: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            logger.info("Cleaned up temporary local audio file.")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
