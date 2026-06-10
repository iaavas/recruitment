import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db
from app.models import Base, User, Candidate, Score

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db_session", scope="function")
def db_session_fixture():
    # Bind the engine and create tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Run the database seed to create default roles, permissions, and admin user
    from app.seed import seed
    seed(db)
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(name="client", scope="function")
def client_fixture(db_session):
    # Override get_db dependency to yield our test db session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_apply_candidate(client):
    payload = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "role_applied": "Frontend Engineer",
        "skills": ["React", "TypeScript", "CSS"]
    }
    response = client.post("/candidates/apply", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "id" in data
    assert data["message"] == "Application submitted successfully"


def test_auth_enforcement(client):
    # 1. Register reviewer 1
    resp_r1 = client.post(
        "/auth/register",
        json={"email": "reviewer1@techkraft.internal", "password": "password123"}
    )
    assert resp_r1.status_code == 200
    
    # 2. Register reviewer 2
    resp_r2 = client.post(
        "/auth/register",
        json={"email": "reviewer2@techkraft.internal", "password": "password123"}
    )
    assert resp_r2.status_code == 200

    # 3. Log in reviewer 1 to get token
    login_r1 = client.post(
        "/auth/login",
        data={"username": "reviewer1@techkraft.internal", "password": "password123"}
    )
    assert login_r1.status_code == 200
    token_r1 = login_r1.json()["access_token"]
    headers_r1 = {"Authorization": f"Bearer {token_r1}"}

    # 4. Log in reviewer 2 to get token
    login_r2 = client.post(
        "/auth/login",
        data={"username": "reviewer2@techkraft.internal", "password": "password123"}
    )
    assert login_r2.status_code == 200
    token_r2 = login_r2.json()["access_token"]
    headers_r2 = {"Authorization": f"Bearer {token_r2}"}

    login_admin = client.post(
        "/auth/login",
        data={"username": "admin@techkraft.internal", "password": "changeme123"}
    )
    assert login_admin.status_code == 200
    token_admin = login_admin.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    # 6. Apply a candidate
    cand_resp = client.post(
        "/candidates/apply",
        json={
            "name": "Alex Smith",
            "email": "alex.smith@example.com",
            "role_applied": "Backend Engineer",
            "skills": ["Python", "FastAPI"]
        }
    )
    assert cand_resp.status_code == 200
    cand_id = cand_resp.json()["id"]

    score_resp1 = client.post(
        f"/candidates/{cand_id}/scores",
        json={"category": "Technical", "score": 4, "note": "Strong fundamentals"},
        headers=headers_r1
    )
    assert score_resp1.status_code == 200

    score_resp2 = client.post(
        f"/candidates/{cand_id}/scores",
        json={"category": "Communication", "score": 5, "note": "Very clear"},
        headers=headers_r2
    )
    assert score_resp2.status_code == 200

    detail_r1 = client.get(f"/candidates/{cand_id}", headers=headers_r1)
    assert detail_r1.status_code == 200
    data_r1 = detail_r1.json()
    assert len(data_r1["scores"]) == 1
    assert data_r1["scores"][0]["category"] == "Technical"
    assert data_r1["scores"][0]["score"] == 4
    assert data_r1["internal_notes"] is None

    # 10. Reviewer 2 retrieves Alex Smith detail
    # Should only see their own score (Communication: 5) and internal_notes should be null/absent
    detail_r2 = client.get(f"/candidates/{cand_id}", headers=headers_r2)
    assert detail_r2.status_code == 200
    data_r2 = detail_r2.json()
    assert len(data_r2["scores"]) == 1
    assert data_r2["scores"][0]["category"] == "Communication"
    assert data_r2["scores"][0]["score"] == 5
    assert data_r2["internal_notes"] is None

    # 11. Admin retrieves Alex Smith detail
    # Should see ALL scores (both Technical and Communication) and internal_notes should be visible
    detail_admin = client.get(f"/candidates/{cand_id}", headers=headers_admin)
    assert detail_admin.status_code == 200
    data_admin = detail_admin.json()
    assert len(data_admin["scores"]) == 2
    # Verify both scores are present in some order
    categories = {s["category"] for s in data_admin["scores"]}
    assert "Technical" in categories
    assert "Communication" in categories
    assert data_admin["internal_notes"] == "" # starts off empty

    # 12. Reviewer 1 tries to edit internal_notes -> Should fail with 403
    notes_r1 = client.patch(
        f"/candidates/{cand_id}/notes",
        json={"notes": "Highly confidential note"},
        headers=headers_r1
    )
    assert notes_r1.status_code == 403

    # 13. Admin edits internal_notes -> Should succeed
    notes_admin = client.patch(
        f"/candidates/{cand_id}/notes",
        json={"notes": "Highly confidential note"},
        headers=headers_admin
    )
    assert notes_admin.status_code == 200

    # Verify notes are saved and visible to admin
    detail_admin_updated = client.get(f"/candidates/{cand_id}", headers=headers_admin)
    assert detail_admin_updated.json()["internal_notes"] == "Highly confidential note"

    # 14. Reviewer 1 tries to delete candidate -> Should fail with 403
    del_r1 = client.delete(f"/candidates/{cand_id}", headers=headers_r1)
    assert del_r1.status_code == 403

    # 15. Admin deletes candidate -> Should succeed (soft-delete)
    del_admin = client.delete(f"/candidates/{cand_id}", headers=headers_admin)
    assert del_admin.status_code == 200

    # 16. Verify candidate is now archived (soft-deleted) and returns 404 on normal fetch
    detail_post_delete = client.get(f"/candidates/{cand_id}", headers=headers_admin)
    assert detail_post_delete.status_code == 404
