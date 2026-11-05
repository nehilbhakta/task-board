def test_card_crud(client, board_with_lists):
    _, todo, _ = board_with_lists
    created = client.post(
        f"/api/lists/{todo['id']}/cards",
        json={"title": "Write tests", "priority": "high", "labels": "backend"},
    )
    assert created.status_code == 201
    card = created.json()
    assert card["title"] == "Write tests" and card["priority"] == "high"

    fetched = client.get(f"/api/cards/{card['id']}")
    assert fetched.status_code == 200 and fetched.json()["labels"] == "backend"

    updated = client.patch(f"/api/cards/{card['id']}", json={"priority": "low", "title": "Write unit tests"})
    assert updated.json()["priority"] == "low" and updated.json()["title"] == "Write unit tests"

    deleted = client.delete(f"/api/cards/{card['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/cards/{card['id']}").status_code == 404


def test_move_card_between_lists(client, board_with_lists):
    _, todo, done = board_with_lists
    first = client.post(f"/api/lists/{todo['id']}/cards", json={"title": "First"}).json()
    client.post(f"/api/lists/{todo['id']}/cards", json={"title": "Second"}).json()
    moved = client.post(f"/api/cards/{first['id']}/move", json={"list_id": done["id"], "position": 0})
    assert moved.status_code == 200
    assert moved.json()["list_id"] == done["id"] and moved.json()["position"] == 0

    board = client.get(f"/api/boards/{board_with_lists[0]['id']}").json()
    lists = {item["title"]: item for item in board["lists"]}
    assert [c["title"] for c in lists["Done"]["cards"]] == ["First"]
    assert [c["title"] for c in lists["To Do"]["cards"]] == ["Second"]


def test_search_and_priority_filter(client, board_with_lists):
    board, todo, _ = board_with_lists
    client.post(f"/api/lists/{todo['id']}/cards", json={"title": "Fix login bug", "priority": "high"}).json()
    client.post(f"/api/lists/{todo['id']}/cards", json={"title": "Update docs", "priority": "low"}).json()

    by_text = client.get(f"/api/boards/{board['id']}/cards", params={"q": "login"}).json()
    assert [c["title"] for c in by_text] == ["Fix login bug"]

    by_priority = client.get(f"/api/boards/{board['id']}/cards", params={"priority": "low"}).json()
    assert [c["title"] for c in by_priority] == ["Update docs"]


def test_invalid_priority_rejected(client, board_with_lists):
    _, todo, _ = board_with_lists
    response = client.post(f"/api/lists/{todo['id']}/cards", json={"title": "Bad", "priority": "urgent"})
    assert response.status_code == 422
