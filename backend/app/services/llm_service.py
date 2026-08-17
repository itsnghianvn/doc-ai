from google import genai
from app.core.config import settings


class LLMService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    def generate_answer(
        self,
        question: str,
        context: str,
        history: list[dict] | None = None,
    ) -> str:

        history_text = ""

        if history:
            history_text = "\n\nConversation history:\n" + "\n".join(
                f"{message['role']}: {message['content']}"
                for message in history
            )

        prompt = f"""
            You are a helpful AI assistant.

            Answer ONLY using the information from the provided document context.

            Use the conversation history to understand references and follow-up questions.

            If the answer is not contained in the document context, say:
            "I don't know based on the provided document."

            Document context:
            {context}

            {history_text}

            Current question:
            {question}

            Answer:
            """

        response = self.client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )

        return response.text