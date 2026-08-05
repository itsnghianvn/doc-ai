from app.services.rag_service import RAGService

rag = RAGService()

question = "How is AI used in healthcare?"

answer = rag.ask(question)

print("=" * 50)
print(question)
print("=" * 50)
print(answer)