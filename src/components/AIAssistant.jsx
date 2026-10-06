import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, X, ChevronRight, FileText, CheckCircle } from 'lucide-react';
import { analyzePackage } from '../services/aiService';

export default function AIAssistant({ 
  t, 
  onOpenSetup, 
  aiConfig, // { provider, apiKey }
  onClearConfig,
  requirements,
  uploadedFiles,
  matches,
  statuses,
  onApplyMatch
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null); // { summary, issues, suggestions }
  const [error, setError] = useState(false);

  const handleAnalyze = async () => {
    if (!aiConfig) return;
    setAnalyzing(true);
    setError(false);
    try {
      const data = await analyzePackage({
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        requirements,
        uploadedFiles,
        matches,
        statuses
      });
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(true);
    }
    setAnalyzing(false);
  };

  const hasConfig = !!aiConfig;

  return (
    <div className="tpb-generate-panel" style={{ marginTop: 24, borderTop: '4px solid #8b5cf6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#4c1d95', fontSize: 16 }}>
          <Sparkles size={18} /> {t.aiAssistant}
        </h3>
        <span style={{ fontSize: 12, padding: '2px 8px', background: '#ede9fe', color: '#6d28d9', borderRadius: 12, fontWeight: 600 }}>
          {t.aiOptional}
        </span>
      </div>

      {!hasConfig ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <button 
            onClick={onOpenSetup}
            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px dashed #8b5cf6', background: '#faf5ff', color: '#6d28d9', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {t.enableAI}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              <CheckCircle size={14} /> {t.aiConnected}
            </span>
            <button onClick={() => { onClearConfig(); setResults(null); }} style={{ fontSize: 12, color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              {t.clearApiKey}
            </button>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{ width: '100%', padding: '10px', borderRadius: 6, border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 600, cursor: analyzing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}
          >
            {analyzing ? <Loader2 size={16} className="tpb-spin" /> : <Sparkles size={16} />}
            {analyzing ? t.analyzing : t.analyzePackage}
          </button>

          {error && (
            <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                <AlertCircle size={16} /> {t.aiFailureTitle}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#7f1d1d' }}>{t.aiFailureDesc}</p>
            </div>
          )}

          {!results && !error && !analyzing && (
            <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
              {t.noAiInsights}
            </div>
          )}

          {results && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Summary */}
              {results.summary && (
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, borderLeft: '3px solid #8b5cf6', fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                  {results.summary}
                </div>
              )}

              {/* Issues Explanation */}
              {results.issues && results.issues.length > 0 && (
                <div style={{ padding: 12, background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: '#b45309' }}>Remaining Issues</h4>
                  <ul style={{ margin: 0, paddingLeft: 20, color: '#92400e', fontSize: 13 }}>
                    {results.issues.map((iss, i) => <li key={i}>{iss}</li>)}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {results.suggestions && results.suggestions.length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 4 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: '#475569' }}>{t.aiSuggestions}</h4>
                  {results.suggestions.map((sug, i) => {
                    const req = requirements.find(r => r.id === sug.suggestedRequirementId);
                    const file = uploadedFiles.find(f => f.name === sug.filename);
                    if (!req || !file || matches[req.id] === file.id) return null; // Already matched or invalid

                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, background: '#f1f5f9', borderRadius: 6, marginBottom: 8 }}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FileText size={12} /> {file.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <ChevronRight size={12} /> {req.title_en}
                          </div>
                        </div>
                        <button 
                          onClick={() => onApplyMatch(req.id, file.id)}
                          style={{ padding: '4px 8px', fontSize: 11, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontWeight: 600, color: '#3b82f6' }}
                        >
                          {t.acceptMatch}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
