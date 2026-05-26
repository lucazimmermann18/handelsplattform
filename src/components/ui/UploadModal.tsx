'use client';

import React, { useState, useRef } from 'react';
import { useData } from '@/lib/data-context';
import { Ic } from '@/components/ui/icons';

const DOC_TYPES = ['Vertrag', 'Zertifikat', 'Transportdokument', 'Laborbericht', 'Genehmigung', 'Sonstiges'];

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13,
  padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

interface UploadModalProps {
  onClose: () => void;
}

export const UploadModal = ({ onClose }: UploadModalProps) => {
  const { data: M, refresh } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Vertrag');
  const [orderId, setOrderId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    if (!docName) setDocName(f.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', docName || file.name);
      fd.append('type', docType);
      if (orderId) fd.append('order_id', orderId);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload-Fehler');
      setSuccess(json.docId);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
    setUploading(false);
  };

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '8vh' }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 460, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ic name="upload" size={14} color="#60a5fa" />
          <span style={{ fontWeight: 700, fontSize: 14 }}>Dokument hochladen</span>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onClose}><Ic name="x" size={13} /></button>
        </div>

        {success ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
            <div className="fw600" style={{ marginBottom: 6 }}>Hochgeladen</div>
            <div className="tx3 mono" style={{ fontSize: 12, marginBottom: 20 }}>{success}</div>
            <button className="btn primary" onClick={onClose}>Schließen</button>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Drag & Drop area */}
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${file ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 8, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                  background: file ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="file"
                  ref={fileRef}
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {file ? (
                  <div>
                    <div className="fw500">{file.name}</div>
                    <div className="tx3" style={{ fontSize: 11, marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 6 }}><Ic name="upload" size={20} color="#5d667d" /></div>
                    <div className="fw500" style={{ fontSize: 13 }}>Datei auswählen oder hierher ziehen</div>
                    <div className="tx3" style={{ fontSize: 11, marginTop: 4 }}>PDF, DOCX, XLSX, PNG, JPG</div>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Name</div>
                <input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Dokumentenname" style={inputStyle} />
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Typ</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {DOC_TYPES.map(tp => (
                    <span key={tp} className={`chip${docType === tp ? ' on' : ''}`} onClick={() => setDocType(tp)} style={{ cursor: 'pointer', fontSize: 11 }}>{tp}</span>
                  ))}
                </div>
              </div>

              {M && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Auftrag (optional)</div>
                  <select value={orderId} onChange={e => setOrderId(e.target.value)} style={inputStyle}>
                    <option value="">— kein Auftrag —</option>
                    {M.orders.slice(0, 30).map(o => <option key={o.id} value={o.id}>{o.id} · {o.productVariant}</option>)}
                  </select>
                </div>
              )}

              {error && (
                <div style={{ fontSize: 11.5, color: '#f87171', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
                  {error}
                </div>
              )}
            </div>

            <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={onClose}>Abbrechen</button>
              <button className="btn primary" onClick={handleUpload} disabled={uploading || !file}>
                {uploading ? 'Hochladen…' : <><Ic name="upload" size={13} /> Hochladen</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
