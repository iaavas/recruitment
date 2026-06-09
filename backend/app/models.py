from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Table, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

import uuid

Base = declarative_base()

def gen_id():
    return str(uuid.uuid4())


user_roles = Table(
    "user_roles", Base.metadata,
    Column("user_id",    String, ForeignKey("users.id",    ondelete="CASCADE"), primary_key=True),
    Column("role_id",    String, ForeignKey("roles.id",    ondelete="CASCADE"), primary_key=True),
    Column("assigned_at", DateTime, default=datetime.now(timezone.utc)),
)

role_permissions = Table(
    "role_permissions", Base.metadata,
    Column("role_id",       String, ForeignKey("roles.id",       ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"
    id              = Column(String, primary_key=True, default=gen_id)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at      = Column(DateTime, default=datetime.now(timezone.utc))
    deleted_at      = Column(DateTime, nullable=True)           

    roles  = relationship("Role",  secondary=user_roles,  back_populates="users")
    scores = relationship("Score", back_populates="reviewer")

    def has_permission(self, resource: str, action: str) -> bool:
        """Check if this user holds any role that grants resource:action."""
        for role in self.roles:
            for perm in role.permissions:
                if perm.resource == resource and perm.action == action:
                    return True
        return False

    def permission_set(self) -> set[str]:
        """Return flat set of 'resource:action' strings — useful for JWT payload."""
        return {
            f"{p.resource}:{p.action}"
            for role in self.roles
            for p in role.permissions
        }


class Role(Base):
    __tablename__ = "roles"
    id          = Column(String, primary_key=True, default=gen_id)
    name        = Column(String, unique=True, nullable=False, index=True)  
    description = Column(Text, default="")
    created_at  = Column(DateTime, default=datetime.now(timezone.utc))

    users       = relationship("User",       secondary=user_roles,       back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions,  back_populates="roles")


class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = (UniqueConstraint("resource", "action", name="uq_resource_action"),)

    id          = Column(String, primary_key=True, default=gen_id)
    resource    = Column(String, nullable=False)   
    action      = Column(String, nullable=False)   
    description = Column(Text, default="")

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")



class Candidate(Base):
    __tablename__ = "candidates"
    id             = Column(String, primary_key=True, default=gen_id)
    name           = Column(String, nullable=False)
    email          = Column(String, unique=True, index=True, nullable=False)
    role_applied   = Column(String, index=True)
    status         = Column(String, default="new", index=True)
    skills         = Column(Text, default="[]")        
    internal_notes = Column(Text, default="")          
    ai_summary     = Column(Text, default="")
    created_at     = Column(DateTime, default=datetime.now(timezone.utc))
    deleted_at     = Column(DateTime, nullable=True)   

    scores = relationship("Score", back_populates="candidate")


class Score(Base):
    __tablename__ = "scores"
    id           = Column(String, primary_key=True, default=gen_id)
    candidate_id = Column(String, ForeignKey("candidates.id"), index=True, nullable=False)
    reviewer_id  = Column(String, ForeignKey("users.id"),      index=True, nullable=False)
    category     = Column(String, nullable=False)
    score        = Column(Integer, nullable=False)
    note         = Column(Text, default="")
    created_at   = Column(DateTime, default=datetime.now(timezone.utc))

    candidate = relationship("Candidate", back_populates="scores")
    reviewer  = relationship("User",      back_populates="scores")