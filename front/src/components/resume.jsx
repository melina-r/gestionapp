import React, { useEffect, useState } from 'react';
import AddMemberModal from './addMemberModal';
import '../styles/resume.css';
import { authenticatedFetch } from '../utils/api';

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
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Función para obtener gastos desde la API
    const fetchExpenses = async () => {
        setLoading(true);
        setError("");

        try {
            console.log('🔄 Obteniendo gastos recientes desde la API...');

            const response = await authenticatedFetch('/expenses/');

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const expenses = await response.json();
            console.log('✅ Gastos recientes obtenidos:', expenses);
            
            // Tomar solo los 5 más recientes, ordenados por fecha
            const recentExpenses = expenses
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 5);
            
            setGastos(recentExpenses);
            
        } catch (err) {
            console.error('❌ Error al obtener gastos recientes:', err);
            setError(`Error al cargar los gastos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleAddMember = async (email) => {
        console.log('Enviando invitación a:', email);

        // Simular envío de email (aquí implementarías la lógica real)
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simular éxito o fallo
                if (Math.random() > 0.1) { // 90% de éxito
                    alert(`Invitación enviada exitosamente a ${email}`);
                    resolve();
                } else {
                    reject(new Error('Error simulado en el envío'));
                }
            }, 1500);
        });
    };

    // Función para refrescar los datos
    const handleRefresh = () => {
        fetchExpenses();
    };

    return (
        <div className="resume-container">
            {/* Encabezado con título y botón de actualizar */}
            <div className="resume-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px' 
            }}>
                <h2 style={{ margin: 0 }}>Gastos Recientes</h2>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9em'
                    }}
                    title="Actualizar gastos"
                >
                    {loading ? "🔄" : "↻"} Actualizar
                </button>
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
                        style={{ 
                            marginLeft: '12px', 
                            padding: '4px 8px',
                            backgroundColor: '#c62828',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Tabla de gastos */}
            <table className="resume-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Nombre</th>
                        <th>Registrado por</th>
                        <th>Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                                🔄 Cargando gastos recientes...
                            </td>
                        </tr>
                    ) : error && gastos.length === 0 ? (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                                ❌ Error al cargar datos
                            </td>
                        </tr>
                    ) : gastos.length === 0 ? (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                                📭 No hay gastos registrados aún
                            </td>
                        </tr>
                    ) : (
                        gastos.map((gasto) => (
                            <tr key={`gasto-${gasto.id}`}>
                                <td>{gasto.fecha}</td>
                                <td>{gasto.titulo}</td>
                                <td>Usuario #{gasto.usuario_id}</td>
                                <td style={{ fontWeight: 'bold', color: '#2196F3' }}>
                                    ${parseFloat(gasto.valor).toLocaleString('es-ES', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Información adicional */}
            {!loading && !error && gastos.length > 0 && (
                <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    color: '#666',
                    textAlign: 'center'
                }}>
                    📊 Mostrando los {gastos.length} gastos más recientes
                </div>
            )}

            {/* Lista de usuarios */}
            <div className="resume-users">
                <div className="users-header">
                    <h3>Usuarios</h3>
                    <button
                        className="add-member-btn"
                        onClick={() => setIsModalOpen(true)}
                    >
                        + Agregar Miembro
                    </button>
                </div>
                <ul className="resume-users-list">
                    {usuarios.map((usuario, idx) => (
                        <li key={`usuario-${idx}-${usuario.correo}`} className="resume-user-item">
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

            <AddMemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddMember}
            />
        </div>
    );
}