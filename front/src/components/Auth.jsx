import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";

const API_URL = "http://localhost:8000";

const Auth = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);

  function extractErrorMessage(errData, fallback) {
    if (!errData) return fallback;
    if (typeof errData === 'string') return errData;
    if (errData.detail) {
      if (Array.isArray(errData.detail)) {
        const s = errData.detail.map(d => d?.msg || d?.type || '').filter(Boolean).join(' · ');
        return s || fallback;
      }
      if (typeof errData.detail === 'string') return errData.detail;
      try { return JSON.stringify(errData.detail); } catch { /* ignore */ }
    }
    if (errData.message) return errData.message;
    try { return JSON.stringify(errData); } catch { return fallback; }
  }

  function persistUserAndToken(data, emailFallback) {
    // Token (tu API puede devolver access_token o token)
    const token = data?.access_token ?? data?.token ?? null;
    if (token) {
      sessionStorage.setItem("access_token", token);
      localStorage.setItem("token", token);
    }

    // Id en distintos formatos comunes
    const id = Number(
      data?.user_id ??
      data?.id ??
      data?.user?.id ??
      data?.usuario?.id ??
      data?.data?.id ??
      data?.id_usuario ??
      data?.uid
    );

    if (!Number.isFinite(id)) {
      throw new Error("Login ok pero no vino un id de usuario reconocible");
    }

    const nombre =
      data?.nombre ??
      data?.name ??
      data?.user?.nombre ??
      data?.user?.name ??
      "";

    const apellido =
      data?.apellido ??
      data?.last_name ??
      data?.user?.apellido ??
      data?.user?.last_name ??
      "";

    const email =
      data?.email ??
      data?.mail ??
      data?.user?.email ??
      data?.usuario?.email ??
      emailFallback;

    // Sesión (si tu app la usa en otras partes)
    sessionStorage.setItem(
      "user",
      JSON.stringify({ id, nombre, apellido, mail: email })
    );

    // ✅ Clave que usa BalanceCards
    localStorage.setItem(
      "usuario",
      JSON.stringify({ id, nombre, email })
    );

    return { id, nombre, apellido, email, token };
  }

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Tu backend valida "mail"
        body: JSON.stringify({ mail: email.trim(), password }),
      });

      const data = await response.json(); // leer body una sola vez

      if (!response.ok) {
        const msg = extractErrorMessage(data, `Error ${response.status}`);
        throw new Error(msg);
      }

      const user = persistUserAndToken(data, email.trim());
      onAuthenticated?.(user); // antes pasabas email; podés dejarlo así si preferís
    } catch (error) {
      console.error("Login error:", error);
      alert("Error al iniciar sesión: " + (error.message || "desconocido"));
    }
  };

  const handleRegister = async (email, password, nombre, apellido) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail: email.trim(), password, nombre, apellido }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = extractErrorMessage(data, `Error ${response.status}`);
        alert(msg || "Error al registrar");
        return;
      }

      // Si tu /auth/register devuelve los datos del user, podés persistir ya:
      if (data?.id || data?.user_id || data?.user?.id) {
        try {
          // Guardar (sin token aún)
          const id = Number(
            data?.id ?? data?.user_id ?? data?.user?.id
          );
            // nombre/apellido/mail desde payload o los del form
          const emailOut = data?.email ?? data?.mail ?? email.trim();
          const nombreOut = data?.nombre ?? nombre ?? "";
          const apellidoOut = data?.apellido ?? apellido ?? "";

          sessionStorage.setItem(
            "user",
            JSON.stringify({ id, nombre: nombreOut, apellido: apellidoOut, mail: emailOut })
          );
          localStorage.setItem(
            "usuario",
            JSON.stringify({ id, nombre: nombreOut, email: emailOut })
          );
        } catch {
          // si el payload no trae id usable, no persistimos acá
        }
      }

      // Luego logueamos para obtener token y dejar todo consistente
      await handleLogin(email, password);
    } catch (error) {
      console.error("Register error:", error);
      alert("Error al registrar: " + (error.message || "desconocido"));
    }
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
