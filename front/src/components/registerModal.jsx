import React, { useEffect, useRef, useState } from "react";
import "../styles/registerModal.css";
import { authenticatedFetch } from '../utils/api';

function Dialog({ open, type = "info", title, message, onClose, onPrimary, primaryText = "OK" }) {
  if (!open) return null;
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "⚠️";
  return (
      <div className="dlg__overlay" onClick={(e) => e.target.classList.contains("dlg__overlay") && onClose?.()}>
        <div className={`dlg__card dlg__${type}`} role="dialog" aria-modal="true">
          <div className="dlg__icon">{icon}</div>
          <h3 className="dlg__title">{title}</h3>
          <p className="dlg__msg">{message}</p>
          <div className="dlg__actions">
            <button className="btn btn--primary" onClick={onPrimary || onClose}>{primaryText}</button>
          </div>
        </div>
      </div>
  );
}

export default function RegisterExpenseModal({ onRegister }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [dlgSuccess, setDlgSuccess] = useState(false);
  const [dlgError, setDlgError] = useState({ open: false, msg: "" });
  const [dlgWarn, setDlgWarn] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleOverlayClick = (e) => e.target.classList.contains("modal__overlay") && setIsOpen(false);
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name);
      setFilePath("src/data/comprobantes/" + f.name);
    } else {
      setFileName("");
      setFilePath("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!filePath) { setDlgWarn(true); return; }
    if (!nombre.trim() || !monto) { setDlgError({ open: true, msg: "Nombre y monto son obligatorios." }); return; }

    setIsLoading(true);
    try {
      const expenseData = {
        titulo: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        valor: parseFloat(monto),
        fecha: new Date().toISOString().slice(0, 10),
        grupo_id: 1, // TODO: obtener del grupo actual
        comprobante: filePath
      };

      const res = await authenticatedFetch("/expenses/", {
        method: "POST",
        body: JSON.stringify(expenseData)
      });

      if (!res.ok) {
        let msg = "Error al crear el gasto.";
        try { msg = (await res.json())?.detail || msg; } catch {}
        throw new Error(msg);
      }

      const created = await res.json();
      onRegister?.(created);
      setDlgSuccess(true);
      setIsOpen(false);
      setNombre(""); setMonto(""); setDescripcion(""); setFileName(""); setFilePath("");
    } catch (err) {
      setDlgError({ open: true, msg: err?.message || "Error inesperado." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <>
        <button className="btn btn--primary" onClick={() => setIsOpen(true)}>Registrar gasto</button>

        {isOpen && (
            <div className="modal__overlay" onClick={handleOverlayClick}>
              <div className="modal__card" role="dialog" aria-modal="true">
                <div className="modal__header">
                  <h2>Registrar gasto</h2>
                  <button className="iconbtn" onClick={() => setIsOpen(false)}>✕</button>
                </div>

                <div className="required-note">Los campos marcados con <b>*</b> son obligatorios.</div>

                <form className="modal__form" onSubmit={handleSubmit}>
                  <div className="field">
                    <label>Nombre *</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej.: Fumigación"
                        disabled={isLoading}
                        required
                    />
                  </div>

                  <div className="field">
                    <label>Monto *</label>
                    <input
                        className="no-spinners"
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        onWheel={(e) => e.currentTarget.blur()}
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        placeholder="0.00"
                        disabled={isLoading}
                        required
                    />
                  </div>

                  <div className="field">
                    <label>Descripción</label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Detalle del gasto"
                        disabled={isLoading}
                        rows={3}
                    />
                  </div>

                  <div className="field">
                    <label>Comprobante *</label>
                    <div className="upload__row">
                      <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                          disabled={isLoading}
                      />
                      <button type="button" className="btn btn--ghost" onClick={handleUploadClick} disabled={isLoading}>
                        Subir comprobante
                      </button>
                      <span className={`upload__filename ${fileName ? "ok" : "req"}`}>
                    {fileName || "Ningún archivo seleccionado"}
                  </span>
                    </div>
                  </div>

                  <div className="modal__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={isLoading || !nombre || !monto}>
                      {isLoading ? "Registrando..." : "Finalizar registro"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        <Dialog
            open={dlgSuccess}
            type="success"
            title="Gasto registrado"
            message="El gasto se guardó correctamente."
            onClose={() => setDlgSuccess(false)}
        />
        <Dialog
            open={dlgError.open}
            type="error"
            title="No se pudo registrar"
            message={dlgError.msg}
            onClose={() => setDlgError({ open: false, msg: "" })}
        />
        <Dialog
            open={dlgWarn}
            type="warn"
            title="Comprobante requerido"
            message="Debés adjuntar un comprobante antes de finalizar."
            onClose={() => setDlgWarn(false)}
        />
      </>
  );
}
