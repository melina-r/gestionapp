import React, { useState } from 'react';
import '../styles/tabs.css';

const Tabs = ({ tabs, onTabChange }) => {
    const [selected, setSelected] = useState(0);

    const handleClick = (index) => {
        setSelected(index);
        if (onTabChange) onTabChange(index);
    };

    return (
        <div className="tabs-container">
            {tabs.map((tab, idx) => (
                <button
                    key={tab}
                    onClick={() => handleClick(idx)}
                    className={`tab-btn${selected === idx ? ' selected' : ''}`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default Tabs;