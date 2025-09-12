import React from 'react';
import '../styles/graphics.css';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineElement, PointElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const monthlyExpensesData = {
    labels: ['Alquiler', 'Comida', 'Transporte', 'Servicios', 'Otros'],
    datasets: [
        {
            label: 'Gastos del mes',
            data: [500, 300, 100, 150, 50],
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
            label: 'Gastos por mes',
            data: [1200, 1100, 1150, 1300, 1250, 1400, 1350, 1200, 1250, 1300, 1400, 1500],
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
