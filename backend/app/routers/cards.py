from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from .lists import _get_list_or_404

router = APIRouter(tags=["cards"])
PRIORITIES = {"low", "medium", "high"}


def _renumber(db: Session, list_id: int) -> None:
    """Keep positions gapless after a move or delete, so the UI order is stable."""
    cards = (
        db.query(models.Card)
        .filter(models.Card.list_id == list_id)
        .order_by(models.Card.position, models.Card.id)
        .all()
    )
    for index, card in enumerate(cards):
        card.position = index
    db.flush()


def _validate_priority(priority: str) -> None:
    if priority not in PRIORITIES:
        raise HTTPException(status_code=422, detail="priority must be low, medium or high")


@router.get("/api/boards/{board_id}/cards", response_model=list[schemas.CardOut])
def search_cards(
    board_id: int,
    q: str = Query(default=""),
    priority: str = Query(default=""),
    label: str = Query(default=""),
    db: Session = Depends(get_db),
):
    list_ids = [row[0] for row in db.query(models.BoardList.id).filter(models.BoardList.board_id == board_id).all()]
    query = db.query(models.Card).filter(models.Card.list_id.in_(list_ids))
    if q:
        like = f"%{q}%"
        query = query.filter(or_(models.Card.title.ilike(like), models.Card.description.ilike(like)))
    if priority:
        query = query.filter(models.Card.priority == priority)
    if label:
        query = query.filter(models.Card.labels.ilike(f"%{label}%"))
    return query.order_by(models.Card.list_id, models.Card.position).all()


@router.post("/api/lists/{list_id}/cards", response_model=schemas.CardOut, status_code=201)
def create_card(list_id: int, payload: schemas.CardCreate, db: Session = Depends(get_db)):
    item = _get_list_or_404(db, list_id)
    _validate_priority(payload.priority)
    card = models.Card(
        list_id=item.id,
        title=payload.title.strip(),
        description=payload.description,
        priority=payload.priority,
        due_date=payload.due_date,
        labels=payload.labels,
        position=len(item.cards),
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.get("/api/cards/{card_id}", response_model=schemas.CardOut)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.patch("/api/cards/{card_id}", response_model=schemas.CardOut)
def update_card(card_id: int, payload: schemas.CardUpdate, db: Session = Depends(get_db)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if payload.priority is not None:
        _validate_priority(payload.priority)
    for field in ("title", "description", "priority", "due_date", "labels"):
        value = getattr(payload, field)
        if value is not None:
            setattr(card, field, value.strip() if field == "title" else value)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/api/cards/{card_id}", status_code=204)
def delete_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    list_id = card.list_id
    db.delete(card)
    db.flush()
    _renumber(db, list_id)
    db.commit()
    return None


@router.post("/api/cards/{card_id}/move", response_model=schemas.CardOut)
def move_card(card_id: int, payload: schemas.CardMove, db: Session = Depends(get_db)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    target = _get_list_or_404(db, payload.list_id)
    source_list_id = card.list_id
    # Temporarily park the card so renumbering the source list does not collide.
    card.list_id = target.id
    card.position = 10_000
    db.flush()
    _renumber(db, source_list_id)
    if source_list_id != target.id:
        _renumber(db, target.id)
    siblings = (
        db.query(models.Card)
        .filter(models.Card.list_id == target.id, models.Card.id != card.id)
        .order_by(models.Card.position, models.Card.id)
        .all()
    )
    index = max(0, min(payload.position, len(siblings)))
    siblings.insert(index, card)
    for position, item in enumerate(siblings):
        item.position = position
    db.commit()
    db.refresh(card)
    return card
