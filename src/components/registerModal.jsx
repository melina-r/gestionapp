import React, { useState } from "react";
import "../styles/registerModal.css";

export default function RegisterExpenseModal({ onRegister }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !monto) return;
    const gasto = {
      titulo: nombre,
      descripcion,
      valor: monto,
      fecha: new Date().toISOString().slice(0, 10),
      autor: "Juan Perez",
      comprobante: filePath || "",
      id: "gasto-dummy-" + Date.now()
    };
    if (onRegister) onRegister(gasto);
    setIsOpen(false);
    setNombre("");
    setMonto("");
    setDescripcion("");
    setFileName("");
    setFilePath("");
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
            <form className="modal-form" onSubmit={handleSubmit}>
              <label>Nombre</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Value" />

              <label>Monto</label>
              <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="Value" />

              <label>Descripción (opcional)</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Value"></textarea>

              {/* Input file oculto */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
              <button type="button" className="upload-btn" onClick={handleUploadClick}>
                ⬆️ Subir comprobante
              </button>
              {fileName && (
                <div className="file-name">Archivo seleccionado: {fileName}</div>
              )}

              <button type="submit" className="submit-btn">
                Finalizar registro
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
