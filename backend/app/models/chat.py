"""
SQLAlchemy models for chat sessions and messages.

TODO: implement, e.g.

    class ChatSession(Base):
        __tablename__ = "chat_sessions"
        id = Column(String, primary_key=True)
        user_id = Column(String, ForeignKey("users.id"))
        created_at = Column(DateTime, default=datetime.utcnow)

    class ChatMessage(Base):
        __tablename__ = "chat_messages"
        id = Column(Integer, primary_key=True, autoincrement=True)
        session_id = Column(String, ForeignKey("chat_sessions.id"))
        role = Column(String)      # "user" | "assistant"
        content = Column(Text)
        created_at = Column(DateTime, default=datetime.utcnow)
"""
