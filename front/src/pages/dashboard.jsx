import React from 'react';
import BalanceCards from '../components/balance_cards';
import Resume from '../components/resume';
import '../styles/dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard-tab">
            <BalanceCards />
            <Resume />
        </div>
    );
};

export default Dashboard;