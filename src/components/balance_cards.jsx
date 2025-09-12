import React from 'react';
import '../styles/balance_cards.css';

const cardData = [
    {
        label: 'Ingresos',
        value: '12,500',
        description: 'Total recibido este mes',
    },
    {
        label: 'Egresos',
        value: '8,200',
        description: 'Total gastado este mes',
    },
    {
        label: 'Balance',
        value: '4,300',
        description: 'Saldo actual',
    },
];

const BalanceCards = () => (
    <div className="balance-cards-container">
        {cardData.map((card, idx) => (
            <div key={idx} className="balance-card">
                <div className="balance-card-label">{card.label}</div>
                <div className="balance-card-value">{card.value}</div>
                <div className="balance-card-desc">{card.description}</div>
            </div>
        ))}
    </div>
);

export default BalanceCards;