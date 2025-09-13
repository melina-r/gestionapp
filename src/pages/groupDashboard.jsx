import { useState } from 'react';
import BalanceCards from '../components/balance_cards';
import Resume from '../components/resume';
import Graphics from '../components/graphics';
import GroupDetails from './groupDetails';
import Tabs from '../components/tabs';
import RegisterExpenseModal from '../components/registerModal';
import '../styles/groupDashboard.css';

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
          <RegisterExpenseModal />
        </div>
      </div>

      <Tabs
        tabs={['Dashboard', 'Detalles']}
        onTabChange={setSelectedTab}
      />

      {selectedTab === 0 && (
        <div className="dashboard-tab">
          <BalanceCards />
          <Resume />
          <Graphics />
        </div>
      )}

      {selectedTab === 1 && (
        <GroupDetails group={group} />
      )}
    </div>
  );
};

export default GroupDashboard;