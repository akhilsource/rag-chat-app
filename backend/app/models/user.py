"""
SQLAlchemy User model (optional — only needed if this API keeps its own
user records rather than relying solely on Firebase + JWT claims).

TODO: implement, e.g.

    from sqlalchemy import Column, String
    from app.db.base import Base

    class User(Base):
        __tablename__ = "users"
        id = Column(String, primary_key=True)       # Firebase UID
        email = Column(String, unique=True, index=True)
        display_name = Column(String, nullable=True)
"""
