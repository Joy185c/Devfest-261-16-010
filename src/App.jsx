import React, { useState, useEffect, useRef } from 'react';
import { translations } from './data/translations';
import { validateBuildingData } from './utils/validator';
import { calculateShortestPath } from './utils/dijkstra';
import BuildingMap from './components/BuildingMap';
import { Upload, AlertTriangle, RotateCcw, ArrowRight } from 'lucide-react';

function App() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];

  const [buildingData, setBuildingData] = useState(null);
  const [initialHazards, setInitialHazards] = useState(null);
  const [hazards, setHazards] = useState({ blockedNodes: [], blockedEdges: [], closedExits: [] });
  const [selectedStart, setSelectedStart] = useState(null);
  const [routeData, setRouteData] = useState({ path: null, cost: null, error: null });
  const [importError, setImportError] = useState(null);

  const fileInputRef = useRef(null);

  // Recalculate route whenever hazards or start node changes
  useEffect(() => {
    if (buildingData && selectedStart) {
      const result = calculateShortestPath(buildingData, selectedStart, hazards);
      setRouteData(result);
    } else {
      setRouteData({ path: null, cost: null, error: null });
    }
  }, [selectedStart, hazards, buildingData]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        validateBuildingData(json);
        
        setBuildingData(json);
        const initHazards = {
          blockedNodes: [...json.initial_state.blocked_nodes],
          blockedEdges: [...json.initial_state.blocked_edges],
          closedExits: [...json.initial_state.closed_exits]
        };
        setInitialHazards(initHazards);
        setHazards(JSON.parse(JSON.stringify(initHazards))); // deep copy
        setSelectedStart(null);
        setRouteData({ path: null, cost: null, error: null });
        setImportError(null);
      } catch (err) {
        setImportError(t.invalidFile);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleNodeClick = (node) => {
    if (node.type === 'exit') return; // Cannot start at exit
    setSelectedStart(node.id);
  };

  const handleReset = () => {
    if (initialHazards) {
      setHazards(JSON.parse(JSON.stringify(initialHazards)));
    }
  };

  const toggleNodeBlock = (nodeId) => {
    setHazards(prev => {
      const isBlocked = prev.blockedNodes.includes(nodeId);
      return {
        ...prev,
        blockedNodes: isBlocked 
          ? prev.blockedNodes.filter(id => id !== nodeId)
          : [...prev.blockedNodes, nodeId]
      };
    });
  };

  const toggleEdgeBlock = (edgeId) => {
    setHazards(prev => {
      const isBlocked = prev.blockedEdges.includes(edgeId);
      return {
        ...prev,
        blockedEdges: isBlocked 
          ? prev.blockedEdges.filter(id => id !== edgeId)
          : [...prev.blockedEdges, edgeId]
      };
    });
  };

  const toggleExitClose = (exitId) => {
    setHazards(prev => {
      const isClosed = prev.closedExits.includes(exitId);
      return {
        ...prev,
        closedExits: isClosed 
          ? prev.closedExits.filter(id => id !== exitId)
          : [...prev.closedExits, exitId]
      };
    });
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>{t.appTitle}</h1>
        <div className="lang-toggle">
          <button className={`lang-btn ${lang === 'bn' ? 'active' : ''}`} onClick={() => setLang('bn')}>বাংলা</button>
          <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>English</button>
        </div>
      </header>

      <main className="main-content">
        <section className="map-container">
          {!buildingData ? (
            <div style={{ color: 'var(--text-muted)' }}>
              {t.importFile}
            </div>
          ) : (
            <BuildingMap 
              buildingData={buildingData} 
              hazards={hazards} 
              selectedStart={selectedStart}
              onNodeClick={handleNodeClick}
              routePath={routeData.path}
            />
          )}
        </section>

        <aside className="sidebar">
          {/* Import Panel */}
          <div className="panel">
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
            <button className="import-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={20} />
              {t.importFile}
            </button>
            {importError && (
              <div className="import-error">
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }}/>
                {importError}
              </div>
            )}
          </div>

          {buildingData && (
            <>
              {/* Route Info Panel */}
              <div className="panel">
                <h2 className="panel-title">{t.currentRoute}</h2>
                
                {routeData.error === 'blockedStart' && (
                  <div className="alert-message alert-error">
                    <AlertTriangle size={18} />
                    {t.blockedStart}
                  </div>
                )}
                
                {routeData.error === 'noRoute' && (
                  <div className="alert-message alert-error">
                    <AlertTriangle size={18} />
                    {t.noRoute}
                  </div>
                )}

                {!selectedStart && !routeData.error && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {t.selectStart}
                  </div>
                )}

                {routeData.path && (
                  <div className="route-info">
                    <div className="route-stat">
                      <span>{t.start}</span>
                      <span>{routeData.path[0]}</span>
                    </div>
                    <div className="route-stat">
                      <span>{t.exit}</span>
                      <span>{routeData.path[routeData.path.length - 1]}</span>
                    </div>
                    <div className="route-stat">
                      <span>{t.totalCost}</span>
                      <span style={{ color: 'var(--success)' }}>{routeData.cost}</span>
                    </div>
                    
                    <div className="route-path">
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t.path}</span>
                      <div className="path-nodes">
                        {routeData.path.map((node, i) => (
                          <React.Fragment key={i}>
                            <span className="path-node">{node}</span>
                            {i < routeData.path.length - 1 && <ArrowRight size={14} className="path-arrow" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hazard Controls Panel */}
              <div className="panel" style={{ flex: 1 }}>
                <h2 className="panel-title">{t.hazards}</h2>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t.blockedNodes}</h3>
                  <div className="hazard-list">
                    {buildingData.nodes.filter(n => n.type !== 'exit').map(node => {
                      const isBlocked = hazards.blockedNodes.includes(node.id);
                      return (
                        <div key={node.id} className="hazard-item">
                          <span>{node.id} <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>({node.type === 'room' ? t.room : t.junction})</span></span>
                          <button 
                            className={`hazard-btn ${isBlocked ? 'btn-unblock' : 'btn-block'}`}
                            onClick={() => toggleNodeBlock(node.id)}
                          >
                            {isBlocked ? t.unblock : t.block}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t.blockedCorridors}</h3>
                  <div className="hazard-list">
                    {buildingData.edges.map(edge => {
                      const isBlocked = hazards.blockedEdges.includes(edge.id);
                      return (
                        <div key={edge.id} className="hazard-item">
                          <span>{edge.from} ↔ {edge.to}</span>
                          <button 
                            className={`hazard-btn ${isBlocked ? 'btn-unblock' : 'btn-block'}`}
                            onClick={() => toggleEdgeBlock(edge.id)}
                          >
                            {isBlocked ? t.unblock : t.block}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t.closedExits}</h3>
                  <div className="hazard-list">
                    {buildingData.nodes.filter(n => n.type === 'exit').map(exit => {
                      const isClosed = hazards.closedExits.includes(exit.id);
                      return (
                        <div key={exit.id} className="hazard-item">
                          <span>{exit.id}</span>
                          <button 
                            className={`hazard-btn ${isClosed ? 'btn-reopen' : 'btn-close'}`}
                            onClick={() => toggleExitClose(exit.id)}
                          >
                            {isClosed ? t.reopen : t.close}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button className="reset-btn" onClick={handleReset}>
                  <RotateCcw size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
                  {t.reset}
                </button>
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
