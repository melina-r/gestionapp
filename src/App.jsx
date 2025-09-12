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

function App() {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <>
      <Header />
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
