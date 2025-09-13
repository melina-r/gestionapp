import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/header'
import Tabs from './components/tabs'
import BalanceCards from './components/balance_cards'
import Resume from './components/resume'
import Graphics from './components/graphics'
import Dashboard from './pages/dashboard'
import Details from './pages/details'
import Auth from './components/Auth'

function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleAuthenticated = (userEmail) => {
    setIsAuthenticated(true);
    setCurrentUser(userEmail);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Si no está autenticado, mostrar pantalla de login/registro
  if (!isAuthenticated) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  // Si está autenticado, mostrar la aplicación principal
  return (
    <>
      <Header user={currentUser} onLogout={handleLogout} />
      <Tabs
        tabs={['Dashboard', 'Detalles']}
        onTabChange={setSelectedTab}
      />
      {selectedTab === 0 && <Dashboard />}
      {selectedTab === 1 && <Details />}
    </>
  )
}

export default App
