import React, { useState } from "react";
import "../styles/registerModal.css";

export default function RegisterExpenseModal({ onRegister }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = React.useRef(null);
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      setIsOpen(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setFilePath("src/data/comprobantes/" + file.name); // simula ruta
    } else {
      setFileName("");
      setFilePath("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !monto) {
      setError("El nombre y monto son obligatorios");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Preparar los datos para enviar a la API
      const expenseData = {
        titulo: nombre,
        descripcion: descripcion || null,
        valor: parseFloat(monto),
        fecha: new Date().toISOString().slice(0, 10),
        autor: "Usuario Actual",
        usuario_id: 1,
        comprobante: filePath || null
      };

      console.log('🚀 Frontend corriendo en:', window.location.origin);
      console.log('📤 Enviando datos a API:', expenseData);
      console.log('🌐 URL de destino:', 'http://localhost:8000/expenses/');

      // Hacer la petición POST a la API
      const response = await fetch('http://localhost:8000/expenses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData)
      });

      console.log('📥 Respuesta recibida:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.detail || 'Error al crear el gasto');
      }

      const newExpense = await response.json();
      console.log('✅ Gasto creado exitosamente:', newExpense);
      
      // Llamar al callback del componente padre si existe
      if (onRegister) {
        onRegister(newExpense);
      }

      // Cerrar el modal y limpiar el formulario
      setIsOpen(false);
      setNombre("");
      setMonto("");
      setDescripcion("");
      setFileName("");
      setFilePath("");
      
      alert("Gasto registrado exitosamente!");

    } catch (err) {
      console.error('💥 Error al registrar gasto:', err);
      console.error('🔍 Tipo de error:', err.name);
      console.error('📝 Mensaje:', err.message);
      
      // Manejar diferentes tipos de errores
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('❌ No se pudo conectar con el servidor. ¿Está corriendo en el puerto 8000?');
      } else {
        setError(err.message || 'Error al registrar el gasto');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button className="open-btn" onClick={() => setIsOpen(true)}>
        Registrar gasto
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content">
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              &times;
            </button>
            <h2>Registrar gasto</h2>
            
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                {error}
              </div>
            )}

            <form className="modal-form" onSubmit={handleSubmit}>
              <label>Nombre *</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                placeholder="Nombre del gasto"
                disabled={isLoading}
                required
              />

              <label>Monto *</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={monto} 
                onChange={e => setMonto(e.target.value)} 
                placeholder="0.00"
                disabled={isLoading}
                required
              />

              <label>Descripción (opcional)</label>
              <textarea 
                value={descripcion} 
                onChange={e => setDescripcion(e.target.value)} 
                placeholder="Descripción del gasto"
                disabled={isLoading}
              ></textarea>

              {/* Input file oculto */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <button 
                type="button" 
                className="upload-btn" 
                onClick={handleUploadClick}
                disabled={isLoading}
              >
                ⬆️ Subir comprobante
              </button>
              {fileName && (
                <div className="file-name">Archivo seleccionado: {fileName}</div>
              )}

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading || !nombre || !monto}
              >
                {isLoading ? "Registrando..." : "Finalizar registro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
