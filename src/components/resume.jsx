
import React, { useEffect, useState } from 'react';
import '../styles/resume.css';

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(';');
    return lines.slice(1).map(line => {
        const values = line.split(';');
        const obj = {};
        headers.forEach((h, i) => {
            obj[h.trim()] = values[i].trim();
        });
        return obj;
    }).slice(0, 5).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar por fecha descendente y limitar a 5
}

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
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/src/data/gastos.csv')
            .then(res => res.text())
            .then(text => {
                setGastos(parseCSV(text));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

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
                    {loading ? (
                        <tr><td colSpan={3}>Cargando...</td></tr>
                    ) : gastos.length === 0 ? (
                        <tr><td colSpan={3}>Sin datos</td></tr>
                    ) : (
                        gastos.map((gasto, idx) => (
                            <tr key={idx}>
                                <td>{gasto.titulo}</td>
                                <td>{gasto.autor}</td>
                                <td>${gasto.valor}</td>
                            </tr>
                        ))
                    )}
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