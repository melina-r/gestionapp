import { useState, useImperativeHandle, forwardRef } from 'react';
import GroupDashboard from './groupDashboard';
import '../styles/groups.css';

const Groups = forwardRef((props, ref) => {
  const [groups, setGroups] = useState([
    { id: 1, name: "Consorcio", members: 15, balance: 2340.80 }
  ]);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const newGroup = {
        id: Date.now(),
        name: newGroupName.trim(),
        members: 1,
        balance: 0
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setShowCreateModal(false);
    }
  };

  // Exponer función de navegación al componente padre
  useImperativeHandle(ref, () => ({
    goHome: () => {
      setSelectedGroup(null);
    }
  }));

  const formatBalance = (balance) => {
    const color = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral';
    return <span className={`balance ${color}`}>${Math.abs(balance).toFixed(2)}</span>;
  };

  // Si hay un grupo seleccionado, mostrar su dashboard
  if (selectedGroup) {
    return <GroupDashboard group={selectedGroup} onBack={handleBackToGroups} />;
  }

  // Mostrar lista de grupos
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
    </div>
  );
});

Groups.displayName = 'Groups';

export default Groups;