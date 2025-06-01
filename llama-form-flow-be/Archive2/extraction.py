# This file creates a class that takes a file (pdf, png, jpg, etc), converts it to a PIL image, 
# converts it to a base64 string, and then uses the llama api to extract the inputfields, labels, and bounding boxes.
# it then returns a JSON object with the inputfields, labels, and bounding boxes.

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
    
    def _process_pdf(self, file_path):
        """Convert PDF to PIL Image"""
        pages = convert_from_path(file_path)
        return pages[0]  # Return first page for now
    
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
        
        # Convert image to base64
        image_base64 = self._convert_to_base64(image)
        
        # Create chat completion request
        completion = self.client.chat.completions.create(
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=[
                {
                    "role": "developer",
                    "content": """
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
  {
    "inputfield": "first_name",
    "label": "First Name:",
    "bounding_box": [120, 430, 200, 30],
    "context": "Please fill out the following personal information.",
    "page": 1,
    "document_name": "IRS Form 1040",
    "inputfield_type": "text",
    "inputfield_confidence": 0.97
  },
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
        
        # Parse the response
        response_text = completion.choices[0].message.content
        response_json = self._parse_llama_response(response_text)

        # save the response to a file
        response_file_path = os.path.join(session_path, "session.json")
        with open(response_file_path, "w") as f:
            json.dump(response_json, f)

        return response_json
        
        