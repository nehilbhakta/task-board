# TaskBoard

**Live app: https://nehilbhakta-taskboard.vercel.app**

A full-stack, Trello-style task board. I built it to practise owning both sides of a
real product: a FastAPI backend with a proper data model, and a Next.js frontend that
talks to it — drag-and-drop, filtering, and editing included, with no heavy UI library
in the way.

## Features

- Boards, lists, and cards — create, edit, and delete all three
- Drag-and-drop cards between lists (and reorder within a list) via HTML5 drag events
- Card details: description, priority (low / medium / high), due date, and labels
- Search cards by text, and filter by priority or label
- A seeded demo board ("Product Launch") with realistic software-project cards, so the
  app is useful on first run

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, custom CSS |
| Backend  | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite by default, PostgreSQL via `DATABASE_URL` |
| Tests    | pytest (backend) |

## Project structure

```
task-board/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router wiring
│   │   ├── database.py        # Engine/session, DATABASE_URL handling
│   │   ├── models.py          # Board, BoardList, Card
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── seed.py            # Demo board seed script
│   │   └── routers/
│   │       ├── boards.py      # Board CRUD
│   │       ├── lists.py       # List CRUD
│   │       └── cards.py       # Card CRUD, move, search/filter
│   ├── tests/
│   │   ├── conftest.py        # Isolated test database + TestClient
│   │   └── test_cards.py      # Card CRUD, move, search/filter, validation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Board list / home
│   │   │   ├── boards/[id]/page.tsx # Board view with columns
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/CardDialog.tsx # Card detail/edit dialog
│   │   └── lib/api.ts              # API client + types (reads NEXT_PUBLIC_API_URL)
│   ├── .env.example
│   └── package.json
└── README.md
```

## How to run

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed        # optional: creates the demo board
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`. To use PostgreSQL instead of SQLite, set
`DATABASE_URL` before starting, e.g. `DATABASE_URL=postgresql://user:pass@localhost/taskboard`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

The app runs at `http://localhost:3000`.

### Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest -q
```

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET / POST | `/api/boards` | List / create boards |
| GET / PATCH / DELETE | `/api/boards/{id}` | Get / update / delete a board (with lists and cards) |
| POST | `/api/boards/{board_id}/lists` | Create a list on a board |
| PATCH / DELETE | `/api/lists/{id}` | Update / delete a list |
| GET | `/api/boards/{board_id}/cards?q=&priority=&label=` | Search/filter cards on a board |
| POST | `/api/lists/{list_id}/cards` | Create a card in a list |
| GET / PATCH / DELETE | `/api/cards/{id}` | Get / update / delete a card |
| POST | `/api/cards/{id}/move` | Move a card to another list and position (`{list_id, position}`) |

## Live demo

The app is deployed and seeded with the "Product Launch" demo board: https://nehilbhakta-taskboard.vercel.app
