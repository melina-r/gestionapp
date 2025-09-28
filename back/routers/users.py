from fastapi import APIRouter

router = APIRouter(
    prefix="/users",        # prefix for all user routes
    tags=["users"]          # for documentation
)


@router.get("/")
def list_users():
    return [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]


@router.get("/{user_id}")
def get_user(user_id: int):
    return {"id": user_id, "name": f"User {user_id}"}
