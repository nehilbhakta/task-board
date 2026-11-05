from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    lists = relationship("BoardList", back_populates="board", cascade="all, delete-orphan", order_by="BoardList.position")


class BoardList(Base):
    __tablename__ = "lists"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    position = Column(Integer, default=0, nullable=False)
    board = relationship("Board", back_populates="lists")
    cards = relationship("Card", back_populates="list", cascade="all, delete-orphan", order_by="Card.position")


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("lists.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    priority = Column(String(20), default="medium", nullable=False)  # low | medium | high
    due_date = Column(Date, nullable=True)
    labels = Column(String(500), default="")  # comma-separated, kept simple and portable
    position = Column(Integer, default=0, nullable=False)
    list = relationship("BoardList", back_populates="cards")
