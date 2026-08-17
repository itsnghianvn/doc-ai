from google import genai

from app.core.config import settings


class QueryRewriteService:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    def rewrite(
        self,
        question: str,
        history: list[dict] | None = None,
    ) -> str:
        if not history:
            return question

        history_text = "\n".join(
            f"{message['role']}: {message['content']}"
            for message in history
        )

        prompt = f"""
            You are a query rewriting assistant for a document-based RAG system.

            Rewrite the user's latest question into a standalone search query.

            Use the conversation history to resolve references such as:
            - "what about business?"
            - "what about it?"
            - "how about transportation?"
            - "and finance?"

            Rules:
            - Preserve the user's intended meaning.
            - Resolve pronouns and omitted context.
            - Do not answer the question.
            - Return ONLY the rewritten search query.
            - If the question is already standalone, return it unchanged.

            Conversation history:
            {history_text}

            Latest question:
            {question}

            Rewritten search query:
            """

        response = self.client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )

        return response.text.strip()