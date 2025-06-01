# This file creates a class that takes a file (pdf, png, jpg, etc), converts it to a png image, 
# converts it to a base64 string, and then returns that base64 string. to a frontend via a POST request.

from PIL import Image
from io import BytesIO
import base64
import json
from openai import OpenAI
import os
from dotenv import load_dotenv
from pdf2image import convert_from_path

import uuid

class Preprocess:
    def __init__(self):
        self.upload_folder = "uploads"
        self.session_id = str(uuid.uuid4()) # unique session id for the user
        self.session_path = os.path.join(self.upload_folder, self.session_id)
        os.makedirs(self.session_path, exist_ok=True)

    def _process_pdf(self, file_path):
        """Convert PDF to PIL Image"""
        pages = convert_from_path(file_path)
        return pages[0]  # Return first page for now
    
    def process_file(self, file):
        """
        Extract form fields from an image file (PDF, PNG, JPG, etc.)
        Returns a JSON object containing form field information
        """
        file_path = file.filename

        # save the file to a folder
        file_path = os.path.join(self.session_path, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        # Handle different file types
        if file_path.lower().endswith('.pdf'):
            image = self._process_pdf(file_path)
            image.save(os.path.join(self.session_path, "image.png"))
        elif file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            image = Image.open(file_path)
            image.save(os.path.join(self.session_path, "image.png"))
        else:
            raise ValueError(f"Unsupported file type: {file_path}")
        
        # Convert image to base64
        image_io = BytesIO()
        image.save(image_io, format='PNG')

        return {
                # "image_base64": base64.b64encode(image_io.getvalue()).decode(),
                "session_path": self.session_path,
                "session_id": self.session_id
            }
        