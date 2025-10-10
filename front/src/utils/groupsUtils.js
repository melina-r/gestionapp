const API_URL = "http://127.0.0.1:8000";

function getCurrentUser() {
  const email = sessionStorage.getItem("userEmail");
  if (!email) throw new Error("Usuario no autenticado");
  return email;
}

export async function getGroups() {
  const email = getCurrentUser();

  const res = await fetch(`${API_URL}/groups?user=${encodeURIComponent(email)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al obtener los grupos");
  }

  return await res.json();
}

export async function createGroup(name) {
  const email = getCurrentUser();

  const res = await fetch(`${API_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, user: email }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al crear grupo");
  }

  return await res.json();
}