import { useState } from 'react';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData.email, formData.password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={{
      maxWidth: '450px',
      margin: '50px auto',
      padding: '40px',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      backgroundColor: 'white'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '35px', color: '#333', fontSize: '28px' }}>
        Iniciar Sesión
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
            Email:
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: '#ffffff',
              color: '#333333',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
            Contraseña:
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: '#ffffff',
              color: '#333333',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '25px',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Iniciar Sesión
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '15px 0', color: '#666', fontSize: '16px' }}>¿No tienes cuenta?</p>
        <button
          onClick={onSwitchToRegister}
          style={{
            backgroundColor: 'transparent',
            color: '#007bff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '17px',
            textDecoration: 'underline',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.target.style.color = '#0056b3'}
          onMouseOut={(e) => e.target.style.color = '#007bff'}
        >
          Crear cuenta
        </button>
      </div>
    </div>
  );
};

export default Login;