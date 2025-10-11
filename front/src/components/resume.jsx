import React, { useEffect, useState } from 'react';
import AddMemberModal from './addMemberModal';
import { getGroupMembers } from '../utils/groupsUtils';
import '../styles/resume.css';

export default function Resume({ groupId }) {  // 👈 necesita el ID del grupo actual
    const [debts, setDebts] = useState([]);
    const [credits, setCredits] = useState([]);
    const [expenses, setExpenses] = useState({});
    const [usuarios, setUsuarios] = useState([]);
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedDebts, setExpandedDebts] = useState({});
    const [expandedCredits, setExpandedCredits] = useState({});
    const [users, setUsers] = useState({});

    // Mock current user - replace with actual user authentication
    const currentUserId = 1;


    useEffect(() => {
        if (!groupId) return;
        const fetchMembers = async () => {
        try {
            const miembros = await getGroupMembers(groupId);
            setUsuarios(miembros);
        } catch (err) {
            console.error('❌ Error al obtener los miembros:', err);
            setError(`Error al cargar los miembros: ${err.message}`);
        }
    };
        fetchMembers();
    }, [groupId]);

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

     const fetchUserData = async () => {
        setLoading(true);
        setError("");
        
        try {
            // Fetch users first
            const usersData = {};
            const uniqueUserIds = new Set();
            
            // Get debts and credits data
            const [debtsResponse, creditsResponse] = await Promise.all([
                fetch(`http://localhost:8000/expenses/debts/${currentUserId}`),
                fetch(`http://localhost:8000/expenses/credits/${currentUserId}`)
            ]);

            const debtsData = await debtsResponse.json();
            const creditsData = await creditsResponse.json();

            // Collect all user IDs
            debtsData.forEach(debt => uniqueUserIds.add(debt.acreedor_id));
            creditsData.forEach(credit => uniqueUserIds.add(credit.deudor_id));

            // Fetch user details
            for (const userId of uniqueUserIds) {
                const userResponse = await fetch(`http://localhost:8000/users/${userId}`);
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    usersData[userId] = userData;
                }
            }

            // Filter pending debts
            const pendingDebts = debtsData.filter(debt => debt.estado === 0);

            // Group debts and credits by user
            const groupedDebts = groupByUser(pendingDebts, 'acreedor_id');
            const groupedCredits = groupByUser(creditsData, 'deudor_id');

            // Fetch all related expenses
            const expenseIds = new Set([
                ...pendingDebts.map(d => d.gasto_id),
                ...creditsData.map(c => c.gasto_id)
            ]);
            
            const expensesData = {};
            for (const id of expenseIds) {
                const response = await fetch(`http://localhost:8000/expenses/${id}`);
                if (response.ok) {
                    const expense = await response.json();
                    expensesData[id] = expense;
                }
            }

            setDebts(groupedDebts);
            setCredits(groupedCredits);
            setExpenses(expensesData);
            setUsers(usersData);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(`Error al cargar los datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const groupByUser = (items, userIdField) => {
        return items.reduce((acc, item) => {
            const userId = item[userIdField];
            if (!acc[userId]) {
                acc[userId] = {
                    items: [],
                    total: 0
                };
            }
            acc[userId].items.push(item);
            acc[userId].total += item.monto;
            return acc;
        }, {});
    };

    const toggleExpansion = (userId, type) => {
        if (type === 'debt') {
            setExpandedDebts(prev => ({
                ...prev,
                [userId]: !prev[userId]
            }));
        } else {
            setExpandedCredits(prev => ({
                ...prev,
                [userId]: !prev[userId]
            }));
        }
    };

    // Helper function to render expandable rows
    const renderExpandableTable = (data, type) => {
        const expanded = type === 'debt' ? expandedDebts : expandedCredits;
        const toggleFunction = (userId) => toggleExpansion(userId, type);

        return (
            <table className="resume-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Monto Total</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data).map(([userId, userData]) => (
                        <React.Fragment key={userId}>
                            <tr 
                                onClick={() => toggleFunction(userId)}
                                className="expandable-row"
                            >
                                <td>
                                    <span className="expand-icon">{expanded[userId] ? '▼' : '▶'}</span>
                                    {users[userId]?.nombre || 'Usuario desconocido'}
                                </td>
                                <td className="amount">
                                    ${userData.total.toFixed(2)}
                                </td>
                            </tr>
                            {expanded[userId] && (
                                <tr className="expanded-content">
                                    <td colSpan="2">
                                        <table className="nested-table">
                                            <tbody>
                                                {userData.items.map((item) => (
                                                    <tr key={item.gasto_id}>
                                                        <td>{expenses[item.gasto_id]?.titulo || 'Cargando...'}</td>
                                                        <td className="amount">${item.monto.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="resume-container">
            {/* Resumen de Gastos */}
            <div className="tables-grid">
                <div className="table-section">
                    <h3>Mis Deudas</h3>
                    {loading ? (
                        <p>Cargando deudas...</p>
                    ) : (
                        renderExpandableTable(debts, 'debt')
                    )}
                </div>

                <div className="table-section">
                    <h3>Mis Créditos</h3>
                    {loading ? (
                        <p>Cargando créditos...</p>
                    ) : (
                        renderExpandableTable(credits, 'credit')
                    )}
                </div>
            </div>

            <div className="resume-footer">
                <button
                    onClick={fetchUserData}
                    disabled={loading}
                    className="refresh-button"
                >
                    {loading ? "Actualizando..." : "Actualizar"}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={fetchUserData}>Reintentar</button>
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
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre)}`}
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
