import React from 'react';
import '../styles/resume.css';

// Datos de ejemplo
const gastos = [
    { nombre: 'Cena en restaurante', registradoPor: 'Juan Pérez', monto: 3500 },
    { nombre: 'Taxi', registradoPor: 'Ana Gómez', monto: 1200 },
    { nombre: 'Supermercado', registradoPor: 'Carlos Ruiz', monto: 5400 },
];

const usuarios = [
    {
        nombre: 'Juan Pérez',
        correo: 'juan.perez@email.com',
        avatar: 'https://ui-avatars.com/api/?name=Juan+Perez',
    },
    {
        nombre: 'Ana Gómez',
        correo: 'ana.gomez@email.com',
        avatar: 'https://ui-avatars.com/api/?name=Ana+Gomez',
    },
    {
        nombre: 'Carlos Ruiz',
        correo: 'carlos.ruiz@email.com',
        avatar: 'https://ui-avatars.com/api/?name=Carlos+Ruiz',
    },
];

export default function Resume() {
    return (
        <div className="resume-container">
            {/* Tabla de gastos */}
            <table className="resume-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Registrado por</th>
                        <th>Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {gastos.map((gasto, idx) => (
                        <tr key={idx}>
                            <td>{gasto.nombre}</td>
                            <td>{gasto.registradoPor}</td>
                            <td>${gasto.monto}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Lista de usuarios */}
            <div className="resume-users">
                <h3>Usuarios</h3>
                <ul className="resume-users-list">
                    {usuarios.map((usuario, idx) => (
                        <li key={idx} className="resume-user-item">
                            <img
                                src={usuario.avatar}
                                alt={usuario.nombre}
                                className="resume-user-avatar"
                            />
                            <div>
                                <div className="resume-user-name">{usuario.nombre}</div>
                                <div className="resume-user-email">{usuario.correo}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}