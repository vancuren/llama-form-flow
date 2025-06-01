from openai import OpenAI
import os
from dotenv import load_dotenv
import base64
from doc2vision import convert_to_llm_ready_images
from PIL import Image
from io import BytesIO
import json
from pdf2image import convert_from_path

load_dotenv()

client = OpenAI(
    api_key=os.getenv("LLAMA_API_KEY"),
    base_url="https://api.llama.com/compat/v1/"
)
# convert pdf to PIL image
# image = convert_to_llm_ready_images("fw4.pdf")[0]
# # convert PIL image to base64
# image_base64 = base64.b64encode(image.tobytes()).decode("utf-8")

pages = convert_from_path("fw4.pdf")
image_io = BytesIO()
pages[0].save(image_io, format='PNG')  # First page example
image_base64 = base64.b64encode(image_io.getvalue()).decode()


# print(image_base64)

# Create chat completion request
completion = client.chat.completions.create(
    model="Llama-4-Maverick-17B-128E-Instruct-FP8",
    messages=[
        {
            "role": "developer",
            "content": f"""
You are a world-class AI system specialized in form understanding and document intelligence. Your task is to analyze a scanned form image and extract all user-fillable input fields.

For each input field, identify and return the following:
- inputfield: A unique name or identifier for the input field
- label: The text label or question associated with the input field
- bounding_box: The bounding box of the field in (x, y, width, height) format
- context: A short snippet of surrounding text or layout to provide context for the field
- page: The page number (starting from 1)
- document_name: The name of the document
- inputfield_type: The type of input expected (e.g., text, checkbox, date, signature, radio)
- inputfield_confidence: Your confidence in this being a valid, user-fillable input field (0.0 - 1.0)

Return a JSON array of objects — one for each input field — following this structure exactly:
[
  {{
    "inputfield": "first_name",
    "label": "First Name:",
    "bounding_box": [120, 430, 200, 30],
    "context": "Please fill out the following personal information.",
    "page": 1,
    "document_name": "IRS Form 1040",
    "inputfield_type": "text",
    "inputfield_confidence": 0.97
  }},
  ...
]
"""
        },
        {
            "role": "user",
            "content": [
                { "type": "text", "text": "Please extract and return all form fields from the image below in the requested JSON format." },
                { "type": "image_url", "image_url": { "url": f"data:image/png;base64,{image_base64}" } }
            ]
        }
    ]
)


print(completion.choices[0].message.content)

results = json.loads(completion.choices[0].message.content)

print(results)