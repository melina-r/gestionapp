import React, { useEffect, useState } from 'react';
import AddMemberModal from './addMemberModal';
import { getGroupMembers } from '../utils/groupsUtils';
import '../styles/resume.css';

const API = 'http://localhost:8000';

export default function Resume({ groupId }) {
  const [debts, setDebts] = useState([]);
  const [credits, setCredits] = useState([]);
  const [expenses, setExpenses] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDebts, setExpandedDebts] = useState({});
  const [expandedCredits, setExpandedCredits] = useState({});

  // Invitaciones (código/link)
  const [inviteGenerating, setInviteGenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteMeta, setInviteMeta] = useState(null);
  const [copyOk, setCopyOk] = useState(false);

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
  const currentUserId = currentUser?.id ?? 1;

  const authHeaders = () => {
    const h = {};
    const token = localStorage.getItem('token') || sessionStorage.getItem('access_token');
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  useEffect(() => {
    if (!groupId) return;
    const fetchMembers = async () => {
      try {
        const miembros = await getGroupMembers(groupId);
        setUsuarios(miembros);
      } catch (err) {
        console.error('❌ Error al obtener los miembros:', err);
        setError(`Error al cargar los miembros: ${err.message}`);
      }
    };
    fetchMembers();
  }, [groupId]);

  const handleAddMember = async (email) => {
    // Acá iría tu lógica real de invitación por email
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          alert(`Invitación enviada exitosamente a ${email}`);
          resolve();
        } else {
          reject(new Error('Error simulado en el envío'));
        }
      }, 1500);
    });
  };

  const handleRefresh = () => {
    fetchUserData();
    if (groupId) refreshMembers();
  };

  const refreshMembers = async () => {
    try {
      const miembros = await getGroupMembers(groupId);
      setUsuarios(miembros);
    } catch (err) {
      console.error('❌ Error al refrescar miembros:', err);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    setError("");
    try {
      const usersData = {};
      const uniqueUserIds = new Set();

      const groupIdParam = groupId ? `?grupo_id=${groupId}` : '';
      const [debtsResponse, creditsResponse] = await Promise.all([
        fetch(`${API}/expenses/debts/${currentUserId}${groupIdParam}`, { headers: authHeaders() }),
        fetch(`${API}/expenses/credits/${currentUserId}${groupIdParam}`, { headers: authHeaders() })
      ]);

      const debtsData = await debtsResponse.json();
      const creditsData = await creditsResponse.json();

      debtsData.forEach(debt => uniqueUserIds.add(debt.acreedor_id));
      creditsData.forEach(credit => uniqueUserIds.add(credit.deudor_id));

      for (const userId of uniqueUserIds) {
        const userResponse = await fetch(`${API}/users/${userId}`, { headers: authHeaders() });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          usersData[userId] = userData;
        }
      }

      const pendingDebts = debtsData.filter(debt => debt.estado === 0);
      const groupedDebts = groupByUser(pendingDebts, 'acreedor_id');
      const groupedCredits = groupByUser(creditsData, 'deudor_id');

      const expenseIds = new Set([
        ...pendingDebts.map(d => d.gasto_id),
        ...creditsData.map(c => c.gasto_id)
      ]);

      const expensesData = {};
      for (const id of expenseIds) {
        const response = await fetch(`${API}/expenses/${id}`, { headers: authHeaders() });
        if (response.ok) {
          const expense = await response.json();
          expensesData[id] = expense;
        }
      }

      setDebts(groupedDebts);
      setCredits(groupedCredits);
      setExpenses(expensesData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error al cargar los datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const groupByUser = (items, userIdField) => {
    return items.reduce((acc, item) => {
      const userId = item[userIdField];
      if (!acc[userId]) acc[userId] = { items: [], total: 0 };
      acc[userId].items.push(item);
      acc[userId].total += item.monto;
      return acc;
    }, {});
  };

  const toggleExpansion = (userId, type) => {
    if (type === 'debt') {
      setExpandedDebts(prev => ({ ...prev, [userId]: !prev[userId] }));
    } else {
      setExpandedCredits(prev => ({ ...prev, [userId]: !prev[userId] }));
    }
  };

  // ===== Invitaciones: generar código/link
  const handleGenerateInvite = async () => {
    if (!groupId) return;
    setInviteGenerating(true);
    setInviteCode('');
    setInviteLink('');
    setInviteMeta(null);
    setCopyOk(false);
    try {
      const r = await fetch(`${API}/groups/${groupId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({})
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || `Error ${r.status}`);
      }
      const j = await r.json();
      const code = j.code || j.invite_code || '';
      const url = j.url || `${window.location.origin}/join/${code}`;
      setInviteCode(code);
      setInviteLink(url);
      setInviteMeta({
        expires_at: j.expires_at || null,
        max_uses: j.max_uses ?? null,
        used_count: j.used_count ?? 0
      });
    } catch (e) {
      alert(`No se pudo generar el código: ${e.message || e}`);
    } finally {
      setInviteGenerating(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      setCopyOk(false);
    }
  };

  const renderExpandableTable = (data, type) => {
    const expanded = type === 'debt' ? expandedDebts : expandedCredits;
    const toggleFunction = (userId) => toggleExpansion(userId, type);

    return (
      <table className="resume-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Monto Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([userId, userData]) => (
            <React.Fragment key={userId}>
              <tr onClick={() => toggleFunction(userId)} className="expandable-row">
                <td>
                  <span className="expand-icon">{expanded[userId] ? '▼' : '▶'}</span>
                  {users[userId]?.nombre || 'Usuario desconocido'}
                </td>
                <td className="amount">
                  ${userData.total.toFixed(2)}
                </td>
              </tr>
              {expanded[userId] && (
                <tr className="expanded-content">
                  <td colSpan="2">
                    <table className="nested-table">
                      <tbody>
                        {userData.items.map((item) => (
                          <tr key={`${item.gasto_id}-${item.deudor_id}-${item.acreedor_id}`}>
                            <td>{expenses[item.gasto_id]?.titulo || 'Cargando...'}</td>
                            <td className="amount">${item.monto.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    );
  };

  return (
   <div className="resume-container">
      {/* Resumen de Gastos */}
      <div className="tables-grid">
        {/* Sección de Deudas */}
        <div className="table-section debt">
          <h3>💸 Mis Deudas</h3>
          {loading ? <p>Cargando deudas...</p> : renderExpandableTable(debts, 'debt')}
        </div>

        {/* Sección de Créditos */}
        <div className="table-section credit">
          <h3>🪙 Mis Créditos</h3>
          {loading ? <p>Cargando créditos...</p> : renderExpandableTable(credits, 'credit')}
        </div>
      </div>

      <div className="resume-footer">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="refresh-button"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>


      {error && (
        <div className="error-message">
          {error}
          <button onClick={handleRefresh}>Reintentar</button>
        </div>
      )}

      {/* Usuarios + Invitaciones */}
      <div className="resume-users">
        <div className="users-header" style={{ gap: 8, alignItems: 'center' }}>
          <h3>Usuarios</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="add-member-btn" onClick={() => setIsModalOpen(true)}>
              + Agregar miembro (email)
            </button>
            <button className="add-member-btn" onClick={handleGenerateInvite} disabled={inviteGenerating}>
              {inviteGenerating ? 'Generando…' : '⛓️ Generar código'}
            </button>
          </div>
        </div>

        {/* Panel de invitación por código */}
        {(inviteCode || inviteLink) && (
          <div className="invite-panel" style={{
            margin: '12px 0', padding: '12px', background: '#f9fbff',
            border: '1px solid #e0e7ff', borderRadius: 8
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div><strong>Código:</strong> <code>{inviteCode}</code></div>
              <button onClick={() => copyToClipboard(inviteCode)} className="copy-btn">
                Copiar código
              </button>
              <div style={{ flex: 1, minWidth: 240, wordBreak: 'break-all' }}>
                <strong>Link:</strong> <span>{inviteLink}</span>
              </div>
              <button onClick={() => copyToClipboard(inviteLink)} className="copy-btn">
                Copiar link
              </button>
              {copyOk && <span style={{ color: '#2e7d32' }}>¡Copiado!</span>}
            </div>
            {inviteMeta && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
                {inviteMeta.expires_at && <>Vence: {new Date(inviteMeta.expires_at).toLocaleString()} · </>}
                {inviteMeta.max_uses != null && <>Usos: {inviteMeta.used_count}/{inviteMeta.max_uses}</>}
              </div>
            )}
          </div>
        )}

        <ul className="resume-users-list">
          {usuarios.map((usuario, idx) => (
            <li key={`usuario-${idx}-${usuario.correo || usuario.email || usuario.id}`} className="resume-user-item">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre || 'User')}`}
                alt={usuario.nombre || 'Usuario'}
                className="resume-user-avatar"
              />
              <div>
                <div className="resume-user-name">{usuario.nombre}</div>
                <div className="resume-user-email">{usuario.correo || usuario.email}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <AddMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddMember}
      />
    </div>
  );
}
