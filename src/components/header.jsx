import React from 'react';
import '../styles/header.css';
import RegisterExpenseModal from './registerModal';

const Header = () => {
    const [hovered, setHovered] = React.useState({
        icon: false,
        title: false,
        button: false,
        profile: false
    });

    return (
        <header className="header">
            {/* Left: Icon + Title */}
            <div className="header-left">
                {/* Peso Icon (SVG) */}
                <span
                    className={`icon${hovered.icon ? ' highlight' : ''}`}
                    onMouseEnter={() => setHovered(h => ({ ...h, icon: true }))}
                    onMouseLeave={() => setHovered(h => ({ ...h, icon: false }))}
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="12" fill="#1976d2"/>
                        <text x="12" y="16" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">$</text>
                    </svg>
                </span>
                <span
                    className={`title${hovered.title ? ' highlight' : ''}`}
                    onMouseEnter={() => setHovered(h => ({ ...h, title: true }))}
                    onMouseLeave={() => setHovered(h => ({ ...h, title: false }))}
                >
                    GestionApp
                </span>
            </div>

            {/* Right: Profile + Button */}
            <div className="header-right">
                {/* Register Expense Button */}
                <RegisterExpenseModal />
                {/* Profile Circle */}
                <div
                    className={`profile${hovered.profile ? ' highlight' : ''}`}
                    onMouseEnter={() => setHovered(h => ({ ...h, profile: true }))}
                    onMouseLeave={() => setHovered(h => ({ ...h, profile: false }))}
                >
                    {/* Placeholder user icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#bdbdbd">
                        <circle cx="12" cy="8" r="4"/>
                        <ellipse cx="12" cy="17" rx="7" ry="5"/>
                    </svg>
                </div>
            </div>
        </header>
    );
};

export default Header;