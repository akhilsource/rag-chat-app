"""
Document loading.

Turns raw uploaded files (PDF, DOCX, TXT, URLs, ...) into plain text /
LangChain `Document` objects for downstream chunking.

TODO: implement, e.g.

    from langchain_community.document_loaders import PyPDFLoader, TextLoader

    def load_document(file_path: str) -> list[Document]:
        if file_path.endswith(".pdf"):
            return PyPDFLoader(file_path).load()
        return TextLoader(file_path).load()
"""
