import React, { useState, useEffect } from "react";
import "../styles/details.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { authenticatedFetch } from '../utils/api';

const details = () => {
  const [search, setSearch] = useState("");
  const [propietario, setPropietario] = useState("");
  const [fecha, setFecha] = useState(null); // Cambiar de "" a null
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  // Función para obtener gastos desde la API
  const fetchExpenses = async () => {
    setLoading(true);
    setError("");

    try {
      console.log('🔄 Obteniendo gastos desde la API...');

      const response = await authenticatedFetch('/expenses/');

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const expenses = await response.json();
      console.log('✅ Gastos obtenidos:', expenses);
      
      // Transformar los datos para que coincidan con el formato esperado
      const transformedData = expenses.map((expense) => ({
        id: expense.id,
        titulo: expense.titulo,
        descripcion: expense.descripcion || '',
        valor: expense.valor,
        fecha: expense.fecha, // Ya viene en formato YYYY-MM-DD
        usuario_id: expense.usuario_id,
        grupo_id: expense.grupo_id,
        comprobante: expense.comprobante
      }));
      
      setData(transformedData);
      
    } catch (err) {
      console.error('❌ Error al obtener gastos:', err);
      setError(`Error al cargar los gastos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('🏁 Componente de detalles montado, cargando datos...');
    fetchExpenses();
  }, []);

  // Obtener usuarios únicos (mejorado)
  const usuarios = [...new Set(
    data
      .map((g) => g.usuario_id)
      .filter(usuario_id => usuario_id) // Filtrar nulos
  )].sort(); // Ordenar

  // Funciones de formato de fecha
  function formatDateToInput(fechaStr) {
    // formato yyyy-mm-dd en la API
    return fechaStr;
  }
  
  function formatDateToString(dateObj) {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Filtrar datos
  const filteredData = data.filter((gasto) => {
    const matchTitulo = gasto.titulo && gasto.titulo.toLowerCase().includes(search.toLowerCase());
    const matchUsuario = propietario ? gasto.usuario_id === parseInt(propietario) : true;
    let matchFecha = true;
    if (fecha) {
      matchFecha = formatDateToInput(gasto.fecha) === formatDateToString(fecha);
    }
    return matchTitulo && matchUsuario && matchFecha;
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar por fecha descendente

  // Función para refrescar los datos
  const handleRefresh = () => {
    fetchExpenses();
  };

  return (
    <div className="details-container">
      <main className="main-content">
        <div className="header-actions">
          <h2>Gastos del Mes</h2>
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
              <option value="">Todos los usuarios</option>
              {usuarios.map((userId, index) => (
                <option key={`usuario-${index}-${userId}`} value={userId}>
                  Usuario #{userId}
                </option>
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
                setFecha(null); // Cambiar de "" a null
                setSearch("");
              }}
              type="button"
              style={{ marginRight: "8px" }}
            >
              Limpiar filtros
            </button>
            
            {/* Botón para refrescar datos */}
            <button
              className="filter-btn"
              onClick={handleRefresh}
              disabled={loading}
              type="button"
              title="Actualizar datos"
            >
              {loading ? "🔄" : "↻"} Actualizar
            </button>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '4px',
            margin: '16px 0',
            border: '1px solid #ffcdd2'
          }}>
            {error}
            <button 
              onClick={handleRefresh} 
              style={{ marginLeft: '12px', padding: '4px 8px' }}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="table-wrapper">
          <table className="details-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th>Descripción</th>
                <th>Usuario</th>
                <th>Monto</th>
                <th>Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{textAlign: "center"}}>🔄 Cargando gastos...</td></tr>
              ) : error && data.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign: "center"}}>❌ Error al cargar datos</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign: "center"}}>📭 Sin datos que mostrar</td></tr>
              ) : (
                filteredData.map((gasto) => (
                  <tr key={gasto.id}>
                    <td>{gasto.fecha}</td>
                    <td>{gasto.titulo}</td>
                    <td>
                      <span className="tag">{gasto.descripcion}</span>
                    </td>
                    <td>Usuario #{gasto.usuario_id}</td>
                    <td>${gasto.valor}</td>
                    <td>
                      {gasto.comprobante ? (
                        <button
                          className="icon-btn"
                          style={{ fontSize: "1.2rem" }}
                          title="Ver comprobante"
                          onClick={() => setComprobanteModal(gasto.comprobante)}
                        >📄</button>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Información adicional */}
        {!loading && !error && (
          <div style={{
            marginTop: '16px',
            padding: '8px',
            background: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '0.9em',
            color: '#666'
          }}>
            📊 Mostrando {filteredData.length} de {data.length} gastos totales
          </div>
        )}

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
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none', padding: '20px', textAlign: 'center' }}>
                📄 No se pudo cargar el comprobante
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default details;
