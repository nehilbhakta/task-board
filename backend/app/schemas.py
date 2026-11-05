from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class BoardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""


class BoardUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None


class ListCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class ListUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    position: Optional[int] = None


class CardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    priority: str = "medium"
    due_date: Optional[date] = None
    labels: str = ""


class CardUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    labels: Optional[str] = None


class CardMove(BaseModel):
    list_id: int
    position: int = 0


class CardOut(BaseModel):
    id: int
    list_id: int
    title: str
    description: str
    priority: str
    due_date: Optional[date]
    labels: str
    position: int

    model_config = ConfigDict(from_attributes=True)


class ListOut(BaseModel):
    id: int
    board_id: int
    title: str
    position: int
    cards: list[CardOut] = []

    model_config = ConfigDict(from_attributes=True)


class BoardOut(BaseModel):
    id: int
    title: str
    description: str
    lists: list[ListOut] = []

    model_config = ConfigDict(from_attributes=True)
