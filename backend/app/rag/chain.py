"""
The end-to-end RAG chain: retrieve context -> build prompt -> call the LLM
-> return an answer (plus cited sources).

TODO: implement, e.g.

    from langchain_openai import ChatOpenAI
    from app.rag.retriever import get_relevant_chunks
    from app.core.config import settings

    def run_rag_chain(question: str, session_id: str | None = None) -> dict:
        chunks = get_relevant_chunks(question)
        context = "\\n\\n".join(c.page_content for c in chunks)
        llm = ChatOpenAI(model=settings.chat_model)
        prompt = f"Answer using only this context:\\n{context}\\n\\nQuestion: {question}"
        answer = llm.invoke(prompt)
        return {"answer": answer.content, "sources": chunks}
"""
