import React from "react";
import "../styles/details.css";

const data = [
  {
    id: "FIG-123",
    titulo: "Gasto 1",
    descripcion: "Proyecto 1",
    prioridad: "Alta",
    fecha: "5/12/2023",
    monto: "$ 11 000",
    propietario: "Juan Pérez"
  },
  {
    id: "FIG-122",
    titulo: "Gasto 2",
    descripcion: "Acme GTM",
    prioridad: "Baja",
    fecha: "5/12/2023",
    monto: "$ 5 000",
    propietario: "Ana Gómez"
  },
  {
    id: "FIG-121",
    titulo: "Pago luz general Diciembre",
    descripcion: "Acme GTM",
    prioridad: "Alta",
    fecha: "5/12/2023",
    monto: "$ 8 000",
    propietario: "Carlos Ruiz"
  },
];

const details = () => {
  return (
    <div className="details-container">
      {/* Main Content */}
      <main className="main-content">
        {/* Encabezado */}
        <div className="header-actions">
          <h2>Gastos del Mes</h2>
          <div className="actions">
            <input type="text" placeholder="Buscar gastos" />
            <button className="filter-btn">Filtrar</button>
            <button className="icon-btn">📃</button>
            <button className="icon-btn">📅</button>
          </div>
        </div>

        {/* Tabla */}
        <div className="table-wrapper">
          <table className="details-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th>Descripción</th>
                <th>Propietario</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((gasto) => (
                <tr key={gasto.id}>
                  <td>{gasto.fecha}</td>
                  <td>{gasto.titulo}</td>
                  <td>
                    <span className="tag">{gasto.descripcion}</span>
                  </td>
                  <td>{gasto.propietario}</td>
                  <td>{gasto.monto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default details;
