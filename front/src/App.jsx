import { useState, useRef, useEffect } from 'react'
import './App.css'
import Header from './components/header'
import Groups from './pages/groups'
import Auth from './components/Auth'
import { getUser } from './utils/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const groupsRef = useRef();

  // Check for existing session on mount and verify backend is available
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const user = getUser();

      if (token && user) {
        // Verify backend is available by making a test request
        try {
          const response = await fetch('http://127.0.0.1:8000/users/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            // Backend available and token valid
            setIsAuthenticated(true);
            setCurrentUser(user.mail);
            localStorage.removeItem('failed_fetch_attempts');
          } else {
            // Token invalid, clear session
            console.warn('⚠️ Token inválido, limpiando sesión...');
            localStorage.clear();
          }
        } catch (error) {
          // Backend not available, clear session
          console.warn('⚠️ Backend no disponible, limpiando sesión...', error);
          localStorage.clear();
        }
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
    localStorage.clear();
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
