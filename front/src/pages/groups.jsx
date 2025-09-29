import { useState, useImperativeHandle, forwardRef } from 'react';
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
  const [groups, setGroups] = useState([
    { id: 1, name: "Consorcio", members: 15, balance: 2340.80 }
  ]);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [dlgSuccess, setDlgSuccess] = useState({ open: false, name: '' });

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const name = newGroupName.trim();
      const newGroup = {
        id: Date.now(),
        name,
        members: 1,
        balance: 0
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setShowCreateModal(false);
      setDlgSuccess({ open: true, name });
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
          <button
              className="create-group-btn"
              onClick={() => setShowCreateModal(true)}
          >
            + Crear Grupo
          </button>
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

        <Dialog
            open={dlgSuccess.open}
            title="Grupo creado"
            message={`El grupo "${dlgSuccess.name}" se creó correctamente.`}
            onClose={() => setDlgSuccess({ open: false, name: '' })}
        />
      </div>
  );
});

Groups.displayName = 'Groups';

export default Groups;
