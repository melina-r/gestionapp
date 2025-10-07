import React, { useEffect, useState } from 'react';
import '../styles/balance_cards.css';
import { authenticatedFetch } from '../utils/api';

const BalanceCards = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Función para obtener gastos desde la API
    const fetchExpenses = async () => {
        setLoading(true);
        setError("");

        try {
            console.log('🔄 Obteniendo gastos para balance desde la API...');

            const response = await authenticatedFetch('/expenses/');

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const expenses = await response.json();
            console.log('✅ Gastos para balance obtenidos:', expenses);
            
            setGastos(expenses);
            
        } catch (err) {
            console.error('❌ Error al obtener gastos para balance:', err);
            setError(`Error al cargar los gastos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    // Calcular valores
    let total = 0;
    let propios = 0;
    let gastosOtros = 0;

    // Obtener el ID del usuario actual desde localStorage
    const currentUserId = parseInt(localStorage.getItem('userId'));

    if (gastos.length > 0) {
        gastos.forEach(gasto => {
            const valor = parseFloat(gasto.valor) || 0;
            total += valor;

            // Comparar por usuario_id en lugar de autor
            if (gasto.usuario_id === currentUserId) {
                propios += valor;
            } else {
                gastosOtros += valor;
            }
        });
    }
    
    const aPagar = gastosOtros; // Lo que debo por gastos de otros
    const aRecibir = propios - (total - propios); // Lo que me deben menos lo que debo

    const cardData = [
        { 
            label: 'Gastos propios', 
            value: `$ ${propios.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            description: 'Gastos registrados por ti',
            color: '#4CAF50' // Verde para gastos propios
        },
        { 
            label: 'A pagar', 
            value: `$ ${aPagar.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            description: 'Total a pagar por gastos de otros',
            color: '#f44336' // Rojo para lo que debes pagar
        },
        { 
            label: 'Gastos totales', 
            value: `$ ${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            description: 'Total de gastos del grupo',
            color: '#2196F3' // Azul para total
        },
    ];

    // Agregar una cuarta tarjeta si hay un balance positivo/negativo
    if (Math.abs(aRecibir) > 0.01) {
        cardData.push({
            label: aRecibir > 0 ? 'A recibir' : 'Balance',
            value: `$ ${Math.abs(aRecibir).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            description: aRecibir > 0 ? 'Total a recibir de otros' : 'Balance general',
            color: aRecibir > 0 ? '#FF9800' : '#9C27B0' // Naranja para recibir, morado para balance
        });
    }

    if (loading) {
        return (
            <div className="balance-cards-container">
                <div className="loading-card">
                    <div className="balance-card">
                        <div className="balance-card-label">🔄 Cargando...</div>
                        <div className="balance-card-value">Obteniendo datos</div>
                        <div className="balance-card-desc">Conectando con la base de datos</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="balance-cards-container">
                <div className="error-card">
                    <div className="balance-card" style={{ borderLeft: '4px solid #f44336' }}>
                        <div className="balance-card-label">❌ Error</div>
                        <div className="balance-card-value">No se pudieron cargar los datos</div>
                        <div className="balance-card-desc">
                            {error}
                            <button 
                                onClick={fetchExpenses} 
                                style={{ 
                                    marginLeft: '8px', 
                                    padding: '4px 8px', 
                                    fontSize: '0.8em',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gastos.length === 0) {
        return (
            <div className="balance-cards-container">
                <div className="empty-card">
                    <div className="balance-card">
                        <div className="balance-card-label">📭 Sin datos</div>
                        <div className="balance-card-value">$ 0.00</div>
                        <div className="balance-card-desc">
                            No hay gastos registrados aún
                            <button 
                                onClick={fetchExpenses} 
                                style={{ 
                                    marginLeft: '8px', 
                                    padding: '4px 8px', 
                                    fontSize: '0.8em',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                ↻ Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="balance-cards-container">
            {cardData.map((card, idx) => (
                <div 
                    key={idx} 
                    className="balance-card"
                    style={{ borderLeft: `4px solid ${card.color}` }}
                >
                    <div className="balance-card-label">{card.label}</div>
                    <div className="balance-card-value" style={{ color: card.color }}>
                        {card.value}
                    </div>
                    <div className="balance-card-desc">{card.description}</div>
                </div>
            ))}
            
            {/* Información adicional */}
            <div style={{
                gridColumn: '1 / -1',
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '0.9em',
                color: '#666',
                textAlign: 'center'
            }}>
                📊 Calculado con {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} registrado{gastos.length !== 1 ? 's' : ''}
                <button 
                    onClick={fetchExpenses} 
                    style={{ 
                        marginLeft: '12px', 
                        padding: '6px 12px', 
                        fontSize: '0.8em',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                    title="Actualizar datos"
                >
                    ↻ Actualizar balance
                </button>
            </div>
        </div>
    );
};

export default BalanceCards;