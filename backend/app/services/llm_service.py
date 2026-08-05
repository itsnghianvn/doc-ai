from google import genai
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )
    
    def generate_answer(self, question: str, context: str) -> str:

        prompt = f"""
            You are a helpful AI assistant.

            Answer ONLY using the information below.

            If the answer is not contained in the context, say:
            "I don't know based on the provided document."

            Context:
            {context}

            Question:
            {question}

            Answer:
            """

        response = self.client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )

        return response.text