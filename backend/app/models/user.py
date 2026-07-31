"""SQLAlchemy User model."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, index=True)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)

    documents: Mapped[list["Document"]] = relationship(back_populates="user")
    sessions: Mapped[list["ChatSession"]] = relationship(back_populates="user")
