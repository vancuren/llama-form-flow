pcompletion = client.chat.completions.create(
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
