import React, { useEffect, useState } from 'react';
import '../styles/balance_cards.css';

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
    });
}

const BalanceCards = () => {
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

    // Calcular valores
    let total = 0;
    let propios = 0;
    if (gastos.length > 0) {
        gastos.forEach(g => {
            const valor = Number(g.valor.replace(/[^\d.]/g, ''));
            total += valor;
            if (g.autor === 'Juan Perez') propios += valor;
        });
    }
    const aPagar = total - propios;

    const cardData = [
        { label: 'Gastos propios', value: `$ ${propios.toLocaleString()}`, description: 'Gastos registrados por Juan Perez' },
        { label: 'A pagar', value: `$ ${aPagar.toLocaleString()}`, description: 'Total a pagar este mes' },
        { label: 'Gastos totales', value: `$ ${total.toLocaleString()}`, description: 'Total de gastos este mes' },
    ];

    return (
        <div className="balance-cards-container">
            {loading ? (
                <div>Cargando...</div>
            ) : (
                cardData.map((card, idx) => (
                    <div key={idx} className="balance-card">
                        <div className="balance-card-label">{card.label}</div>
                        <div className="balance-card-value">{card.value}</div>
                        <div className="balance-card-desc">{card.description}</div>
                    </div>
                ))
            )}
        </div>
    );
};

export default BalanceCards;