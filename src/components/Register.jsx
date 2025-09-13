import { useState } from 'react';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    departamento: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación básica
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    // En un prototipo, aceptamos cualquier dato
    if (formData.email && formData.password && formData.nombre) {
      onRegister(formData.email, formData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '15px',
    backgroundColor: '#ffffff',
    color: '#333333',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box',
    marginBottom: '12px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#555'
  };

  const handleFocus = (e) => e.target.style.borderColor = '#007bff';
  const handleBlur = (e) => e.target.style.borderColor = '#e1e5e9';

  return (
    <div style={{
      maxWidth: '480px',
      margin: '20px auto',
      padding: '35px',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      backgroundColor: 'white'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333', fontSize: '26px' }}>
        Crear Cuenta
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '18px' }}>
          <div>
            <label style={labelStyle}>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          
          <div>
            <label style={labelStyle}>Apellido:</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Teléfono:</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '18px' }}>
          <div>
            <label style={labelStyle}>Dirección:</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          
          <div>
            <label style={labelStyle}>Depto:</label>
            <input
              type="text"
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
              placeholder="1A, 2B, etc."
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          <div>
            <label style={labelStyle}>Contraseña:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          
          <div>
            <label style={labelStyle}>Confirmar Contraseña:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>
        
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '25px',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
        >
          Crear Cuenta
        </button>
      </form>
      
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '15px 0', color: '#666', fontSize: '16px' }}>¿Ya tienes cuenta?</p>
        <button
          onClick={onSwitchToLogin}
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
          Iniciar sesión
        </button>
      </div>
    </div>
  );
};

export default Register;