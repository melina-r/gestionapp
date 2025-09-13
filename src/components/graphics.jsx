import React from 'react';
import '../styles/graphics.css';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineElement, PointElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const monthlyExpensesData = {
    labels: ['Mantenimiento', 'Servicios Básicos', 'Limpieza', 'Seguridad', 'Reparaciones'],
    datasets: [
        {
            label: 'Gastos del consorcio',
            data: [18500, 12000, 8500, 15000, 14000],
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54,162,235,0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#36A2EB',
        },
    ],
};

const yearlyExpensesData = {
    labels: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    datasets: [
        {
            label: 'Gastos del consorcio por mes',
            data: [68000, 65000, 72000, 85000, 78000, 92000, 89000, 71000, 75000, 82000, 95000, 105000],
            backgroundColor: '#36A2EB',
        },
    ],
};

export default function Graphics() {
    return (
        <div className="graphics-container">
            <div className="line-chart">
                <Line data={monthlyExpensesData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
            </div>
            <div className="bar-chart">
                <Bar data={yearlyExpensesData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
        </div>
    );
}
