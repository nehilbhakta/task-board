"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Board } from "@/lib/api";

export default function HomePage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .listBoards()
      .then(setBoards)
      .catch(() => setError("Could not load boards. Is the backend running?"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  async function createBoard(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setError("");
    try {
      await api.createBoard(title.trim(), description.trim());
      setTitle("");
      setDescription("");
      await load();
    } catch {
      setError("Could not create the board. Check the backend and try again.");
    }
  }

  async function deleteBoard(id: number) {
    if (!window.confirm("Delete this board and all of its lists and cards?")) return;
    await api.deleteBoard(id);
    await load();
  }

  if (loading) return <p>Loading boards…</p>;

  return (
    <>
      <section className="hero">
        <h1>Your boards</h1>
        <p className="tagline">Boards, lists, and cards — drag a card to move it.</p>
      </section>
      {error && <p className="error">{error}</p>}

      <section className="create-panel" id="create-board">
        <h2>Create a board</h2>
        <form onSubmit={createBoard} className="form-stack">
          <label>
            Board title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website launch" />
          </label>
          <label>
            Description (optional)
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this board for?" />
          </label>
          <div>
            <button type="submit">Create board</button>
          </div>
        </form>
      </section>

      {boards.length === 0 ? (
        <p className="empty">
          No boards yet. Create one above, or seed the demo board from the backend
          with <code>python -m app.seed</code>.
        </p>
      ) : (
        <div className="board-grid">
          {boards.map((board) => {
            const total = board.lists.reduce((n, list) => n + list.cards.length, 0);
            const doneList = board.lists.find((list) => list.title.trim().toLowerCase() === "done");
            const done = doneList ? doneList.cards.length : null;
            const progress = done === null || total === 0 ? null : Math.round((done / total) * 100);
            return (
              <div key={board.id} className="board-card">
                <Link href={`/boards/${board.id}`}>
                  <h2>{board.title}</h2>
                </Link>
                <p className="muted">{board.description || "No description"}</p>
                <p className="muted">
                  {board.lists.length} lists · {total} cards
                  {done !== null ? ` · ${done} of ${total} done` : ""}
                </p>
                {progress !== null && (
                  <div className="progress" aria-label={`${progress}% done`}>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                )}
                <button type="button" className="secondary danger" onClick={() => deleteBoard(board.id)}>
                  Delete board
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
