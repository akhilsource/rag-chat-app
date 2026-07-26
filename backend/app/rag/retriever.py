"""
Retrieval logic sitting on top of the vector store: top-k selection,
optional metadata filters, optional reranking.

TODO: implement, e.g.

    def get_relevant_chunks(query: str, k: int = 4, filters: dict | None = None):
        return similarity_search(query, k=k)
"""
