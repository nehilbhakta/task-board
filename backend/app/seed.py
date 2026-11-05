"""Seed one demo board. Run: python -m app.seed (from backend/)."""

from datetime import date, timedelta

from .database import Base, SessionLocal, engine
from .models import Board, BoardList, Card

SAMPLES = {
    "Backlog": [
        ("Add dark mode toggle", "Persist the theme choice and respect the system preference on first load.", "low", "frontend", 14),
        ("Write onboarding docs for new contributors", "Cover setup, branching, and how to run tests locally.", "low", "docs", 21),
    ],
    "In Progress": [
        ("Build the checkout form", "Validate card details client-side and show clear errors before submitting.", "high", "frontend,payments", 5),
        ("Add pagination to the orders API", "Default to 20 items per page and return total count in the response.", "medium", "backend", 7),
    ],
    "In Review": [
        ("Refactor the auth middleware", "Split token verification out of the route handlers so it can be tested alone.", "medium", "backend", 3),
    ],
    "Done": [
        ("Set up CI for pull requests", "Run lint, tests, and the frontend build on every pull request.", "medium", "devops", -2),
        ("Design the empty board state", "Show a helpful first-run message instead of a blank page.", "low", "design", -9),
    ],
}


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Board).first():
            print("Database already has a board; skipping seed.")
            return
        board = Board(title="Product Launch", description="Planning board for the next release of our web app.")
        db.add(board)
        db.flush()
        today = date.today()
        for list_position, (list_title, cards) in enumerate(SAMPLES.items()):
            board_list = BoardList(board_id=board.id, title=list_title, position=list_position)
            db.add(board_list)
            db.flush()
            for card_position, (title, description, priority, labels, day_offset) in enumerate(cards):
                db.add(
                    Card(
                        list_id=board_list.id,
                        title=title,
                        description=description,
                        priority=priority,
                        due_date=today + timedelta(days=day_offset),
                        labels=labels,
                        position=card_position,
                    )
                )
        db.commit()
        print(f"Seeded board '{board.title}' with {sum(len(v) for v in SAMPLES.values())} cards.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
