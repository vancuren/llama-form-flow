from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from extraction import FormExtraction
import tempfile
import os
from typing import List, Dict, Any
from pydantic import BaseModel
from preprocess import Preprocess
import json

app = FastAPI(
    title="Form Field Extraction API",
    description="API for extracting form fields from PDF and image files",
    version="1.0.0"
)

class FormSession(BaseModel):
    session_id: str
    fields: List[Dict] = []
    current_index: int = 0
    answers: Dict[str, str] = {}

# Initialize the form extractor and conversation handler
form_extractor = FormExtraction()
preprocess = Preprocess()

def load_session(session_id: str) -> FormSession:
    """Load a session from the session file"""
    session_path = os.path.join(preprocess.upload_folder, session_id)
    session_file = os.path.join(session_path, "session.json")
    
    if not os.path.exists(session_file):
        return FormSession(session_id=session_id)
    
    with open(session_file, "r") as f:
        fields = json.load(f)
        return FormSession(session_id=session_id, fields=fields)

@app.post("/preprocess")
async def preprocess_form(file: UploadFile):
    """
    Preprocess the form by converting it to a base64 string 
    and then returns that base64 string. to a frontend via a POST request.
    """
    return JSONResponse(content=preprocess.process_file(file))

@app.post("/extract")
async def extract_form_fields(session_id: str):
    """
    Extract form fields from an uploaded file (PDF, PNG, JPG, etc.)
    Args:
        session_id: The session id of the user
        
    Returns:
        List of dictionaries containing extracted form fields
    """
    session_path = os.path.join(preprocess.upload_folder, session_id)
    if not os.path.exists(session_path):
        raise HTTPException(
            status_code=404,
            detail=f"Session not found"
        )
    
    # get the file from the session path
    file_path = os.path.join(session_path, "image.png")
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"File not found"
        )
    try:
        results = form_extractor.extract_form_fields(file_path, session_path)
        return JSONResponse(content=results)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )
    
@app.get("/form/next")
def get_next_prompt(session_id: str):
    session = load_session(session_id)
    field = session.fields[session.current_index]
    print('field', field)
    prompt = f"The next field is: '{field['label']}' under '{field['context']}'. Can you please provide your {field['inputfield'].replace('_', ' ')}?"
    return {"prompt": prompt, "field": field}

# @app.post("/form/respond")
# def handle_response(session_id: str, user_input: str):
#     session = load_session(session_id)
#     field = session.fields[session.current_index]

#     # Use LLaMA to classify/understand input
#     response = openai.ChatCompletion.create(
#         model="llama-4-xxx",
#         messages=[
#             {"role": "system", "content": "You are helping fill out a government form."},
#             {"role": "user", "content": f"Field: {field['label']} ({field['context']})"},
#             {"role": "user", "content": f"User replied: {user_input}"},
#         ]
#     )

#     reply = response['choices'][0]['message']['content']

#     # Simple check to decide if user answered or asked a question
#     if "please clarify" in reply.lower() or "not sure" in reply.lower():
#         return {"followup": reply}

#     # Otherwise, save the answer and move on
#     session.answers[field["inputfield"]] = user_input
#     session.current_index += 1
#     save_session(session_id, session)

#     done = session.current_index >= len(session.fields)
#     return {"ack": "Field saved", "done": done}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
