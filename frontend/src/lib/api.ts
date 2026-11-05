export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Card = {
  id: number;
  list_id: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  labels: string;
  position: number;
};

export type BoardList = {
  id: number;
  board_id: number;
  title: string;
  position: number;
  cards: Card[];
};

export type Board = {
  id: number;
  title: string;
  description: string;
  lists: BoardList[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listBoards: () => request<Board[]>("/api/boards"),
  getBoard: (id: number) => request<Board>(`/api/boards/${id}`),
  createBoard: (title: string, description: string) =>
    request<Board>("/api/boards", { method: "POST", body: JSON.stringify({ title, description }) }),
  deleteBoard: (id: number) => request<void>(`/api/boards/${id}`, { method: "DELETE" }),
  createList: (boardId: number, title: string) =>
    request<BoardList>(`/api/boards/${boardId}/lists`, { method: "POST", body: JSON.stringify({ title }) }),
  deleteList: (id: number) => request<void>(`/api/lists/${id}`, { method: "DELETE" }),
  createCard: (listId: number, card: Partial<Card> & { title: string }) =>
    request<Card>(`/api/lists/${listId}/cards`, { method: "POST", body: JSON.stringify(card) }),
  updateCard: (id: number, card: Partial<Card>) =>
    request<Card>(`/api/cards/${id}`, { method: "PATCH", body: JSON.stringify(card) }),
  deleteCard: (id: number) => request<void>(`/api/cards/${id}`, { method: "DELETE" }),
  moveCard: (id: number, listId: number, position: number) =>
    request<Card>(`/api/cards/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ list_id: listId, position }),
    }),
};

export function formatDate(value: string | null): string {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function labelsOf(card: Card): string[] {
  return card.labels.split(",").map((label) => label.trim()).filter(Boolean);
}
