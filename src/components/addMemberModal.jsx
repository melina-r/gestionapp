import React, { useState } from 'react';
import '../styles/addMemberModal.css';

export default function AddMemberModal({ isOpen, onClose, onSubmit }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            alert('Por favor ingresa un email válido');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Por favor ingresa un email con formato válido');
            return;
        }

        setIsLoading(true);

        try {
            await onSubmit(email);
            setEmail('');
            onClose();
        } catch (error) {
            alert('Error al enviar la invitación: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setEmail('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Agregar Nuevo Miembro</h2>
                    <button
                        className="modal-close"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="email">Email del nuevo miembro:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@email.com"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn-cancel"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Enviando...' : 'Enviar Invitación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}