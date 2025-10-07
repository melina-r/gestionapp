import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import GroupDashboard from './groupDashboard';
import '../styles/groups.css';

function Dialog({ open, title, message, onClose }) {
  if (!open) return null;
  return (
      <div className="dlg__overlay" onClick={(e) => e.target.classList.contains('dlg__overlay') && onClose()}>
        <div className="dlg__card" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
          <div className="dlg__icon">✅</div>
          <h3 id="dlg-title" className="dlg__title">{title}</h3>
          <p className="dlg__msg">{message}</p>
          <div className="dlg__actions">
            <button className="btn btn--primary" onClick={onClose}>OK</button>
          </div>
        </div>
      </div>
  );
}

const Groups = forwardRef((props, ref) => {
  const [groups, setGroups] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [dlgSuccess, setDlgSuccess] = useState({ open: false, name: '' });
  const [dlgError, setDlgError] = useState({ open: false, message: '' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/groups/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Transformar los datos de la API al formato que usa el frontend
        const transformedGroups = data.map(group => ({
          id: group.id,
          name: group.nombre,
          members: group.member_count || 0,
          balance: 0  // TODO: calcular el balance real
        }));
        setGroups(transformedGroups);
      }
    } catch (error) {
      console.error('Error al cargar grupos:', error);
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      const name = newGroupName.trim();
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/groups/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nombre: name,
            direccion: null,
            descripcion: null
          })
        });

        if (response.ok) {
          await fetchGroups(); // Recargar la lista de grupos
          setNewGroupName('');
          setShowCreateModal(false);
          setDlgSuccess({ open: true, name });
        } else {
          console.error('Error al crear grupo');
        }
      } catch (error) {
        console.error('Error al crear grupo:', error);
      }
    }
  };

  const handleJoinGroup = async () => {
    if (joinCode.trim()) {
      const code = joinCode.trim().toUpperCase();
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/groups/join/${code}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          await fetchGroups(); // Recargar la lista de grupos
          setJoinCode('');
          setShowJoinModal(false);
          setDlgSuccess({ open: true, name: data.group.nombre });
        } else {
          const error = await response.json();
          setDlgError({ open: true, message: error.detail || 'Error al unirse al grupo' });
        }
      } catch (error) {
        console.error('Error al unirse al grupo:', error);
        setDlgError({ open: true, message: 'Error de conexión' });
      }
    }
  };

  useImperativeHandle(ref, () => ({
    goHome: () => {
      setSelectedGroup(null);
    }
  }));


  if (selectedGroup) {
    return <GroupDashboard group={selectedGroup} onBack={handleBackToGroups} />;
  }

  return (
      <div className="groups-container">
        <div className="groups-header">
          <h1>Mis Grupos</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
                className="create-group-btn"
                onClick={() => setShowJoinModal(true)}
            >
              Unirse a Grupo
            </button>
            <button
                className="create-group-btn"
                onClick={() => setShowCreateModal(true)}
            >
              + Crear Grupo
            </button>
          </div>
        </div>

        <div className="groups-grid">
          {groups.map(group => (
              <div key={group.id} className="group-card" onClick={() => handleSelectGroup(group)}>
                <div className="group-header">
                  <h3 className="group-name-clickable">{group.name}</h3>
                  <span className="member-count">
                {`${group.members} miembros`}
              </span>
                </div>
              </div>
          ))}
        </div>

        {showCreateModal && (
            <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Crear Nuevo Grupo</h2>
                <input
                    type="text"
                    placeholder="Nombre del grupo"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                    autoFocus
                />
                <div className="modal-actions">
                  <button
                      className="cancel-btn"
                      onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                      className="create-btn"
                      onClick={handleCreateGroup}
                      disabled={!newGroupName.trim()}
                  >
                    Crear Grupo
                  </button>
                </div>
              </div>
            </div>
        )}

        {showJoinModal && (
            <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Unirse a un Grupo</h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                  Ingresa el código de invitación del grupo
                </p>
                <input
                    type="text"
                    placeholder="Código de invitación"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
                    autoFocus
                    maxLength={10}
                    style={{ textTransform: 'uppercase' }}
                />
                <div className="modal-actions">
                  <button
                      className="cancel-btn"
                      onClick={() => setShowJoinModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                      className="create-btn"
                      onClick={handleJoinGroup}
                      disabled={!joinCode.trim()}
                  >
                    Unirse
                  </button>
                </div>
              </div>
            </div>
        )}

        <Dialog
            open={dlgSuccess.open}
            title={dlgSuccess.name ? "¡Éxito!" : "Grupo creado"}
            message={dlgSuccess.name ? `Te has unido exitosamente al grupo "${dlgSuccess.name}".` : "El grupo se creó correctamente."}
            onClose={() => setDlgSuccess({ open: false, name: '' })}
        />

        <Dialog
            open={dlgError.open}
            title="Error"
            message={dlgError.message}
            onClose={() => setDlgError({ open: false, message: '' })}
        />
      </div>
  );
});

Groups.displayName = 'Groups';

export default Groups;
