from fastapi import APIRouter

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"]
)


@router.get("/")
def list_expenses():
    return [{"id": 101, "name": "Laptop"}, {"id": 102, "name": "Mouse"}]


@router.get("/{expense_id}")
def get_expense(expense_id: int):
    return {"id": expense_id, "name": f"Expense {expense_id}"}
