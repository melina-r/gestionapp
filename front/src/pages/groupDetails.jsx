import React, { useState, useEffect } from "react";
import "../styles/details.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isSameDay, parseISO } from 'date-fns';

const GroupDetails = ({ group }) => {
  const [search, setSearch] = useState("");
  const [propietario, setPropietario] = useState("");
  const [fecha, setFecha] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [comprobanteModal, setComprobanteModal] = useState(null);
  const baseUrl = "http://localhost:8000";

  // Cargar todos los gastos desde la API
  const fetchExpenses = async () => {
    setLoading(true);
    setError("");
    try {
      console.log('🔄 Obteniendo gastos desde la API...');
      const response = await fetch(`${baseUrl}/expenses/group/${group.id}`);
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const expenses = await response.json();
      console.log('✅ Gastos obtenidos:', expenses);

      // Normalizar cada gasto
      const transformedData = (Array.isArray(expenses) ? expenses : []).map((expense, idx) => {
        // autor puede venir como string o como objeto {id, nombre}
        const autorRaw = expense.autor ?? expense.usuario ?? expense.autor_nombre ?? null;
        let autorNombre = "";
        if (typeof autorRaw === "string") autorNombre = autorRaw;
        else if (autorRaw && typeof autorRaw === "object") autorNombre = autorRaw.nombre ?? autorRaw.name ?? String(autorRaw.id ?? "");
        else autorNombre = expense.autor_nombre ?? expense.usuario_nombre ?? "";

        return {
          id: expense.id ?? `g-${idx}`,
          titulo: expense.titulo ?? expense.title ?? "",
          descripcion: expense.descripcion ?? expense.detalle ?? "",
          valor: Number(expense.valor ?? expense.valor_total ?? expense.monto ?? 0),
          fecha: expense.fecha ?? (expense.creado_en ? expense.creado_en.split("T")[0] : null),
          autor: autorNombre || `Usuario ${expense.usuario ?? expense.autor ?? ""}`,
          comprobante: expense.comprobante ?? null,
          raw: expense
        };
      });

      console.log('✅ Gastos transformados:', transformedData);

      setData(transformedData);
    } catch (err) {
      console.error('❌ Error al obtener gastos:', err);
      setError(`Error al cargar los gastos: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Obtener propietarios únicos
  const propietarios = [...new Set(data.map((g) => g.autor))];

  // Filtrar datos
  function formatDateToInput(fechaStr) {
    // formato yyyy-mm-dd en el csv
    return fechaStr;
  }
  function formatDateToString(dateObj) {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const filteredData = data.filter((gasto) => {
    const matchTitulo = gasto.titulo && gasto.titulo.toLowerCase().includes(search.toLowerCase());
    const matchPropietario = propietario ? gasto.autor === propietario : true;
    let matchFecha = true;
    
    if (fecha) {
      matchFecha = isSameDay(parseISO(gasto.fecha), fecha);
    }
    return matchTitulo && matchPropietario && matchFecha;
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar por fecha descendente

  return (
    <div className="details-container">
      <main className="main-content">
        <div className="header-actions">
          <h2>Gastos de {group.name}</h2>
          <div className="actions">
            <input
              type="text"
              placeholder="Buscar por título"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginRight: "8px" }}
            />
            <select
              value={propietario}
              onChange={(e) => setPropietario(e.target.value)}
              style={{ marginRight: "8px" }}
            >
              <option value="">Todos los propietarios</option>
              {propietarios.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {/* Date Picker visual */}
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
            <button
              className="filter-btn"
              onClick={() => {
                setPropietario("");
                setFecha("");
                setSearch("");
              }}
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="details-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th>Descripción</th>
                <th>Propietario</th>
                <th>Monto</th>
                <th>Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{textAlign: "center"}}>Cargando...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign: "center"}}>Sin datos</td></tr>
              ) : (
                filteredData.map((gasto) => (
                  <tr key={gasto.id}>
                    <td>{gasto.fecha}</td>
                    <td>{gasto.titulo}</td>
                    <td>{gasto.descripcion}</td>
                    <td>{gasto.autor}</td>
                    <td>${gasto.valor}</td>
                    <td>
                      {gasto.comprobante ? (
                        <button
                          className="icon-btn"
                          style={{ fontSize: "1.2rem" }}
                          title="Ver comprobante"
                          onClick={() => setComprobanteModal(gasto.comprobante)}
                        >📄</button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal comprobante */}
        {comprobanteModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setComprobanteModal(null)}
          >
            <div
              style={{
                background: "#fff",
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                maxWidth: "90vw",
                maxHeight: "90vh",
                position: "relative",
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer"
                }}
                onClick={() => setComprobanteModal(null)}
                title="Cerrar"
              >✖️</button>
              <img
                src={comprobanteModal}
                alt="Comprobante"
                style={{ maxWidth: "80vw", maxHeight: "80vh", borderRadius: "6px" }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GroupDetails;