const API_URL = "http://127.0.0.1:8000";

export async function sendExpenseToBackend(expenseData) {
  const res = await fetch(`${API_URL}/expenses/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expenseData)
  });

  if (!res.ok) {
    let msg = "Error al crear el gasto.";
    try {
      msg = (await res.json())?.detail || msg;
    } catch {}
    throw new Error(msg);
  }

  return await res.json();
}