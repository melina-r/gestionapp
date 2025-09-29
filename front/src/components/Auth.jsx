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
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      alert("Error en login");
      return;
    }
    const data = await response.json();
    console.log("Usuario logueado:", data);
    onAuthenticated(email);
  };

  const handleRegister = async (email, password, nombre, apellido) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, nombre, apellido }),
    });
    if (!response.ok) {
      alert("Error al registrar");
      return;
    }
    const data = await response.json();
    console.log("Nuevo usuario:", data);
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