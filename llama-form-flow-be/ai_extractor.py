from PIL import Image
from io import BytesIO
import base64
import json
from openai import OpenAI
import os
from dotenv import load_dotenv
from pdf2image import convert_from_path


class FormExtraction:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(
            api_key=os.getenv("LLAMA_API_KEY"),
            base_url="https://api.llama.com/compat/v1/"
        )
    
    def _convert_to_base64(self, image):
        """Convert PIL Image to base64 string"""
        image_io = BytesIO()
        image.save(image_io, format='PNG')
        return base64.b64encode(image_io.getvalue()).decode()
        
    def _parse_llama_response(self, response_text):
        """Parse the Llama API response and ensure it's valid JSON"""
        # Remove markdown code block formatting if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1]
        if "```" in response_text:
            response_text = response_text.split("```")[0]
        
        # Clean up any whitespace
        response_text = response_text.strip()
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse Llama API response: {str(e)}")
    
    def extract_form_fields(self, file_path, session_path):
        """
        Extract form fields from an image file (PDF, PNG, JPG, etc.)
        Returns a JSON object containing form field information
        """
        # Handle PDF files
        image = Image.open(file_path)
        image_width, image_height = image.size
        image_width_minus_1 = image_width - 1
        image_height_minus_1 = image_height - 1
        
        # Convert image to base64
        image_base64 = self._convert_to_base64(image)
        
        # Create chat completion request
        completion = self.client.chat.completions.create(
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=[
                {
                    "role": "developer",
                    "content": f"""
You are a world-class AI system specialized in form understanding and document intelligence. Your task is to analyze a scanned form image and extract all user-fillable input fields.The image below has been rendered at a resolution of **300 DPI**, and its pixel dimensions are **{image_width}x{image_height}**. All bounding boxes you return must match this exact coordinate system. Return the bounding box in **[x, y, width, height]** in **pixels**, aligned with the original image dimensions, starting at the top-left corner.

The image below is a single‐page scanned png image rendered at exactly 300 DPI with pixel dimensions **{image_width}×{image_height}**. 
That means the top‐left pixel is (0,0)  and the bottom‐right pixel is ({image_width_minus_1},{image_height_minus_1}). 

**INSTRUCTIONS FOR BOUNDING BOXES:**
• All bounding boxes you return must be integer pixel coordinates in the range [0..{image_width_minus_1}] × [0..{image_height_minus_1}].  
• Use the format `[x, y, width, height]`, where `(x,y)` is the top‐left pixel of the field and `width`/`height` are in pixels.  
• DO NOT normalize or scale to [0–1]. DO NOT return any relative or percentage coordinates.  

**INSTRUCTIONS FOR INPUT FIELDS:**
For each input field, identify and return the following:
- inputfield: A unique name or identifier for the input field
- label: The text label or question associated with the input field
- normalized_label: The normalized label of the field, which is the label without any extra text or formatting for example "First Name" instead of "(a)First Name:"
- bounding_box: The bounding box of the field in (x, y, width, height) format
- context: A short snippet of surrounding text or layout to provide context for the field
- page: The page number (starting from 1)
- document_name: The name of the document
- inputfield_type: The type of input expected (e.g., text, checkbox, date, signature, radio)
- inputfield_confidence: Your confidence in this being a valid, user-fillable input field (0.0 - 1.0)

# Return the JSON array of input fields
Return a JSON array of objects — one for each input field — following this structure exactly:
[
  {{
    "inputfield": "first_name",
    "label": "First Name:",
    "normalized_label": "First Name",
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
            ],
        )

            # response_format={
            #     "type": "json_schema",
            #     "json_schema": {
            #         "schema": {
            #             "type": "array",
            #             "items": {
            #                 "type": "object",
            #                 "properties": {
            #                     "inputfield": {"type": "string"},
            #                     "label": {"type": "string"},
            #                     "normalized_label": {"type": "string"},
            #                     "bounding_box": {"type": "array"},
            #                     "context": {"type": "string"},
            #                     "page": {"type": "number"},
            #                     "document_name": {"type": "string"},
            #                     "inputfield_type": {"type": "string"},
            #                     "inputfield_confidence": {"type": "number"}
            #                 },
            #                 "required": ["inputfield", "label", "normalized_label", "bounding_box", "context", "page", "document_name", "inputfield_type", "inputfield_confidence"]
            #             }
            #         },
            #         "type": "array"
            #         }
            #     }        
        
        # Parse the response
        response_text = completion.choices[0].message.content
        response_json = self._parse_llama_response(response_text)

        # Create session directory if it doesn't exist
        os.makedirs(session_path, exist_ok=True)

        # save the response to a file
        response_file_path = os.path.join(session_path, "session.json")
        with open(response_file_path, "w") as f:
            json.dump(response_json, f)

        return response_json
        
                