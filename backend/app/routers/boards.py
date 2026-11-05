from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/boards", tags=["boards"])


def _get_board_or_404(db: Session, board_id: int) -> models.Board:
    board = db.query(models.Board).filter(models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.get("", response_model=list[schemas.BoardOut])
def list_boards(db: Session = Depends(get_db)):
    return db.query(models.Board).order_by(models.Board.id).all()


@router.post("", response_model=schemas.BoardOut, status_code=201)
def create_board(payload: schemas.BoardCreate, db: Session = Depends(get_db)):
    board = models.Board(title=payload.title.strip(), description=payload.description)
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.get("/{board_id}", response_model=schemas.BoardOut)
def get_board(board_id: int, db: Session = Depends(get_db)):
    return _get_board_or_404(db, board_id)


@router.patch("/{board_id}", response_model=schemas.BoardOut)
def update_board(board_id: int, payload: schemas.BoardUpdate, db: Session = Depends(get_db)):
    board = _get_board_or_404(db, board_id)
    if payload.title is not None:
        board.title = payload.title.strip()
    if payload.description is not None:
        board.description = payload.description
    db.commit()
    db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=204)
def delete_board(board_id: int, db: Session = Depends(get_db)):
    board = _get_board_or_404(db, board_id)
    db.delete(board)
    db.commit()
    return None
