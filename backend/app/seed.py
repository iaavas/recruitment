from sqlalchemy.orm import Session
from .models import Role, Permission, User
from .auth import hash_password

PERMISSIONS = [
    ("candidates", "list",                "List all candidates"),
    ("candidates", "read",                "View candidate profile and own scores"),
    ("candidates", "read_internal_notes", "View admin-only internal notes"),
    ("candidates", "write_internal_notes","Edit internal notes"),
    ("candidates", "soft_delete",         "Archive (soft-delete) a candidate"),
    ("scores",     "create",              "Submit a score for a candidate"),
    ("scores",     "read_own",            "Read own submitted scores"),
    ("scores",     "read_all",            "Read all reviewers' scores"),
    ("summary",    "trigger",             "Trigger AI summary generation"),
]

ROLE_PERMISSIONS = {
    "reviewer": [
        ("candidates", "list"),
        ("candidates", "read"),
        ("scores",     "create"),
        ("scores",     "read_own"),
        ("summary",    "trigger"),
    ],
    "admin": [
        ("candidates", "list"),
        ("candidates", "read"),
        ("candidates", "read_internal_notes"),
        ("candidates", "write_internal_notes"),
        ("candidates", "soft_delete"),
        ("scores",     "create"),
        ("scores",     "read_own"),
        ("scores",     "read_all"),
        ("summary",    "trigger"),
    ],
    
}


def seed(db: Session) -> None:
    # 1. Upsert permissions
    perm_map: dict[tuple, Permission] = {}
    for resource, action, description in PERMISSIONS:
        existing = db.query(Permission).filter_by(resource=resource, action=action).first()
        if not existing:
            existing = Permission(resource=resource, action=action, description=description)
            db.add(existing)
            db.flush()
        perm_map[(resource, action)] = existing

    # 2. Upsert roles and wire their permissions
    role_map: dict[str, Role] = {}
    for role_name, perm_keys in ROLE_PERMISSIONS.items():
        role = db.query(Role).filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name, description=f"Built-in {role_name} role")
            db.add(role)
            db.flush()
        role.permissions = [perm_map[k] for k in perm_keys]
        role_map[role_name] = role

    admin_email = "admin@techkraft.internal"
    if not db.query(User).filter_by(email=admin_email).first():
        admin = User(email=admin_email, hashed_password=hash_password("changeme123"))
        admin.roles = [role_map["admin"]]
        db.add(admin)

    db.commit()
    print("[seed] Roles, permissions, and default admin seeded.")