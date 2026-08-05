from app.services.llm_service import LLMService

llm = LLMService()

context = """
Artificial Intelligence is widely used in healthcare.

AI assists doctors in diagnosing diseases.

AI is also used in drug discovery.
"""

question = "How is AI used in healthcare?"

answer = llm.generate_answer(question, context)

print(answer)