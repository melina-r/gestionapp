import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";

const API_URL = "http://127.0.0.1:8000";

const Auth = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mail: email, password }),
    });
    if (!response.ok) {
      const errData = await response.json();
      const errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      alert(errorMsg || "Error en login");
      return;
    }
    const data = await response.json();
    console.log("Usuario logueado:", data);

    // Store token and user info in localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify({
      id: data.user_id,
      nombre: data.nombre,
      apellido: data.apellido,
      mail: email
    }));

    onAuthenticated(email);
  };

  const handleRegister = async (email, password, nombre, apellido) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mail: email, password, nombre, apellido }),
    });
    if (!response.ok) {
        const errData = await response.json();
        const errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        alert(errorMsg || "Error al registrar");
        return;
    }
    const data = await response.json();
    console.log("Nuevo usuario:", data);

    // Store user info in localStorage (registration doesn't return token, so login after)
    localStorage.setItem('user', JSON.stringify({
      id: data.id,
      nombre: data.nombre,
      apellido: data.apellido,
      mail: data.mail
    }));

    // Now login to get the token
    await handleLogin(email, password);
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