import os
from backend.app.auth import require_permission
from fastapi import Depends

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50
SECRET_KEY = os.getenv("SECRET_KEY", "dev-fallback-key-change-in-prod")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))



can_list_candidates   = Depends(require_permission("candidates", "list"))
can_read_candidate    = Depends(require_permission("candidates", "read"))
can_create_score      = Depends(require_permission("scores",     "create"))
can_read_all_scores   = Depends(require_permission("scores",     "read_all"))
can_read_own_scores   = Depends(require_permission("scores",     "read_own"))
can_read_notes        = Depends(require_permission("candidates", "read_internal_notes"))
can_write_notes       = Depends(require_permission("candidates", "write_internal_notes"))
can_trigger_summary   = Depends(require_permission("summary",    "trigger"))
can_soft_delete       = Depends(require_permission("candidates", "soft_delete"))