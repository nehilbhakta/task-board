"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CardDialog from "@/components/CardDialog";
import { api, formatDate, labelsOf, type Board, type Card } from "@/lib/api";

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const boardId = Number(id);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState<Record<number, string>>({});
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [dragOverList, setDragOverList] = useState<number | null>(null);
  const [draggingCard, setDraggingCard] = useState<number | null>(null);

  // Compare calendar dates only, in local time: parsing "YYYY-MM-DD" with
  // parts avoids the UTC-midnight shift that new Date("2026-11-04") causes.
  // Cards in the Done list are finished, so they are never "overdue" or
  // "due today" no matter what their due date says.
  function dueStatus(dueDate: string | null, done: boolean): "overdue" | "today" | "" {
    if (!dueDate || done) return "";
    const [year, month, day] = dueDate.split("-").map(Number);
    const due = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due.getTime() < today.getTime()) return "overdue";
    if (due.getTime() === today.getTime()) return "today";
    return "";
  }

  function dueLabel(card: Card, done: boolean): string {
    const status = dueStatus(card.due_date, done);
    if (status === "overdue") return `Overdue · Due ${formatDate(card.due_date)}`;
    if (status === "today") return `Due today · ${formatDate(card.due_date)}`;
    return `Due ${formatDate(card.due_date)}`;
  }

  const load = useCallback(
    () =>
      api
        .getBoard(boardId)
        .then(setBoard)
        .catch(() => setError("Could not load this board. Is the backend running?")),
    [boardId],
  );

  useEffect(() => {
    load();
  }, [load]);

  function matches(card: Card): boolean {
    const needle = search.trim().toLowerCase();
    const textOk =
      !needle ||
      card.title.toLowerCase().includes(needle) ||
      card.description.toLowerCase().includes(needle) ||
      labelsOf(card).some((label) => label.toLowerCase().includes(needle));
    const priorityOk = priorityFilter === "all" || card.priority === priorityFilter;
    return textOk && priorityOk;
  }

  async function createList(event: React.FormEvent) {
    event.preventDefault();
    if (!newListTitle.trim()) return;
    await api.createList(boardId, newListTitle.trim());
    setNewListTitle("");
    await load();
  }

  async function createCard(listId: number) {
    const title = (newCardTitle[listId] ?? "").trim();
    if (!title) return;
    await api.createCard(listId, { title });
    setNewCardTitle((prev) => ({ ...prev, [listId]: "" }));
    await load();
  }

  async function handleDrop(event: React.DragEvent, listId: number, position: number) {
    event.preventDefault();
    setDragOverList(null);
    setDraggingCard(null);
    const cardId = Number(event.dataTransfer.getData("text/plain"));
    if (!cardId) return;
    try {
      await api.moveCard(cardId, listId, position);
      await load();
    } catch {
      setError("Could not move the card. Try again.");
    }
  }

  if (!board) return <p>{error || "Loading board…"}</p>;

  return (
    <>
      <p>
        <Link href="/">← All boards</Link>
      </p>
      <h1>{board.title}</h1>
      {board.description && <p className="muted">{board.description}</p>}
      {error && <p className="error">{error}</p>}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search cards…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search cards"
        />
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} aria-label="Filter by priority">
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <form onSubmit={createList} className="row" style={{ marginLeft: "auto" }}>
          <input
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="New list title"
            aria-label="New list title"
          />
          <button type="submit">Add list</button>
        </form>
      </div>

      <div className="columns">
        {board.lists.map((list) => {
          const visible = list.cards.filter(matches);
          const isDoneList = list.title.trim().toLowerCase() === "done";
          return (
            <section
              key={list.id}
              className={`column ${dragOverList === list.id ? "drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverList(list.id);
              }}
              onDragLeave={() => setDragOverList(null)}
              onDrop={(e) => handleDrop(e, list.id, visible.length)}
            >
              <div className="column-head">
                <h2>
                  {list.title} <span className="count">({visible.length})</span>
                </h2>
                <button
                  type="button"
                  className="secondary danger"
                  onClick={async () => {
                    if (window.confirm(`Delete the “${list.title}” list and its cards?`)) {
                      await api.deleteList(list.id);
                      await load();
                    }
                  }}
                >
                  Delete
                </button>
              </div>

              {visible.length === 0 && <p className="drop-hint">Drop cards here</p>}

              {visible.map((card) => (
                <article
                  key={card.id}
                  className={`task-card${draggingCard === card.id ? " dragging" : ""}`}
                  draggable
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${card.title}`}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", String(card.id));
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingCard(card.id);
                  }}
                  onDragEnd={() => setDraggingCard(null)}
                  onClick={() => setSelectedCard(card)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCard(card);
                    }
                  }}
                >
                  <h3>{card.title}</h3>
                  {card.description && <p>{card.description}</p>}
                  <div className="meta">
                    <span className={`pill ${card.priority}`}>{card.priority}</span>
                    {labelsOf(card).map((label) => (
                      <span key={label} className="pill label">
                        {label}
                      </span>
                    ))}
                    {card.due_date && <span className={`due ${dueStatus(card.due_date, isDoneList)}`}>{dueLabel(card, isDoneList)}</span>}
                  </div>
                </article>
              ))}

              <div className="row">
                <input
                  value={newCardTitle[list.id] ?? ""}
                  onChange={(e) => setNewCardTitle((prev) => ({ ...prev, [list.id]: e.target.value }))}
                  placeholder="New card title"
                  aria-label={`New card title for ${list.title}`}
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createCard(list.id);
                    }
                  }}
                />
                <button type="button" onClick={() => createCard(list.id)}>
                  Add
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {board.lists.length === 0 && <p className="empty">This board has no lists yet. Add one above.</p>}

      {selectedCard && (
        <CardDialog
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onSaved={async () => {
            setSelectedCard(null);
            await load();
          }}
        />
      )}
    </>
  );
}
