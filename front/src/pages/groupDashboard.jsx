import { useState } from 'react';
import BalanceCards from '../components/balance_cards';
import Resume from '../components/resume';
import GroupDetails from './groupDetails';
import Tabs from '../components/tabs';
import RegisterExpenseModal from '../components/registerModal';
import '../styles/groupDashboard.css';
import Debts from './debts';
import Credits from './credits';

const GroupDashboard = ({ group, onBack }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div className="group-dashboard">
      <div className="group-breadcrumb">
        <button className="back-btn" onClick={onBack}>
          ← Volver a Grupos
        </button>
        <div className="breadcrumb-separator">/</div>
        <h1 className="group-title">{group.name}</h1>
        <span className="group-meta">({group.members} {" miembros"})</span>
        <div className="group-actions">
          <RegisterExpenseModal groupId={group.id} />
        </div>
      </div>

      <Tabs
        tabs={['Dashboard', 'Detalles', 'Deudas', 'Créditos']}
        onTabChange={setSelectedTab}
      />

      {selectedTab === 0 && (
        <div className="dashboard-tab">
          <BalanceCards groupId={group.id} />
          <Resume groupId={group.id} />
        </div>
      )}

      {selectedTab === 1 && (
        <GroupDetails group={group} />
      )}

      {selectedTab === 2 && (
        <Debts />
      )}

      {selectedTab === 3 && (
        <Credits />
      )}
    </div>
  );
};

export default GroupDashboard;