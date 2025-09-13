import { useState, useRef } from 'react'
import './App.css'
import Header from './components/header'
import Groups from './pages/groups'
import Auth from './components/Auth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const groupsRef = useRef();

  const handleAuthenticated = (userEmail) => {
    setIsAuthenticated(true);
    setCurrentUser(userEmail);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleNavigateHome = () => {
    if (groupsRef.current) {
      groupsRef.current.goHome();
    }
  };

  // Si no está autenticado, mostrar pantalla de login/registro
  if (!isAuthenticated) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  // Si está autenticado, mostrar la aplicación principal (página de grupos)
  return (
    <>
      <Header user={currentUser} onLogout={handleLogout} onNavigateHome={handleNavigateHome} />
      <Groups ref={groupsRef} />
    </>
  )
}

export default App
