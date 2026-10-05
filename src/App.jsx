import React, { useState, useEffect, useRef } from 'react';
import { translations } from './data/translations';
import { validateBuildingData } from './utils/validator';
import { calculateShortestPath } from './utils/dijkstra';
import BuildingMap from './components/BuildingMap';
import { 
  Upload, Map as MapIcon, AlertTriangle, RotateCcw, 
  CheckCircle2, Sun, Moon, Shield, ShieldCheck, ArrowRight, 
  MousePointer2, Ban, Unplug, Lock, ChevronRight, X, Code
} from 'lucide-react';

function App() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];
  const [theme, setTheme] = useState('light');

  const [buildingData, setBuildingData] = useState(null);
  const [initialHazards, setInitialHazards] = useState(null);
  const [hazards, setHazards] = useState({ blockedNodes: [], blockedEdges: [], closedExits: [] });
  const [selectedStart, setSelectedStart] = useState(null);
  const [routeData, setRouteData] = useState({ path: null, cost: null, error: null });
  const [importError, setImportError] = useState(null);
  
  const [interactionMode, setInteractionMode] = useState('select');
  const [currentView, setCurrentView] = useState('map'); // 'map' | 'hazards'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importTab, setImportTab] = useState('file'); // 'file' | 'paste'
  const [pastedJson, setPastedJson] = useState('');
  const [pasteResult, setPasteResult] = useState({ valid: false, error: null, parsed: null });

  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (buildingData && selectedStart) {
      const result = calculateShortestPath(buildingData, selectedStart, hazards);
      setRouteData(result);
    } else {
      setRouteData({ path: null, cost: null, error: null });
    }
  }, [selectedStart, hazards, buildingData]);

  const commitImportedData = (json) => {
    setBuildingData(json);
    const initHazards = {
      blockedNodes: [...json.initial_state.blocked_nodes],
      blockedEdges: [...json.initial_state.blocked_edges],
      closedExits: [...json.initial_state.closed_exits]
    };
    setInitialHazards(initHazards);
    setHazards(JSON.parse(JSON.stringify(initHazards))); 
    setSelectedStart(null);
    setRouteData({ path: null, cost: null, error: null });
    setImportError(null);
    setInteractionMode('select');
    setCurrentView('map');
    setIsModalOpen(false);
    
    // Reset paste state
    setPastedJson('');
    setPasteResult({ valid: false, error: null, parsed: null });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        validateBuildingData(json);
        commitImportedData(json);
      } catch (err) {
        setImportError(t.invalidFile || "Invalid file format or validation failed.");
        setIsModalOpen(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleValidateJson = () => {
    if (!pastedJson.trim()) {
      setPasteResult({ valid: false, error: "JSON is empty.", parsed: null });
      return;
    }
    
    try {
      const json = JSON.parse(pastedJson);
      validateBuildingData(json);
      setPasteResult({ valid: true, error: null, parsed: json });
    } catch (err) {
      let errMsg = err.message;
      setPasteResult({ valid: false, error: errMsg, parsed: null });
    }
  };

  const handleClearJson = () => {
    setPastedJson('');
    setPasteResult({ valid: false, error: null, parsed: null });
  };

  const handleImportJson = () => {
    if (pasteResult.valid && pasteResult.parsed) {
      commitImportedData(pasteResult.parsed);
    }
  };

  const handleReset = () => {
    if (initialHazards) {
      setHazards(JSON.parse(JSON.stringify(initialHazards)));
      setSelectedStart(null);
    }
  };

  const handleNodeClick = (node) => {
    if (interactionMode === 'select') {
      if (node.type === 'exit') return; 
      setSelectedStart(node.id);
    } else if (interactionMode === 'blockNode') {
      if (node.type === 'exit') return;
      toggleNodeBlock(node.id);
    } else if (interactionMode === 'closeExit') {
      if (node.type !== 'exit') return;
      toggleExitClose(node.id);
    }
  };

  const handleEdgeClick = (edge) => {
    if (interactionMode === 'blockEdge') {
      toggleEdgeBlock(edge.id);
    }
  };

  const toggleNodeBlock = (nodeId) => {
    setHazards(prev => {
      const isBlocked = prev.blockedNodes.includes(nodeId);
      return {
        ...prev,
        blockedNodes: isBlocked ? prev.blockedNodes.filter(id => id !== nodeId) : [...prev.blockedNodes, nodeId]
      };
    });
  };

  const toggleEdgeBlock = (edgeId) => {
    setHazards(prev => {
      const isBlocked = prev.blockedEdges.includes(edgeId);
      return {
        ...prev,
        blockedEdges: isBlocked ? prev.blockedEdges.filter(id => id !== edgeId) : [...prev.blockedEdges, edgeId]
      };
    });
  };

  const toggleExitClose = (exitId) => {
    setHazards(prev => {
      const isClosed = prev.closedExits.includes(exitId);
      return {
        ...prev,
        closedExits: isClosed ? prev.closedExits.filter(id => id !== exitId) : [...prev.closedExits, exitId]
      };
    });
  };

  const getStatusInfo = () => {
    if (importError) return { type: 'error', title: "Error", desc: importError };
    if (!buildingData) return { type: 'neutral', title: "Awaiting Import", desc: "Please upload a building.json file" };
    if (routeData.error === 'noRoute') return { type: 'error', title: t.noRoute, desc: t.noRouteDesc };
    if (routeData.error === 'blockedStart') return { type: 'error', title: t.startBlocked, desc: t.startBlockedDesc };
    if (routeData.path) return { type: 'success', title: t.routeFound, desc: t.routeFoundDesc };
    return { type: 'neutral', title: "Ready", desc: "Select a start point to begin" };
  };

  const status = getStatusInfo();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <ShieldCheck size={36} className="logo-icon" />
          <div className="header-titles">
            <h1>{t.appTitle}</h1>
            <p>{t.appSubtitle}</p>
          </div>
        </div>
        <div className="header-right">
          <div className="lang-toggle">
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>English</button>
            <button className={`lang-btn ${lang === 'bn' ? 'active' : ''}`} onClick={() => setLang('bn')}>বাংলা</button>
          </div>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <div className="card import-box" onClick={() => setIsModalOpen(true)}>
            <div className="import-icon"><Upload size={20} /></div>
            <div className="import-text">
              <h3>{t.importBuilding}</h3>
              <p>{t.uploadJson}</p>
            </div>
            <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-light)' }} />
          </div>

          <div className="nav-menu">
            <button className={`nav-item ${currentView === 'map' ? 'active' : ''}`} onClick={() => setCurrentView('map')}>
              <MapIcon size={18} /> {t.map}
            </button>
            <button className={`nav-item ${currentView === 'hazards' ? 'active' : ''}`} onClick={() => setCurrentView('hazards')}>
              <AlertTriangle size={18} /> {t.hazards}
            </button>
            <button className="nav-item" onClick={handleReset}>
              <RotateCcw size={18} /> {t.reset}
            </button>
          </div>

          <div className="legend-section card">
            <h4 className="legend-title">{t.nodeTypes}</h4>
            <div className="legend-list">
              <div className="legend-item">
                <svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="white" stroke="#94a3b8" strokeWidth="2"/></svg>
                {t.room}
              </div>
              <div className="legend-item">
                <svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/></svg>
                {t.junction}
              </div>
              <div className="legend-item">
                <svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#10b981"/></svg>
                {t.exit}
              </div>
            </div>

            <h4 className="legend-title" style={{marginTop: '1rem'}}>{t.states}</h4>
            <div className="legend-list">
              <div className="legend-item">
                <svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="white" stroke="#94a3b8" strokeWidth="2"/></svg>
                {t.normal}
              </div>
              <div className="legend-item">
                <svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#ef4444"/></svg>
                {t.blocked}
              </div>
              <div className="legend-item">
                <svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#64748b"/></svg>
                {t.closed}
              </div>
              <div className="legend-item">
                <svg width="24" height="24">
                  <circle cx="12" cy="12" r="8" fill="#2563eb"/>
                  <circle cx="12" cy="12" r="11" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="3"/>
                </svg>
                {t.selectedStart}
              </div>
              <div className="legend-item">
                <div style={{width: '24px', height: '6px', background: '#2563eb', borderRadius: '3px'}}></div>
                {t.routePath}
              </div>
              <div className="legend-item">
                <div style={{width: '24px', height: '6px', background: '#cbd5e1', borderRadius: '3px'}}></div>
                {t.edgeCorridor}
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            <Shield size={24} className="logo-icon" />
            <div>
              <h4>{t.appTitle}</h4>
              <p>{t.thinkPlanBeSafe}</p>
            </div>
          </div>
        </aside>

        {/* Center Area */}
        <section className="center-area">
          {buildingData && currentView === 'map' && (
            <div className="status-bar-top success">
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <CheckCircle2 size={18} /> {t.buildingLoaded}
              </div>
              <div className="status-bar-top-right">
                <span>{t.building}: {buildingData.building}</span>
                <span>{t.nodes}: {buildingData.nodes.length}</span>
                <span>{t.edges}: {buildingData.edges.length}</span>
              </div>
            </div>
          )}

          <div className="map-wrapper" style={{ padding: currentView === 'hazards' ? '2rem' : '0', overflowY: currentView === 'hazards' ? 'auto' : 'hidden' }}>
            {currentView === 'map' ? (
              buildingData ? (
                <BuildingMap 
                  buildingData={buildingData} 
                  hazards={hazards} 
                  selectedStart={selectedStart}
                  routePath={routeData.path}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                />
              ) : (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)'}}>
                  {t.uploadJson}
                </div>
              )
            ) : (
              <div className="hazards-dashboard-view">
                <h2 style={{fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <AlertTriangle color="var(--warning)" /> Full Hazard Management
                </h2>
                <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Quickly manage all blocked nodes, corridors, and locked exits across the building.</p>
                
                {buildingData ? (
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem'}}>
                    {/* Nodes Column */}
                    <div>
                      <h3 style={{marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem'}}>Rooms & Junctions</h3>
                      <div className="hazard-list-box">
                        {buildingData.nodes.filter(n => n.type !== 'exit').map(n => {
                          const isBlocked = hazards.blockedNodes.includes(n.id);
                          return (
                            <div key={n.id} className="hazard-item-row" style={{background: isBlocked ? 'var(--danger-light)' : 'var(--bg-main)'}}>
                              <span style={{color: isBlocked ? 'var(--danger)' : 'var(--text-main)', fontWeight: '600'}}>{n.id}</span>
                              <button className="btn-small" onClick={() => toggleNodeBlock(n.id)}>
                                {isBlocked ? 'Unblock' : 'Block'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {/* Corridors Column */}
                    <div>
                      <h3 style={{marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem'}}>Corridors</h3>
                      <div className="hazard-list-box">
                        {buildingData.edges.map(e => {
                          const isBlocked = hazards.blockedEdges.includes(e.id);
                          return (
                            <div key={e.id} className="hazard-item-row" style={{background: isBlocked ? 'var(--warning-light)' : 'var(--bg-main)'}}>
                              <span style={{color: isBlocked ? 'var(--warning-dark)' : 'var(--text-main)', fontWeight: '600'}}>{e.id}</span>
                              <button className="btn-small" onClick={() => toggleEdgeBlock(e.id)}>
                                {isBlocked ? 'Unblock' : 'Block'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {/* Exits Column */}
                    <div>
                      <h3 style={{marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem'}}>Exits</h3>
                      <div className="hazard-list-box">
                        {buildingData.nodes.filter(n => n.type === 'exit').map(n => {
                          const isClosed = hazards.closedExits.includes(n.id);
                          return (
                            <div key={n.id} className="hazard-item-row" style={{background: isClosed ? '#e2e8f0' : 'var(--bg-main)'}}>
                              <span style={{color: isClosed ? '#475569' : 'var(--text-main)', fontWeight: '600'}}>{n.id}</span>
                              <button className="btn-small" onClick={() => toggleExitClose(n.id)}>
                                {isClosed ? 'Reopen' : 'Close'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>{t.uploadJson}</div>
                )}
              </div>
            )}
          </div>

          <div className="action-bar-bottom">
            <div className={`action-card ${interactionMode === 'select' ? 'active' : ''}`} onClick={() => { setInteractionMode('select'); setCurrentView('map'); }}>
              <div className="action-icon" style={{color: 'var(--blue)'}}><MousePointer2 size={24}/></div>
              <div className="action-text">
                <h4>{t.selectStart}</h4>
                <p>{t.selectStartDesc}</p>
              </div>
            </div>
            <div className={`action-card ${interactionMode === 'blockNode' ? 'active' : ''}`} onClick={() => { setInteractionMode('blockNode'); setCurrentView('map'); }}>
              <div className="action-icon" style={{color: 'var(--danger)'}}><Ban size={24}/></div>
              <div className="action-text">
                <h4>{t.blockNode}</h4>
                <p>{t.blockNodeDesc}</p>
              </div>
            </div>
            <div className={`action-card ${interactionMode === 'blockEdge' ? 'active' : ''}`} onClick={() => { setInteractionMode('blockEdge'); setCurrentView('map'); }}>
              <div className="action-icon" style={{color: 'var(--warning)'}}><Unplug size={24}/></div>
              <div className="action-text">
                <h4>{t.blockCorridor}</h4>
                <p>{t.blockCorridorDesc}</p>
              </div>
            </div>
            <div className={`action-card ${interactionMode === 'closeExit' ? 'active' : ''}`} onClick={() => { setInteractionMode('closeExit'); setCurrentView('map'); }}>
              <div className="action-icon" style={{color: 'var(--text-muted)'}}><Lock size={24}/></div>
              <div className="action-text">
                <h4>{t.closeExit}</h4>
                <p>{t.closeExitDesc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <div className="card">
            <div className="panel-header">
              <MapIcon size={20} />
              {t.routeInfo}
            </div>

            <div className="route-endpoints">
              <div className="endpoint">
                <span className="endpoint-label">{t.start}</span>
                <div className="endpoint-circle start">
                  <span>{routeData.path ? routeData.path[0] : '-'}</span>
                  <span>{t.room}</span>
                </div>
              </div>
              <ArrowRight size={24} className="endpoint-arrow" />
              <div className="endpoint">
                <span className="endpoint-label">{t.exit}</span>
                <div className="endpoint-circle exit">
                  <span>{routeData.path ? routeData.path[routeData.path.length-1] : '-'}</span>
                  <span>{t.exit}</span>
                </div>
              </div>
            </div>

            <div className="path-section">
              <div className="path-title">{t.path}</div>
              <div className="path-nodes">
                {routeData.path ? routeData.path.map((nodeId, idx) => {
                  const node = buildingData.nodes.find(n => n.id === nodeId);
                  const typeClass = node.type === 'room' ? 'room' : node.type === 'junction' ? 'junc' : 'exit';
                  return (
                    <React.Fragment key={idx}>
                      <span className={`path-pill ${typeClass}`}>{nodeId}</span>
                      {idx < routeData.path.length - 1 && <ArrowRight size={14} style={{color: 'var(--text-light)'}}/>}
                    </React.Fragment>
                  );
                }) : (
                  <span style={{color: 'var(--text-light)'}}>-</span>
                )}
              </div>
            </div>

            <div className="cost-section">
              <span className="cost-title">{t.totalCost}</span>
              <span className="cost-value">{routeData.cost !== null ? routeData.cost : '-'}</span>
            </div>
          </div>

          <div className="card">
            <div className="panel-header">
              <AlertTriangle size={20} />
              {t.hazardControls}
            </div>

            <div className="hazard-group">
              <div className="hazard-title">{t.blockedNodes}</div>
              <div className="hazard-list-box">
                {hazards.blockedNodes.length === 0 ? (
                  <div className="hazard-item-row">
                    <span className="hazard-badge none">{t.none}</span>
                  </div>
                ) : hazards.blockedNodes.map(id => (
                  <div key={id} className="hazard-item-row">
                    <span className="hazard-badge blocked">{id}</span>
                    <button className="btn-small" onClick={() => toggleNodeBlock(id)}>{t.unblock}</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="hazard-group">
              <div className="hazard-title">{t.blockedCorridors}</div>
              <div className="hazard-list-box">
                {hazards.blockedEdges.length === 0 ? (
                  <div className="hazard-item-row">
                    <span className="hazard-badge none">{t.none}</span>
                  </div>
                ) : hazards.blockedEdges.map(id => (
                  <div key={id} className="hazard-item-row">
                    <span className="hazard-badge blocked" style={{background: 'var(--warning-light)', color: 'var(--warning-dark)'}}>{id}</span>
                    <button className="btn-small" onClick={() => toggleEdgeBlock(id)}>{t.unblock}</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="hazard-group">
              <div className="hazard-title">{t.closedExits}</div>
              <div className="hazard-list-box">
                {hazards.closedExits.length === 0 ? (
                  <div className="hazard-item-row">
                    <span className="hazard-badge none">{t.none}</span>
                  </div>
                ) : hazards.closedExits.map(id => (
                  <div key={id} className="hazard-item-row">
                    <span className="hazard-badge closed">{id}</span>
                    <button className="btn-small" onClick={() => toggleExitClose(id)}>{t.reopen}</button>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-reset" onClick={handleReset}>
              <RotateCcw size={18} />
              {t.reset}
            </button>
          </div>

          <div className={`status-card ${status.type}`}>
            {status.type === 'success' ? <CheckCircle2 size={24} color="var(--accent-green)" /> : 
             status.type === 'error' ? <AlertTriangle size={24} color="var(--danger)" /> :
             <CheckCircle2 size={24} color="var(--text-muted)" />}
            <div className="status-text">
              <h4>{status.title}</h4>
              <p>{status.desc}</p>
            </div>
          </div>
        </aside>
      </main>

      {/* Import Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title"><Upload size={20}/> {t.importBuildingData}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={24}/></button>
            </div>
            
            <div className="modal-tabs">
              <button 
                className={`modal-tab ${importTab === 'file' ? 'active' : ''}`}
                onClick={() => setImportTab('file')}
              >
                <Upload size={16} style={{display:'inline', marginRight:'0.5rem', verticalAlign:'text-bottom'}}/> 
                {t.uploadFile}
              </button>
              <button 
                className={`modal-tab ${importTab === 'paste' ? 'active' : ''}`}
                onClick={() => setImportTab('paste')}
              >
                <Code size={16} style={{display:'inline', marginRight:'0.5rem', verticalAlign:'text-bottom'}}/> 
                {t.pasteJson}
              </button>
            </div>

            <div className="modal-body">
              {importTab === 'file' ? (
                <div style={{textAlign: 'center', padding: '2rem 0'}}>
                  <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem'}}>Select a .json file containing the building data.</p>
                  <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                  <button className="btn-primary" style={{margin: '0 auto'}} onClick={() => fileInputRef.current?.click()}>
                    <Upload size={18} /> Select File
                  </button>
                </div>
              ) : (
                <>
                  <textarea 
                    className="json-textarea" 
                    placeholder={t.pastePlaceholder}
                    value={pastedJson}
                    onChange={(e) => {
                      setPastedJson(e.target.value);
                      setPasteResult({ valid: false, error: null, parsed: null });
                    }}
                  />
                  
                  {pasteResult.error && (
                    <div className="validation-error">
                      <strong>Validation Error:</strong><br/>
                      {pasteResult.error}
                    </div>
                  )}

                  {pasteResult.valid && pasteResult.parsed && (
                    <>
                      <div className="validation-success">
                        <CheckCircle2 size={18}/> {t.validJson}
                      </div>
                      <div className="json-preview-box">
                        {JSON.stringify(pasteResult.parsed, null, 2)}
                      </div>
                    </>
                  )}

                  <div className="modal-actions">
                    <button className="btn-secondary" onClick={handleClearJson}>{t.clear}</button>
                    {!pasteResult.valid ? (
                      <button className="btn-primary" onClick={handleValidateJson}>
                        {t.validateJson}
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={handleImportJson}>
                        <CheckCircle2 size={18}/> {t.importJson}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
