"use client";

import { useEffect, useState } from "react";
import { api, type Card } from "@/lib/api";

type Props = {
  card: Card;
  onClose: () => void;
  onSaved: () => void;
};

export default function CardDialog({ card, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [priority, setPriority] = useState<Card["priority"]>(card.priority);
  const [dueDate, setDueDate] = useState(card.due_date ?? "");
  const [labels, setLabels] = useState(card.labels);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await api.updateCard(card.id, {
        title: title.trim(),
        description,
        priority,
        due_date: dueDate || null,
        labels,
      });
      onSaved();
    } catch {
      setError("Could not save the card. Check the backend and try again.");
    }
  }

  async function remove() {
    if (!window.confirm("Delete this card?")) return;
    await api.deleteCard(card.id);
    onSaved();
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Edit card" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Edit card</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={save} className="form-stack">
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="row">
            <label style={{ flex: 1 }}>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value as Card["priority"])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label style={{ flex: 1 }}>
              Due date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>
          <label>
            Labels (comma-separated)
            <input value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="frontend, backend" />
          </label>
          <div className="row">
            <button type="submit">Save changes</button>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="danger" onClick={remove}>
              Delete card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
