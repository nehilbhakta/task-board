from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from .boards import _get_board_or_404

router = APIRouter(tags=["lists"])


def _get_list_or_404(db: Session, list_id: int) -> models.BoardList:
    item = db.query(models.BoardList).filter(models.BoardList.id == list_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="List not found")
    return item


@router.post("/api/boards/{board_id}/lists", response_model=schemas.ListOut, status_code=201)
def create_list(board_id: int, payload: schemas.ListCreate, db: Session = Depends(get_db)):
    board = _get_board_or_404(db, board_id)
    position = len(board.lists)
    item = models.BoardList(board_id=board.id, title=payload.title.strip(), position=position)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/api/lists/{list_id}", response_model=schemas.ListOut)
def update_list(list_id: int, payload: schemas.ListUpdate, db: Session = Depends(get_db)):
    item = _get_list_or_404(db, list_id)
    if payload.title is not None:
        item.title = payload.title.strip()
    if payload.position is not None:
        item.position = payload.position
    db.commit()
    db.refresh(item)
    return item


@router.delete("/api/lists/{list_id}", status_code=204)
def delete_list(list_id: int, db: Session = Depends(get_db)):
    item = _get_list_or_404(db, list_id)
    db.delete(item)
    db.commit()
    return None
