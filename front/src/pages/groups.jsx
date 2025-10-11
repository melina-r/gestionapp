import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import GroupDashboard from './groupDashboard';
import { getGroups, createGroup } from '../utils/groupsUtils.js';
import '../styles/groups.css';

const API = 'http://localhost:8000';

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
  const [newGroupName, setNewGroupName] = useState('');

  // Modal para UNIRSE con código
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [dlgSuccess, setDlgSuccess] = useState({ open: false, title: '', message: '' });

  // Usuario actual (desde storage)
  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem('usuario') || sessionStorage.getItem('user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      if ('id' in u) return { id: Number(u.id), nombre: u.nombre || '', email: u.email || u.mail || '' };
      if ('mail' in u) return { id: Number(u.id), nombre: u.nombre || '', email: u.mail };
      return null;
    } catch {
      return null;
    }
  };
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;

  const authHeaders = () => {
    const h = {};
    const token = localStorage.getItem('token') || sessionStorage.getItem('access_token');
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  // 🔹 Cargar grupos desde el backend
  useEffect(() => {
    (async () => {
      try {
        const data = await getGroups();
        setGroups(data);
      } catch (error) {
        console.error(error);
        alert("Error al cargar los grupos");
      }
    })();
  }, []);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
  };

  // 🔹 Crear grupo
  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      try {
        const newGroup = await createGroup(newGroupName.trim());
        setGroups([...groups, newGroup]);
        setNewGroupName('');
        setShowCreateModal(false);
        setDlgSuccess({ open: true, title: 'Grupo creado', message: `El grupo "${newGroup.name}" se creó correctamente.` });
      } catch (error) {
        alert(error.message);
      }
    }
  };

  // 🔹 Unirse a grupo con código
  const handleJoinGroup = async () => {
    setJoinError('');
    const code = joinCode.trim();
    if (!code) {
      setJoinError('Ingresá un código válido');
      return;
    }
    if (!currentUserId) {
      setJoinError('No se encontró el usuario actual. Iniciá sesión de nuevo.');
      return;
    }

    setJoinLoading(true);
    try {
      const r = await fetch(`${API}/groups/accept/${encodeURIComponent(code)}?user_id=${currentUserId}`, {
        method: 'POST',
        headers: { ...authHeaders() }
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || `Error ${r.status}`);
      }
      const j = await r.json();

      // refrescar lista de grupos
      const refreshed = await getGroups();
      setGroups(refreshed);

      // intentar mostrar nombre del grupo si lo encontramos
      const joined = refreshed.find(g => String(g.id) === String(j.group_id));
      const gName = joined?.name ? ` "${joined.name}"` : '';
      setDlgSuccess({
        open: true,
        title: 'Ingreso exitoso',
        message: `Te uniste al grupo${gName} correctamente.`
      });

      setShowJoinModal(false);
      setJoinCode('');
      setJoinError('');
    } catch (e) {
      setJoinError(e.message || 'No se pudo unir con ese código');
    } finally {
      setJoinLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    goHome: () => setSelectedGroup(null)
  }));

  if (selectedGroup) {
    return <GroupDashboard group={selectedGroup} onBack={handleBackToGroups} />;
  }

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>Mis Grupos</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="create-group-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Crear Grupo
          </button>
          <button
            className="create-group-btn"
            onClick={() => setShowJoinModal(true)}
            style={{ backgroundColor: '#10b981' }}
          >
            ⇢ Unirse a un grupo
          </button>
        </div>
      </div>

      <div className="groups-grid">
        {groups.map(group => (
          <div key={group.id} className="group-card" onClick={() => handleSelectGroup(group)}>
            <div className="group-header">
              <h3 className="group-name-clickable">{group.name}</h3>
              <span className="member-count">{`${group.members} miembros`}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal crear grupo */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Crear Nuevo Grupo</h2>
            <input
              type="text"
              placeholder="Nombre del grupo"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancelar</button>
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

      {/* Modal unirse con código */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Unirse a un Grupo</h2>
            <p>Ingresá el código de invitación que te compartieron.</p>
            <input
              type="text"
              placeholder="Ej: G1-abcDEF123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !joinLoading && handleJoinGroup()}
              autoFocus
            />
            {joinError && <div style={{ color: '#b91c1c', marginTop: 8 }}>{joinError}</div>}
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowJoinModal(false)}>Cancelar</button>
              <button
                className="create-btn"
                onClick={handleJoinGroup}
                disabled={!joinCode.trim() || joinLoading}
              >
                {joinLoading ? 'Uniendo…' : 'Unirme'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={dlgSuccess.open}
        title={dlgSuccess.title}
        message={dlgSuccess.message}
        onClose={() => setDlgSuccess({ open: false, title: '', message: '' })}
      />
    </div>
  );
});

Groups.displayName = 'Groups';
export default Groups;
