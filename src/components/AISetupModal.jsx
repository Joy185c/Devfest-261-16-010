import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { testAiConnection } from '../services/aiService';

export default function AISetupModal({ t, onClose, onConnect }) {
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('idle'); // idle, testing, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleTestConnection = async () => {
    if (!apiKey) return;
    setStatus('testing');
    try {
      await testAiConnection(provider, apiKey);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(t.connectionFailed);
    }
  };

  const handleEnable = () => {
    if (status === 'success') {
      onConnect(provider, apiKey);
    }
  };

  const handleApiKeyChange = (val) => {
    setApiKey(val);
    if (status !== 'idle') setStatus('idle');

    // Auto-detect provider
    if (val.startsWith('AIza')) {
      setProvider('gemini');
    } else if (val.startsWith('gsk_')) {
      setProvider('groq');
    } else if (val.startsWith('sk-ant-')) {
      setProvider('anthropic');
    } else if (val.startsWith('sk-')) {
      setProvider('openai');
    }
  };

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true">
      <div className="onboarding-card" style={{ maxWidth: 450, padding: 0 }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>✨</span> {t.aiSetup}
          </h2>
          <button className="onboarding-close" style={{ position: 'static' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#334155' }}>
              {t.aiProvider}
            </label>
            <select 
              value={provider} 
              onChange={e => setProvider(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="groq">Groq</option>
              <option value="anthropic">Anthropic (Claude)</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#334155' }}>
              {t.aiApiKey}
            </label>
            <input 
              type="password" 
              value={apiKey}
              onChange={e => handleApiKeyChange(e.target.value)}
              placeholder="e.g. AIzaSy... (Gemini) or gsk_... (Groq)"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box', marginBottom: 8 }}
            />
            <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span>{t.getApiKeyHelp}</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>Gemini</a>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>Groq</a>
            </div>
          </div>

          <div style={{ fontSize: 13, color: '#64748b', backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 20 }}>
            {t.aiKeyDisclaimer}
          </div>

          {status === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 14, marginBottom: 16, backgroundColor: '#ecfdf5', padding: '10px 12px', borderRadius: 6 }}>
              <CheckCircle size={18} /> {t.connectionSuccess}
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 14, marginBottom: 16, backgroundColor: '#fef2f2', padding: '10px 12px', borderRadius: 6 }}>
              <AlertCircle size={18} /> {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={handleTestConnection}
              disabled={!apiKey || status === 'testing'}
              style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontWeight: 600, cursor: (!apiKey || status === 'testing') ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {status === 'testing' && <Loader2 size={16} className="tpb-spin" />}
              {t.testConnection}
            </button>

            <button 
              onClick={handleEnable}
              disabled={status !== 'success'}
              style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: 'none', background: status === 'success' ? '#8b5cf6' : '#cbd5e1', color: 'white', fontWeight: 600, cursor: status === 'success' ? 'pointer' : 'not-allowed' }}
            >
              {t.enableAIAssistant}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
