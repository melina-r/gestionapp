import React, { useEffect, useState } from "react";
import "../styles/details.css"; // reutiliza estilos existentes
import DatePicker from "react-datepicker";
import { isSameDay, parseISO } from "date-fns";

export default function Credits({ group }) {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fecha, setFecha] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState("all"); // all | pending | paid
  const [usersMap, setUsersMap] = useState({});
  const baseUrl = "http://localhost:8000";

  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem("usuario") || sessionStorage.getItem("user");
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u?.id ? { id: Number(u.id), nombre: u.nombre || "", email: u.email || u.mail || "" } : null;
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id ?? (Number(localStorage.getItem("userId")) || 1);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  useEffect(() => {
    // refetch credits when usersMap or group changes so nombres se resuelvan y el grupo aplicado
    if (Object.keys(usersMap).length > 0) {
      fetchCredits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersMap, group]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${baseUrl}/users`);
      if (!res.ok) {
        console.warn("fetchUsers: respuesta no OK", res.status);
        setUsersMap({});
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn("fetchUsers: formato inesperado", data);
        setUsersMap({});
        return;
      }

      const map = {};
      data.forEach((u) => {
        map[String(u.id)] = u.nombre ?? u.name ?? `${u.id}`;
      });
      setUsersMap(map);
    } catch (err) {
      console.warn("fetchUsers error:", err);
      setUsersMap({});
    }
  };

  const fetchExpenseDetails = async (gastoIds = []) => {
    const map = {};
    const unique = Array.from(new Set(gastoIds.filter((id) => id != null)));
    if (unique.length === 0) return map;

    await Promise.all(
      unique.map(async (gid) => {
        try {
          const r = await fetch(`${baseUrl}/expenses/${gid}`);
          if (!r.ok) return;
          const exp = await r.json();
          map[String(gid)] = exp;
        } catch (e) {
          console.warn("fetchExpenseDetails error for", gid, e);
        }
      })
    );
    return map;
  };

  const fetchCredits = async () => {
    setLoading(true);
    setError("");
    try {
      if (!currentUserId) {
        setError("No se encontró usuario actual");
        setCredits([]);
        setLoading(false);
        return;
      }

      const groupId = group?.id ?? (Number(sessionStorage.getItem("current_group_id")) || null);
      const url = groupId
        ? `${baseUrl}/expenses/credits/${currentUserId}?grupo_id=${groupId}`
        : `${baseUrl}/expenses/credits/${currentUserId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      const gastoIds = (Array.isArray(data) ? data : []).map((it) => it?.gasto_id ?? it?.gasto?.id).filter(Boolean);
      const expenseMap = await fetchExpenseDetails(gastoIds);

      const normalized = (Array.isArray(data) ? data : []).map((it, idx) => {
        const deudor_id = it?.deudor_id ?? it?.usuario_id ?? null;
        const deudor_nombre_fallback = it?.deudor_nombre ?? (it?.deudor?.nombre) ?? `Usuario ${deudor_id ?? "desconocido"}`;
        const gid = it?.gasto_id ?? it?.gasto?.id ?? null;
        const exp = gid ? expenseMap[String(gid)] : null;
        return {
          id: it?.id ?? `${gid ?? `c-${idx}`}`,
          gasto_id: gid,
          title: exp?.titulo ?? exp?.title ?? it?.titulo ?? it?.descripcion ?? "",
          monto: Number(it?.monto ?? 0),
          estado: Number(it?.estado ?? 0), // 1 = pago
          creado_en: exp?.fecha ?? it?.creado_en ?? it?.fecha ?? null,
          deudor_id,
          deudor_nombre: usersMap[String(deudor_id)] ?? deudor_nombre_fallback,
          descripcion: exp?.descripcion ?? exp?.detalle ?? it?.descripcion ?? ""
        };
      });
      setCredits(normalized);
    } catch (err) {
      console.error("fetchCredits error:", err);
      setError(err.message || "Error al obtener créditos");
      setCredits([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = credits
    .filter((c) => {
      if (search && !String(c.deudor_nombre).toLowerCase().includes(search.toLowerCase())) return false;

      if (fecha) {
        try {
          const created = typeof c.creado_en === "string" ? parseISO(c.creado_en) : new Date(c.creado_en);
          if (!isSameDay(created, fecha)) return false;
        } catch {
          return false;
        }
      }
      if (estadoFilter === "pending" && c.estado === 1) return false;
      if (estadoFilter === "paid" && c.estado !== 1) return false;
      return true;
    })
    .sort((a, b) => (b.creado_en || "").localeCompare(a.creado_en || ""));

  return (
    <div className="details-container">
      <main className="main-content">
        <div className="header-actions">
          <h2>Mis Créditos</h2>
          <div className="actions">
            <input
              type="text"
              placeholder="Buscar por deudor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={{ display: "inline-block", marginRight: "8px", minWidth: "140px" }}>
              <DatePicker
                selected={fecha}
                onChange={(date) => setFecha(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Seleccionar fecha"
                className="filter-btn"
                popperPlacement="bottom"
                isClearable
              />
            </div>
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="paid">Pagados</option>
            </select>
            <button className="filter-btn" onClick={fetchCredits} disabled={loading}>
              {loading ? "🔄" : "↻"} Actualizar
            </button>
          </div>
        </div>

        {error && <div style={{ color: "#c62828", padding: 8 }}>{error}</div>}

        <div className="table-wrapper">
          <table className="details-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Deudor</th>
                <th>Título</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    🔄 Cargando créditos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    📭 Sin créditos
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className={c.estado === 1 ? "credit-paid" : ""}>
                    <td>{c.creado_en ? new Date(c.creado_en).toLocaleDateString() : "-"}</td>
                    <td>{c.deudor_nombre}</td>
                    <td>{c.title || "-"}</td>
                    <td>{c.descripcion || "-"}</td>
                    <td>${Number(c.monto || 0).toFixed(2)}</td>
                    <td>{c.estado === 1 ? "Pagado" : "Pendiente"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div style={{ marginTop: 12, color: "#666" }}>
            Mostrando {filtered.length} de {credits.length} créditos
          </div>
        )}
      </main>
    </div>
  );
}