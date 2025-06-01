from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import FileResponse
from db.session import init_db, get_session, create_or_update_session, update_session_answer
from contextlib import asynccontextmanager
from pathlib import Path
import uuid
from PIL import Image
from pdf2image import convert_from_path
from fastapi.responses import JSONResponse

from fastapi.middleware.cors import CORSMiddleware


UPLOAD_ROOT = Path("uploads")

from ai_extractor import FormExtraction
from ai_conversation import FormConversation

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or "*" for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/form/restore")
async def restore_form(session_id: str):
    session = await get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    return {"session_id": session_id, "field_count": len(session.fields), "fields": session.fields}


@app.post("/form/start")
async def start_form(file: UploadFile = File(...)):
    # Step 1: Generate session ID
    session_id = str(uuid.uuid4())

    # Step 2: Create session upload folder
    session_dir = UPLOAD_ROOT / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    # Step 3: Save original uploaded file
    original_path = session_dir / file.filename
    with open(original_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Step 4: Convert to PNG
    normalized_path = session_dir / "normalized.png"
    print(f"Converting {original_path} to {normalized_path}")
    if file.filename.lower().endswith(".pdf"):
        images = convert_from_path(original_path, dpi=300)
        images[0].save(normalized_path, "PNG")
    else:
        img = Image.open(original_path).convert("RGB")
        img.save(normalized_path)

    print(f"Converted {original_path} to {normalized_path}")
    image_width, image_height = Image.open(normalized_path).size

    # Step 5: Extract fields using your extractor
    extratr = FormExtraction()
    fields = extratr.extract_form_fields(normalized_path, session_dir)

    print(f"Extracted {len(fields)} fields")

    # Step 6: Store session in DB
    await create_or_update_session(session_id=session_id, fields=fields, image_width=image_width, image_height=image_height)

    print(f"Stored session {session_id} in DB")


    print(f"Returning {session_id} with {len(fields)} fields")
    return {"session_id": session_id, "field_count": len(fields), "fields": fields}



# @app.post("/form/start")
# async def start_form(file: UploadFile = File(...)):
#     session_id = '91c92334-d1d5-4fce-8c31-8b5988124f59'
#     fields = 2
#     return {"session_id": session_id, "field_count": fields}

@app.get("/form/render")
async def render_form(session_id: str):
    session_dir = UPLOAD_ROOT / session_id
    normalized_path = session_dir / "normalized.png"
    # return the png image of the form
    return FileResponse(normalized_path)

@app.get("/form/next")
async def get_next(session_id: str, last_response: str):
    session = await get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    if session.current_index >= len(session.fields):
        return {"done": True}
    field = session.fields[session.current_index]
    # return {"field": field, "prompt": f"Can you provide {field['label']}?"}
    return {
        "field": field, 
        "fields": session.fields,
        "prompt": FormConversation().get_next_field_prompt(field, last_response)
    }

@app.post("/form/respond")
async def respond(payload: dict):
    session_id = payload["session_id"]
    user_input = payload["user_input"]
    last_response = payload["last_response"]

    session = await get_session(session_id)
    field = session.fields[session.current_index]

    answer = FormConversation().get_next_field_answer(field, user_input, last_response)

    response = {
        "done": False,
        "next": False,
        "user_input": payload["user_input"],
        "field": field,
        "fields": session.fields,
        "followup": "",
        "error": ""
    }

    if answer["is_followup"]:
        response["followup"] = answer["followup_prompt"]
        return response
    elif answer["is_valid"]:
        await update_session_answer(session_id, field["inputfield"], answer["answer"])
        if session.current_index + 1 >= len(session.fields):
            response["done"] = True
            response["next"] = False
            response["followup"] = ""
            return response
        response["next"] = True
        response["field"] = session.fields[session.current_index + 1]
        return response
    else:
        if answer["invalid_reason"] != "":
            response["error"] = answer["invalid_reason"]
        else:
            response["error"] = "Unknown error"
        return response

# @app.post("/form/respond")
# async def respond(payload: dict):
#     session_id = payload["session_id"]
#     user_input = payload["user_input"]

#     session = await get_session(session_id)
#     field = session.fields[session.current_index]
#     await update_session_answer(session_id, field["inputfield"], user_input)

#     if session.current_index + 1 >= len(session.fields):
#         return {"done": True}
#     return {"done": False}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)