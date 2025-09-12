import React from 'react';
import BalanceCards from '../components/balance_cards';
import Resume from '../components/resume';
import Graphics from '../components/graphics';
import '../styles/dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard-tab">
            <BalanceCards />
            <Resume />
            <Graphics />
        </div>
    );
};

export default Dashboard;