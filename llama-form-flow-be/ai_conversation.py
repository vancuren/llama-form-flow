from openai import OpenAI
import os
from dotenv import load_dotenv
import json


class FormConversation:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(
            api_key=os.getenv("LLAMA_API_KEY"),
            base_url="https://api.llama.com/compat/v1/"
        )

    def get_next_field_prompt(self, field, last_response):
        prompt = f"""
            You are a super friendly and helpful AI form assistant. You're guiding a user step-by-step through filling out a form they uploaded. 

            Your job is to turn the next form field into a natural, polite, and easy-to-understand question that can be asked in a chat conversation.

            Here’s the next field to ask the user about:
            - Field Label: "{field['label']}"
            - Field Context: "{field['context']}"
            - Last Response: "{last_response}"

            Generate a short and friendly question based on the field label and context. Avoid repeating the field label verbatim — instead, make it conversational. For example:
            - Label: "Date of Birth" → Question: "What’s your date of birth?"
            - Label: "Employer" under context "Current job information" → Question: "Who do you currently work for?"
            - Label: "Phone" → Question: "What’s the best phone number to reach you at?"

            If the user's previous question or answer was in a different language, continue in that langugage.

            Respond with just the question.
        """

        completion = self.client.chat.completions.create(
            model="Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=[
                {
                    "role": "developer",
                    "content": prompt
                }
            ]
        )

        return completion.choices[0].message.content.strip()

    
        
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
    

    def get_next_field_answer_prompt(self, field, answer, last_response):
            context = f"""
                You are a form validation assistant helping users fill out structured documents.

                Your task is to evaluate this response and return a JSON object with the following fields:

                - "answer": string — the user's provided answer.
                - "is_valid": boolean — is this a valid input for the field?
                - "invalid_reason": string — if invalid, explain briefly why (empty if valid).
                - "is_followup": boolean — does the user seem confused or require clarification?
                - "followup_prompt": string — if follow-up is needed, provide a clear next question or instruction (empty if not).

                ## Guidelines:
                - If the answer format is incorrect or incomplete, mark it as invalid and give a reason.
                - If the user expresses confusion (e.g. “I'm not sure” or asks a question), mark is_followup as true and provide helpful guidance.
                - Be concise, direct, and only return a **valid JSON object** as shown in the examples below.

                ## Example 1: Valid answer
                {{
                    "answer": "John Doe",
                    "is_valid": true,
                    "invalid_reason": "",
                    "is_followup": false,
                    "followup_prompt": ""
                }}

                ## Example 2: Invalid answer
                {{
                    "answer": "Blue",
                    "is_valid": false,
                    "invalid_reason": "Expected a full name, but the answer is a color.",
                    "is_followup": false,
                    "followup_prompt": ""
                }}

                ## Example 3: User needs help
                {{
                    "answer": "What should I put here?",
                    "is_valid": true,
                    "invalid_reason": "",
                    "is_followup": true,
                    "followup_prompt": "This field requires your legal full name as it appears on official documents."
                }}

                Please return only a JSON object.
            """

            prompt = f"""
                The user has provided an answer for the form field labeled '{field['label']}', which appears in the context of '{field['context']}'. Their response was:

                "{answer}"

                Your last response to the user was:

                "{last_response}"
                
                If the user's previous question or answer was in a different language, continue in that langugage.
            """


            # Create chat completion request
            completion = self.client.chat.completions.create(
                model="Llama-4-Maverick-17B-128E-Instruct-FP8",
                messages=[
                    {
                        "role": "developer",
                        "content": context
                    },
                    {
                        "role": "user",
                        "content": [
                            { "type": "text", "text": prompt },
                        ]
                    }
                ]
            )

            print(completion.choices[0].message.content)
            return self._parse_llama_response(completion.choices[0].message.content)

    def get_next_field_answer(self, field, answer, last_response):
        return self.get_next_field_answer_prompt(field, answer, last_response)