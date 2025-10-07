import { useState, useRef, useEffect } from 'react'
import './App.css'
import Header from './components/header'
import Groups from './pages/groups'
import Auth from './components/Auth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const groupsRef = useRef();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');

      if (token && user) {
        const userData = JSON.parse(user);
        setIsAuthenticated(true);
        setCurrentUser(userData.mail);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleAuthenticated = (userEmail) => {
    setIsAuthenticated(true);
    setCurrentUser(userEmail);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleNavigateHome = () => {
    if (groupsRef.current) {
      groupsRef.current.goHome();
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Cargando...
      </div>
    );
  }

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
