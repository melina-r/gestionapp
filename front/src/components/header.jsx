import React from 'react';
import '../styles/header.css';
import RegisterExpenseModal from './registerModal';

const Header = ({ user, onLogout, onNavigateHome, showRegisterButton = false }) => {
    const [hovered, setHovered] = React.useState({
        icon: false,
        title: false,
        button: false,
        profile: false
    });

    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const menuRef = React.useRef(null);

    // Cerrar menú al hacer click fuera
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    // Obtener email del usuario
    const getUserEmail = () => {
        if (!user) return 'Usuario';
        if (typeof user === 'string') return user;
        return user.email || user.mail || user.nombre || 'Usuario';
    };

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
                    onClick={onNavigateHome}
                    style={{ cursor: 'pointer' }}
                >
                    GestionApp
                </span>
            </div>

            {/* Right: Profile + Button */}
            <div className="header-right">
                {/* Register Expense Button - Solo mostrar si showRegisterButton es true */}
                {showRegisterButton && <RegisterExpenseModal />}
                {/* Profile Circle */}
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <div
                        className={`profile${hovered.profile ? ' highlight' : ''}`}
                        onMouseEnter={() => setHovered(h => ({ ...h, profile: true }))}
                        onMouseLeave={() => setHovered(h => ({ ...h, profile: false }))}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{ cursor: 'pointer' }}
                    >
                        {/* Placeholder user icon */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#bdbdbd">
                            <circle cx="12" cy="8" r="4"/>
                            <ellipse cx="12" cy="17" rx="7" ry="5"/>
                        </svg>
                    </div>

                    {/* User menu dropdown */}
                    {showUserMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0',
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            padding: '10px',
                            minWidth: '200px',
                            zIndex: 1000,
                            marginTop: '8px'
                        }}>
                            <div style={{
                                padding: '10px',
                                borderBottom: '1px solid #eee',
                                fontSize: '14px',
                                color: '#666',
                                wordBreak: 'break-word'
                            }}>
                                {getUserEmail()}
                            </div>
                            <button
                                onClick={() => {
                                    setShowUserMenu(false);
                                    onLogout();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    color: '#dc3545'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;