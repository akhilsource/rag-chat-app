"""
Business logic that ties together app/rag/* for the API routes to call:
ingest a document end-to-end, answer a question end-to-end, etc.

TODO: implement, e.g.

    def ingest_document(file_path: str):
        docs = load_document(file_path)
        chunks = split_documents(docs)
        add_documents(chunks)

    def answer_question(question: str, session_id: str | None = None):
        return run_rag_chain(question, session_id=session_id)
"""
