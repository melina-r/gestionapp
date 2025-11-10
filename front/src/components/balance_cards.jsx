import React, { useEffect, useMemo, useState } from 'react';
import '../styles/balance_cards.css';

const API = 'http://localhost:8000';

const BalanceCards = ({ groupId }) => {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [toReceive, setToReceive] = useState(0);
  const [toPay, setToPay] = useState(0);

  // group id efectivo: prop -> sessionStorage -> 1
  const gid = useMemo(() => {
    const stored = Number(sessionStorage.getItem('current_group_id'));
    return Number(groupId) || (Number.isFinite(stored) && stored > 0 ? stored : 1);
  }, [groupId]);

  const leerUsuario = () => {
    const rawLocal = localStorage.getItem('usuario');
    if (rawLocal) {
      try {
        const u = JSON.parse(rawLocal);
        if (u?.id != null) return { ...u, id: Number(u.id) };
      } catch {}
    }
    const rawSession = sessionStorage.getItem('user');
    if (rawSession) {
      try {
        const u = JSON.parse(rawSession);
        if (u?.id != null) return { id: Number(u.id), nombre: u.nombre || '', email: u.mail || u.email || '' };
      } catch {}
    }
    return null;
  };

  const buildAuthHeaders = () => {
    const h = {};
    const token = localStorage.getItem('token') || sessionStorage.getItem('access_token');
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  const fetchExpenses = async (userId, group) => {
  const resp = await fetch(`${API}/expenses/group/${group}`, { headers: buildAuthHeaders() });
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  const expenses = await resp.json();
  setGastos(Array.isArray(expenses) ? expenses : []);
};

  // ⬇️ NUEVO: usa las mismas endpoints que BalanceDetails
  const fetchTotalsFromLists = async (group, userId) => {
    const headers = buildAuthHeaders();
    const [resDebts, resCreds] = await Promise.all([
      fetch(`${API}/expenses/debts/${userId}?grupo_id=${group}`, { headers }),
      fetch(`${API}/expenses/credits/${userId}?grupo_id=${group}`, { headers }),
    ]);
    if (!resDebts.ok) throw new Error(`Debts ${resDebts.status}`);
    if (!resCreds.ok) throw new Error(`Credits ${resCreds.status}`);

    const debtsData = await resDebts.json();   // [{monto, estado, ...}]
    const creditsData = await resCreds.json(); // [{monto, estado, ...}]

    const pendingDebts = (Array.isArray(debtsData) ? debtsData : []).filter(d => Number(d.estado) === 0);
    const pendingCreds = (Array.isArray(creditsData) ? creditsData : []).filter(c => Number(c.estado) === 0);

    const totalDebts = pendingDebts.reduce((acc, d) => acc + Number(d.monto || 0), 0);
    const totalCreds = pendingCreds.reduce((acc, c) => acc + Number(c.monto || 0), 0);

    setToPay(totalDebts);
    setToReceive(totalCreds);
  };

  // Carga usuario
  useEffect(() => {
    const u = leerUsuario();
    if (!u) {
      setLoading(false);
      setError('Usuario no encontrado en localStorage/sessionStorage');
      return;
    }
    setUsuario(u);
  }, []);

  // Trae datos cuando tenemos usuario y gid
  useEffect(() => {
    if (!usuario || !gid) return;
    setLoading(true);
    setError('');
    Promise.all([
      fetchExpenses(usuario.id, gid),
      fetchTotalsFromLists(gid, usuario.id),
    ])
      .catch((e) => {
        console.error('❌ Error al cargar:', e);
        setError(e.message || 'Error cargando datos');
        setGastos([]);
        setToReceive(0);
        setToPay(0);
      })
      .finally(() => setLoading(false));
  }, [usuario, gid]);

  // ===== Cálculos locales (propios y “totales visibles”)
let total = 0;
let propios = 0;

if (gastos.length > 0 && usuario) {
  for (const gasto of gastos) {
    const valor = Number(gasto.valor);
    total += valor;
    if (Number(gasto.usuario_id) === Number(usuario.id)) {
      propios += valor;
    }
  }
}

  const aPagar = Number(toPay) || 0;
  const aRecibir = Number(toReceive) || 0;

  const cardData = [
    { label: 'Gastos propios', value: `$ ${propios.toFixed(2)}`, description: 'Gastos registrados por ti', color: '#4CAF50' },
    { label: 'A pagar', value: `$ ${aPagar.toFixed(2)}`, description: 'Lo que debés a otros', color: '#f44336' },
    { label: 'A recibir', value: `$ ${aRecibir.toFixed(2)}`, description: 'Lo que otros te deben', color: '#FF9800' },
    { label: 'Gastos totales', value: `$ ${total.toFixed(2)}`, description: 'Total de gastos (visibles)', color: '#2196F3' },
  ];

  const doRefresh = () => {
    if (!usuario) return;
    setLoading(true);
    Promise.all([
      fetchExpenses(usuario.id, gid),
      fetchTotalsFromLists(gid, usuario.id),
    ]).finally(() => setLoading(false));
  };

  // ===== Render
  if (loading) {
    return (
      <div className="balance-cards-container">
        <div className="balance-card">
          <div className="balance-card-label">🔄 Cargando...</div>
          <div className="balance-card-value">Obteniendo datos</div>
          <div className="balance-card-desc">Conectando con la base de datos</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="balance-cards-container">
        <div className="balance-card" style={{ borderLeft: '4px solid #f44336' }}>
          <div className="balance-card-label">❌ Error</div>
          <div className="balance-card-value">No se pudieron cargar los datos</div>
          <div className="balance-card-desc">
            {error}
            <button
              onClick={doRefresh}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                fontSize: '0.8em',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="balance-cards-container">
        <div className="balance-card" style={{ borderLeft: '4px solid #f44336' }}>
          <div className="balance-card-label">🔐 Sesión requerida</div>
          <div className="balance-card-value">No encontramos tu usuario</div>
          <div className="balance-card-desc">
            Iniciá sesión y reintentá.
            <button
              onClick={() => (window.location.href = '/login')}
              style={{
                marginLeft: '8px',
                padding: '6px 12px',
                fontSize: '0.9em',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Ir a Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gastos.length === 0) {
    return (
      <div className="balance-cards-container">
        <div className="balance-card">
          <div className="balance-card-label">📭 Sin datos</div>
          <div className="balance-card-value">$ 0.00</div>
          <div className="balance-card-desc">
            No hay gastos registrados aún
            <button
              onClick={doRefresh}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                fontSize: '0.8em',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ↻ Actualizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-cards-container">
      {cardData.map((card, idx) => (
        <div key={idx} className="balance-card" style={{ borderLeft: `4px solid ${card.color}` }}>
          <div className="balance-card-label">{card.label}</div>
          <div className="balance-card-value" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="balance-card-desc">{card.description}</div>
        </div>
      ))}

      <div
        style={{
          gridColumn: '1 / -1',
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '0.9em',
          color: '#666',
          textAlign: 'center'
        }}
      >
        📊 Calculado con {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} registrado{gastos.length !== 1 ? 's' : ''}
        <button
          onClick={doRefresh}
          style={{
            marginLeft: '12px',
            padding: '6px 12px',
            fontSize: '0.8em',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ↻ Actualizar balance
        </button>
      </div>
    </div>
  );
};

export default BalanceCards;
