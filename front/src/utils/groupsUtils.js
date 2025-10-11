const API_URL = "http://127.0.0.1:8000";

function getCurrentUser() {
  const userStr = sessionStorage.getItem("user");
  if (!userStr) throw new Error("Usuario no autenticado");

  const user = JSON.parse(userStr);
  if (!user.mail) throw new Error("Email del usuario no encontrado");

  return user.mail;
}

export async function getGroups() {
  const email = getCurrentUser();

  const res = await fetch(`${API_URL}/groups?email=${encodeURIComponent(email)}`);
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
    body: JSON.stringify({ name, email }), // ahora coincide con el backend
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al crear grupo");
  }

  return await res.json();
}

export async function getGroupMembers(groupId) {
    try {
        const response = await fetch(`http://localhost:8000/groups/${groupId}/members`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
        }

        return await response.json(); // lista de usuarios del grupo
    } catch (err) {
        console.error("❌ Error al obtener miembros:", err);
        throw err;
    }
}