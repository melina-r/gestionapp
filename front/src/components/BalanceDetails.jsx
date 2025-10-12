import { useEffect, useState, useMemo } from "react";

const BalanceDetails = ({ userId, groupId }) => {
  const [credits, setCredits] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  // group id efectivo: prop -> sessionStorage -> 1
  const gid = useMemo(() => {
    const stored = Number(sessionStorage.getItem('current_group_id'));
    return Number(groupId) || (Number.isFinite(stored) && stored > 0 ? stored : 1);
  }, [groupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCred, resDebt] = await Promise.all([
        fetch(`http://localhost:8000/expenses/credits/${userId}?grupo_id=${gid}`),
        fetch(`http://localhost:8000/expenses/debts/${userId}?grupo_id=${gid}`),
      ]);

      const creditsData = await resCred.json();
      const debtsData = await resDebt.json();

      setCredits(creditsData);
      setDebts(debtsData);
    } catch (err) {
      console.error("Error al obtener deudas/créditos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, gid]);

  if (loading) return <p style={{ color: "black" }}>Cargando balance detallado...</p>;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>💰 Detalle de Balance</h2>

      <div style={styles.section}>
        <h3 style={styles.subtitle}>💸 Te deben</h3>
        {credits.length === 0 ? (
          <p style={styles.text}>Nadie te debe nada.</p>
        ) : (
          <ul style={styles.list}>
            {credits.map((c, i) => (
              <li key={i} style={styles.item}>
                <span style={styles.name}>
                  Usuario <strong>{c.deudor_nombre || c.deudor_id}</strong>
                </span>
                <span style={styles.amountPos}>+ ${c.monto.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.subtitle}>🧾 Debés a otros</h3>
        {debts.length === 0 ? (
          <p style={styles.text}>No debés nada.</p>
        ) : (
          <ul style={styles.list}>
            {debts.map((d, i) => (
              <li key={i} style={styles.item}>
                <span style={styles.name}>
                  A <strong>{d.acreedor_nombre || d.acreedor_id}</strong>
                </span>
                <span style={styles.amountNeg}>− ${d.monto.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    marginTop: "2rem",
    background: "white",
    color: "black",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    padding: "1.5rem",
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
    fontFamily: "system-ui, sans-serif",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "700",
    borderBottom: "2px solid #ddd",
    paddingBottom: "0.5rem",
    marginBottom: "1rem",
    color: "#000",
  },
  section: {
    marginBottom: "1.5rem",
  },
  subtitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "0.75rem",
    color: "#000",
  },
  text: {
    fontSize: "1rem",
    color: "#000",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  item: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "0.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#000",
  },
  name: {
    fontWeight: "500",
  },
  amountPos: {
    color: "#16a34a",
    fontWeight: "700",
  },
  amountNeg: {
    color: "#dc2626",
    fontWeight: "700",
  },
};

export default BalanceDetails;
