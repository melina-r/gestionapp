import { useState } from 'react';
import Login from './Login';
import Register from './Register';

const Auth = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [users, setUsers] = useState([
    // Usuario de ejemplo para el prototipo
    { email: 'admin@consorcio.com', password: 'admin123', nombre: 'Admin', apellido: 'Consorcio' }
  ]);

  const handleLogin = (email) => {
    // En un prototipo, cualquier email válido puede iniciar sesión
    console.log('Usuario logueado:', email);
    onAuthenticated(email);
  };

  const handleRegister = (email, userData) => {
    // Guardar nuevo usuario en el estado local
    const newUser = {
      email,
      ...userData,
      id: Date.now() // ID simple para el prototipo
    };
    
    setUsers(prev => [...prev, newUser]);
    console.log('Nuevo usuario registrado:', newUser);
    
    // Automáticamente loguear después del registro
    onAuthenticated(email);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {isLogin ? (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setIsLogin(false)}
        />
      ) : (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setIsLogin(true)}
        />
      )}
      
  
    </div>
  );
};

export default Auth;