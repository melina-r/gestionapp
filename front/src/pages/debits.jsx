import React, { useEffect, useState } from "react";
import "../styles/details.css";
import DatePicker from "react-datepicker";
import { isSameDay, parseISO } from "date-fns";

export default function Debts({ group }) {
  const [debts, setDebts] = useState([]);
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

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${baseUrl}/users`);
      if (!res.ok) throw new Error("No users endpoint");
      const data = await res.json();
      if (Array.isArray(data)) {
        const map = {};
        data.forEach((u) => {
          if (u?.id) map[String(u.id)] = u.nombre ?? u.name ?? `${u.id}`;
        });
        setUsersMap(map);
      }
    } catch (err) {
      console.warn("fetchUsers failed:", err);
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

  const fetchDebts = async () => {
    setLoading(true);
    setError("");
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setError("No se encontró usuario actual");
        setDebts([]);
        setLoading(false);
        return;
      }

      const groupId = group?.id ?? (Number(sessionStorage.getItem("current_group_id")) || null);
      const url = groupId ? `${baseUrl}/expenses/debts/${currentUser.id}?grupo_id=${groupId}` : `${baseUrl}/expenses/debts/${currentUser.id}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }
      const data = await res.json();
      const gastoIds = (Array.isArray(data) ? data : []).map((it) => it?.gasto_id ?? it?.gasto?.id).filter(Boolean);
      const expenseMap = await fetchExpenseDetails(gastoIds);

      const normalized = (Array.isArray(data) ? data : []).map((it, idx) => {
        const acreedor_id = it?.acreedor_id ?? null;
        const acreedor_nombre_fallback = it?.acreedor_nombre ?? (it?.acreedor?.nombre) ?? `Usuario ${acreedor_id ?? "desconocido"}`;
        const gid = it?.gasto_id ?? it?.gasto?.id ?? null;
        const exp = gid ? expenseMap[String(gid)] : null;
        return {
          id: it?.id ?? `${gid ?? `d-${idx}`}`,
          gasto_id: gid,
          title: exp?.titulo ?? exp?.title ?? it?.titulo ?? it?.descripcion ?? "",
          monto: Number(it?.monto ?? 0),
          estado: Number(it?.estado ?? 0), // 1 = pago
          creado_en: exp?.fecha ?? it?.creado_en ?? it?.fecha ?? null,
          acreedor_id,
          acreedor_nombre: usersMap[String(acreedor_id)] ?? acreedor_nombre_fallback,
          descripcion: exp?.descripcion ?? exp?.detalle ?? it?.descripcion ?? ""
        };
      });

      setDebts(normalized);
    } catch (err) {
      console.error("fetchDebts error:", err);
      setError(err.message || "Error al obtener deudas");
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // refetch debts when group or usersMap changes (so nombres se resuelvan)
    fetchDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, usersMap]);

  const filtered = debts
    .filter((d) => {
      if (search && !String(d.acreedor_nombre).toLowerCase().includes(search.toLowerCase())) return false;
      if (fecha) {
        try {
          const created = typeof d.creado_en === "string" ? parseISO(d.creado_en) : new Date(d.creado_en);
          if (!isSameDay(created, fecha)) return false;
        } catch {
          return false;
        }
      }
      if (estadoFilter === "pending" && d.estado === 1) return false;
      if (estadoFilter === "paid" && d.estado !== 1) return false;
      return true;
    })
    .sort((a, b) => {
      const da = a.creado_en || "";
      const db = b.creado_en || "";
      return db.localeCompare(da);
    });

  return (
    <div className="details-container">
      <main className="main-content">
        <div className="header-actions">
          <h2>Mis Deudas</h2>
          <div className="actions">
            <input
              type="text"
              placeholder="Buscar por acreedor"
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
            <button className="filter-btn" onClick={fetchDebts} disabled={loading}>
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
                <th>Acreedor</th>
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
                    🔄 Cargando deudas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    📭 Sin deudas
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className={d.estado === 1 ? "debt-paid" : ""}>
                    <td>{d.creado_en ? new Date(d.creado_en).toLocaleDateString() : "-"}</td>
                    <td>{d.acreedor_nombre}</td>
                    <td>{d.title || "-"}</td>
                    <td>{d.descripcion || "-"}</td>
                    <td>${Number(d.monto || 0).toFixed(2)}</td>
                    <td>{d.estado === 1 ? "Pagado" : "Pendiente"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div style={{ marginTop: 12, color: "#666" }}>
            Mostrando {filtered.length} de {debts.length} deudas
          </div>
        )}
      </main>
    </div>
  );
}