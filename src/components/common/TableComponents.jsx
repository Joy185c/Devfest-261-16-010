import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, AlertTriangle, Clock, Info, Copy, X } from 'lucide-react';
import { isBlocking } from '../../utils/tenderUtils';
import { formatBytes } from '../../utils/tenderUtils';

export function StatusBadge({ status, t }) {
  const config = {
    ok: { icon: <CheckCircle2 size={13} />, label: t.statusOK, cls: 'status-ok' },
    missing: { icon: <AlertCircle size={13} />, label: t.statusMissing, cls: 'status-missing' },
    expiryNeeded: { icon: <Clock size={13} />, label: t.statusExpiryNeeded, cls: 'status-expiry' },
    expired: { icon: <AlertTriangle size={13} />, label: t.statusExpired, cls: 'status-expired' },
    optional: { icon: <Info size={13} />, label: t.statusOptional, cls: 'status-optional' },
    duplicate: { icon: <Copy size={13} />, label: t.statusDuplicate, cls: 'status-duplicate' },
  };
  const c = config[status] || config.missing;
  return <span className={`status-badge ${c.cls}`}>{c.icon}{c.label}</span>;
}

export function RequirementRow({ req, lang, file, status, expiryDate, onMatchClick, onChangeClick, onRemoveMatch, onExpiryChange, t }) {
  return (
    <tr className={`req-row ${isBlocking(status) ? 'row-blocking' : ''}`}>
      <td className="cell-order">{req.order}</td>
      <td className="cell-docname">
        <div className="docname-main">{lang === 'bn' ? req.title_bn : req.title_en}</div>
        <div className="docname-sub">{lang === 'bn' ? req.title_en : req.title_bn}</div>
        <div className="docname-id">{req.id}</div>
      </td>
      <td>
        <span className={`type-badge ${req.mandatory ? 'mandatory' : 'optional'}`}>
          {req.mandatory ? t.mandatory : t.optional}
        </span>
      </td>
      <td className="cell-center">
        {req.has_expiry ? (
          <span className="expiry-yes">📅 {t.yes}</span>
        ) : (
          <span className="expiry-no">✗ {t.no}</span>
        )}
      </td>
      <td className="cell-matched">
        {file ? (
          <div className="matched-file">
            <FileText size={13} className="file-icon" />
            <div>
              <div className="matched-name">{file.name}</div>
              <div className="matched-sub">{file.pageCount} pages</div>
            </div>
          </div>
        ) : (
          <span className="not-matched">{t.notMatched}</span>
        )}
      </td>
      <td className="cell-center cell-pages">
        {file ? file.pageCount : '—'}
      </td>
      <td className="cell-expiry">
        {req.has_expiry && file ? (
          <input
            type="date"
            className={`date-input ${status === 'expired' ? 'date-expired' : status === 'ok' ? 'date-ok' : ''}`}
            value={expiryDate}
            onChange={e => onExpiryChange(e.target.value)}
          />
        ) : (
          <span className="dash">—</span>
        )}
      </td>
      <td><StatusBadge status={status} t={t} /></td>
      <td className="cell-action">
        {file ? (
          <div className="action-btns">
            <button className="btn-action-sm change" onClick={onChangeClick}>{t.change}</button>
            <button className="btn-action-sm remove" onClick={onRemoveMatch}><X size={12} /></button>
          </div>
        ) : (
          <button className="btn-match-file" onClick={onMatchClick}>{t.matchFile}</button>
        )}
      </td>
    </tr>
  );
}

export function MatchModal({ req, lang, availableFiles, currentFileId, onConfirm, onClose, t }) {
  const [selected, setSelected] = useState(currentFileId || null);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t.selectFileToMatch}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-req-name">
          <strong>{req.id}</strong> — {lang === 'bn' ? req.title_bn : req.title_en}
        </div>
        <div className="modal-files">
          {availableFiles.length === 0 ? (
            <p className="modal-empty">{t.noAvailableFiles}</p>
          ) : (
            availableFiles.map(f => (
              <div
                key={f.id}
                className={`modal-file-row ${selected === f.id ? 'selected' : ''}`}
                onClick={() => setSelected(f.id)}
              >
                <FileText size={16} />
                <div className="modal-file-info">
                  <div>{f.name}</div>
                  <div className="modal-file-meta">{formatBytes(f.size)} • {f.pageCount} pages</div>
                </div>
                {selected === f.id && <CheckCircle2 size={16} className="modal-check" />}
              </div>
            ))
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" disabled={!selected} onClick={() => selected && onConfirm(selected)}>
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
