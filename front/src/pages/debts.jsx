import React, { useEffect, useState } from "react";
import "../styles/details.css";
import DatePicker from "react-datepicker";
import { isSameDay, parseISO } from 'date-fns';


export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fecha, setFecha] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState("all"); // all | pending | paid
  const [usersMap, setUsersMap] = useState({});
  const baseUrl = "http://localhost:8000";
  const currentUserId = Number(localStorage.getItem("userId")) || 1;

  useEffect(() => {
    const init = async () => {
      await fetchUsers();
      await fetchDebts();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${baseUrl}/users`);
      if (!res.ok) throw new Error("No users endpoint");
      const data = await res.json();
      if (Array.isArray(data)) {
        const map = {};
        data.forEach(u => {
          if (u?.id) map[String(u.id)] = u.nombre ?? u.name ?? `${u.id}`;
        });
        setUsersMap(map);
      }
    } catch (err) {
      console.warn("fetchUsers failed, continuing without map:", err);
      setUsersMap({});
    }
  };

  // Fetch expense details for a set of gasto_ids and return map gasto_id -> expense
  const fetchExpenseDetails = async (gastoIds = []) => {
    const map = {};
    const unique = Array.from(new Set(gastoIds.filter(id => id != null)));
    if (unique.length === 0) return map;

    await Promise.all(unique.map(async (gid) => {
      try {
        const r = await fetch(`${baseUrl}/expenses/${gid}`);
        if (!r.ok) return;
        const exp = await r.json();
        map[String(gid)] = exp;
      } catch (e) {
        console.warn("fetchExpenseDetails error for", gid, e);
      }
    }));
    return map;
  };

  const fetchDebts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${baseUrl}/expenses/debts/${currentUserId}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const gastoIds = (Array.isArray(data) ? data : []).map(it => it?.gasto_id ?? it?.gasto?.id).filter(Boolean);
      const expenseMap = await fetchExpenseDetails(gastoIds);

      const normalized = (Array.isArray(data) ? data : []).map((it, idx) => {
        const acreedor_id = it?.acreedor_id ?? null;
        const acreedor_nombre_fallback = it?.acreedor_nombre ?? (it?.acreedor?.nombre) ?? `Usuario ${acreedor_id ?? 'desconocido'}`;
        const gid = it?.gasto_id ?? it?.gasto?.id ?? null;
        const exp = gid ? expenseMap[String(gid)] : null;
        return {
          id: it?.id ?? `${gid ?? `d-${idx}`}`,
          gasto_id: gid,
          title: exp?.titulo ?? exp?.title ?? it?.titulo ?? it?.titulo ?? it?.descripcion ?? "",
          monto: Number(it?.monto ?? 0),
          estado: Number(it?.estado ?? 0), // 1 = pago
          creado_en: it?.creado_en ?? it?.fecha ?? exp?.fecha ?? null,
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

  const filtered = debts
    .filter(d => {
      if (search && !String(d.acreedor_nombre).toLowerCase().includes(search.toLowerCase())) return false;
      if (fecha) {
        if (!isSameDay(parseISO(d.creado_en), fecha)) return false;
      }
      if (estadoFilter === "pending" && d.estado === 1) return false;
      if (estadoFilter === "paid" && d.estado !== 1) return false;
      return true;
    })
    .sort((a,b) => (b.creado_en || "").localeCompare(a.creado_en || ""));

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
              onChange={e => setSearch(e.target.value)}
            />
            <div style={{ display: 'inline-block', marginRight: '8px', minWidth: '140px' }}>
              <DatePicker
                selected={fecha}
                onChange={date => setFecha(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Seleccionar fecha"
                className="filter-btn"
                popperPlacement="bottom"
                isClearable
              />
            </div>
            <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
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
                <tr><td colSpan={6} style={{textAlign:"center"}}>🔄 Cargando deudas...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:"center"}}>📭 Sin deudas</td></tr>
              ) : (
                filtered.map(d => (
                  <tr key={d.id} className={d.estado === 1 ? "debt-paid" : ""}>
                    <td>{d.creado_en ? new Date(d.creado_en).toLocaleDateString() : "-"}</td>
                    <td>{d.acreedor_nombre}</td>
                    <td>{d.title || "-"}</td>
                    <td>{d.descripcion || "-"}</td>
                    <td>${d.monto.toFixed(2)}</td>
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