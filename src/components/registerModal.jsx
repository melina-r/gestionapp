import { useState } from "react";
import "../styles/registerModal.css";

export default function RegisterExpenseModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      setIsOpen(false);
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
            <form className="modal-form">
              <label>Nombre</label>
              <input type="text" placeholder="Value" />

              <label>Monto</label>
              <input type="number" placeholder="Value" />

              <label>Descripción (opcional)</label>
              <textarea placeholder="Value"></textarea>

              <button type="button" className="upload-btn">
                ⬆️ Subir comprobante
              </button>

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
