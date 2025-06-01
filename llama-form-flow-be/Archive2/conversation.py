# This file creates a class that takes takes a form and the next field the user wants to fill out,
# and then uses the llama api ask the user to provide a input value for that field
# Like "Ok let's move on to the next field. Can you please you provide your first name?"

from PIL import Image
from io import BytesIO
import base64
import json
from openai import OpenAI
import os
from dotenv import load_dotenv
from pdf2image import convert_from_path

class Conversation:
    def __init__(self):
        pass
    
    def initialize_form(self, form_fields):
        pass
    
    def get_next_field(self, form_fields):
        pass