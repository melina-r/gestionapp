import React, { useState, useEffect } from "react";
import "../styles/details.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(';');
  return lines.slice(1).map((line, idx) => {
    const values = line.split(';');
    const obj = { id: `gasto-${idx}` };
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i].trim();
    });
    return obj;
  });
}

const GroupDetails = ({ group }) => {
  const [search, setSearch] = useState("");
  const [propietario, setPropietario] = useState("");
  const [fecha, setFecha] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [comprobanteModal, setComprobanteModal] = useState(null);

  function DateInputCalendar({ value, onChange }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current) {
        if (typeof ref.current.showPicker === "function") {
          ref.current.showPicker();
        } else {
          ref.current.focus();
        }
      }
    }, []);
    return (
      <input
        ref={ref}
        type="date"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        style={{
          position: 'absolute',
          left: 0,
          top: '110%',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: '1px solid #ddd',
          borderRadius: '6px',
          background: '#fff',
        }}
        autoFocus
      />
    );
  }

  useEffect(() => {
    fetch('/src/data/gastos.csv')
      .then(res => res.text())
      .then(text => {
        setData(parseCSV(text));
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
      matchFecha = formatDateToInput(gasto.fecha) === formatDateToString(fecha);
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
                    <td>
                      <span className="tag">{gasto.descripcion}</span>
                    </td>
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