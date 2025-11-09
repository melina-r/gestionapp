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
      console.log('🔐 Current User:', currentUser);
      console.log('👤 Current User ID:', currentUserId);
      console.log('🏢 Group ID:', groupId);

      const usersData = {};
      const uniqueUserIds = new Set();

      const groupIdParam = groupId ? `?grupo_id=${groupId}` : '';
      const debtsUrl = `${API}/expenses/debts/${currentUserId}${groupIdParam}`;
      const creditsUrl = `${API}/expenses/credits/${currentUserId}${groupIdParam}`;

      console.log('📡 Fetching debts from:', debtsUrl);
      console.log('📡 Fetching credits from:', creditsUrl);

      const [debtsResponse, creditsResponse] = await Promise.all([
        fetch(debtsUrl, { headers: authHeaders() }),
        fetch(creditsUrl, { headers: authHeaders() })
      ]);

      console.log('📥 Debts response status:', debtsResponse.status);
      console.log('📥 Credits response status:', creditsResponse.status);

      let debtsData = await debtsResponse.json();
      let creditsData = await creditsResponse.json();

      debtsData = Array.isArray(debtsData) ? debtsData : [];
      creditsData = Array.isArray(creditsData) ? creditsData : [];

      console.log('📊 Debts data:', debtsData);
      console.log('📊 Credits data:', creditsData);

      debtsData.forEach(debt => uniqueUserIds.add(debt.acreedor_id));
      creditsData.forEach(credit => uniqueUserIds.add(credit.deudor_id));

      for (const userId of uniqueUserIds) {
        const userResponse = await fetch(`${API}/users/${userId}`, { headers: authHeaders() });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          usersData[userId] = userData;
        }
      }

      const pendingDebts = debtsData.filter(debt => Number(debt.estado) === 0);
      const pendingCredits = creditsData.filter(credit => Number(credit.estado) === 0);

      console.log('💳 Pending debts:', pendingDebts);
      console.log('💰 Pending credits:', pendingCredits);

      const groupedDebts = groupByUser(pendingDebts, 'acreedor_id');
      const groupedCredits = groupByUser(pendingCredits, 'deudor_id');

      const expenseIds = new Set([
        ...pendingDebts.map(d => d.gasto_id),
        ...pendingCredits.map(c => c.gasto_id)
      ]);

      console.log('🔍 Expense IDs to fetch:', Array.from(expenseIds));

      const expensesData = {};
      for (const id of expenseIds) {
        if (!id) {
          console.warn('⚠️ Skipping undefined expense ID');
          continue;
        }
        const response = await fetch(`${API}/expenses/${id}`, { headers: authHeaders() });
        if (response.ok) {
          const expense = await response.json();
          expensesData[id] = expense;
          console.log(`✅ Loaded expense ${id}:`, expense);
        } else {
          console.error(`❌ Failed to load expense ${id}:`, response.status);
        }
      }

      console.log('📦 All expenses loaded:', expensesData);
      console.log('👥 Grouped debts:', groupedDebts);
      console.log('💰 Grouped credits:', groupedCredits);

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

  const handleSettleAllDebtsWithCreditor = async (acreedorId) => {
    const userName = users[acreedorId]?.nombre || 'este usuario';
    if (!window.confirm(`¿Confirmas que pagaste todas las deudas con ${userName}?`)) return;
    try {
      const response = await fetch(`${API}/expenses/debts/settle-all?deudor_id=${currentUserId}&acreedor_id=${acreedorId}&grupo_id=${groupId}`, {
        method: 'POST',
        headers: authHeaders()
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al saldar las deudas');
      }
      const result = await response.json();
      alert(result.message);
      fetchUserData(); // Refrescar datos
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSettleIndividualDebt = async (debtId, amount, expenseTitle) => {
    if (!window.confirm(`¿Confirmas que pagaste la deuda de $${amount.toFixed(2)} por "${expenseTitle}"?`)) return;
    try {
      const response = await fetch(`${API}/expenses/debts/${debtId}/settle`, {
        method: 'PATCH',
        headers: authHeaders()
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al saldar la deuda');
      }
      const result = await response.json();
      alert(result.message);
      fetchUserData(); // Refrescar datos
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const renderExpandableTable = (data, type) => {
    const expanded = type === 'debt' ? expandedDebts : expandedCredits;
    const toggleFunction = (userId) => toggleExpansion(userId, type);

    if (Object.keys(data).length === 0) {
      return <p style={{ color: '#666', fontSize: '0.95rem', padding: '1rem' }}>No hay {type === 'debt' ? 'deudas' : 'créditos'} pendientes.</p>;
    }

    return (
      <table className="resume-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'center', padding: '12px' }}>Usuario</th>
            <th style={{ textAlign: 'center', padding: '12px' }}>Monto Total</th>
            {type === 'debt' && <th style={{ textAlign: 'center', padding: '12px' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([userId, userData]) => {
            return (
              <React.Fragment key={userId}>
                <tr className="expandable-row">
                  <td onClick={() => toggleFunction(userId)} style={{ cursor: 'pointer', padding: '12px', textAlign: 'left' }}>
                    <span className="expand-icon">{expanded[userId] ? '▼' : '▶'}</span>
                    {users[userId]?.nombre || 'Usuario desconocido'}
                  </td>
                  <td onClick={() => toggleFunction(userId)} style={{ cursor: 'pointer', padding: '12px', textAlign: 'center' }}>
                    ${userData.total.toFixed(2)}
                  </td>
                  {type === 'debt' && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleSettleAllDebtsWithCreditor(userId)}
                        className="settle-all-btn"
                        style={{
                          padding: '6px 16px',
                          fontSize: '0.85rem',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ✓ Pagado
                      </button>
                    </td>
                  )}
                </tr>
                {expanded[userId] && (
                  <tr className="expanded-content">
                    <td colSpan={type === 'debt' ? '3' : '2'} style={{ padding: '0', backgroundColor: '#f9f9f9' }}>
                      <div style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>Detalles:</div>
                        {userData.items.map((item, index) => (
                          <div
                            key={`${item.id || item.gasto_id}-${item.deudor_id}-${item.acreedor_id}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                              alignItems: 'center',
                              gap: '20px',
                              padding: '8px 0',
                              paddingLeft: '16px',
                              borderBottom: index < userData.items.length - 1 ? '1px solid #e0e0e0' : 'none'
                            }}
                          >
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <span style={{ fontWeight: '500' }}>{expenses[item.gasto_id]?.titulo || 'Cargando...'}</span>
                            </div>
                            <div style={{ minWidth: '80px', textAlign: 'left', fontWeight: '500' }}>
                              ${item.monto.toFixed(2)}
                            </div>
                            {type === 'debt' && (
                              <div>
                                <button
                                  onClick={() => handleSettleIndividualDebt(item.id, item.monto, expenses[item.gasto_id]?.titulo || 'Gasto')}
                                  style={{
                                    padding: '4px 12px',
                                    fontSize: '0.8rem',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  ✓ Pagar
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="resume-container">
      {/* Resumen de Gastos */}
      <div className="tables-grid">
        <div className="table-section">
          <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Mis Deudas</h3>
          {loading ? <p>Cargando deudas...</p> : renderExpandableTable(debts, 'debt')}
        </div>

        <div className="table-section">
          <h3 style={{ textAlign: 'center' }}>Mis Créditos</h3>
          {loading ? <p>Cargando créditos...</p> : renderExpandableTable(credits, 'credit')}
        </div>
      </div>

      <div className="resume-footer">
        <button onClick={handleRefresh} disabled={loading} className="refresh-button">
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
