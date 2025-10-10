import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";

const API_URL = "http://localhost:8000";  // Cambia esto

const Auth = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = async (email, password) => {
    console.log("Attempting login with:", email);
    try {
        console.log("Making fetch request to:", `${API_URL}/auth/login`);
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
            },
            mode: 'cors',
            credentials: 'omit',
            body: JSON.stringify({ mail: email, password }),
        });
        console.log("Response received:", response.status);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Error en login");
        }

        const data = await response.json();
        console.log("Response data:", data); // Debug log

        sessionStorage.setItem('access_token', data.access_token);
        sessionStorage.setItem('user', JSON.stringify({
            id: data.user_id,
            nombre: data.nombre,
            apellido: data.apellido,
            mail: email
        }));

        onAuthenticated(email);
    } catch (error) {
        console.error("Detailed error:", {
            message: error.message,
            stack: error.stack
        });
        alert("Error al iniciar sesión: " + error.message);
    }
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

    // Store user info in sessionStorage (registration doesn't return token, so login after)
    sessionStorage.setItem('user', JSON.stringify({
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
