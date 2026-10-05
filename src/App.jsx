import React, { useState, useEffect, useRef } from 'react';
import { translations } from './data/translations';
import { validateBuildingData } from './utils/validator';
import { calculateShortestPath } from './utils/dijkstra';
import BuildingMap from './components/BuildingMap';
import { 
  Upload, BedDouble, ArrowRightLeft, DoorOpen, LogOut, XOctagon, MousePointer2, Ban, Unplug, Lock, X, CheckCircle2, RotateCcw, ShieldCheck, Layers
} from 'lucide-react';

function App() {
  const [lang] = useState('en');
  const t = translations[lang];

  const [buildingData, setBuildingData] = useState(null);
  const [initialHazards, setInitialHazards] = useState(null);
  const [hazards, setHazards] = useState({ blockedNodes: [], blockedEdges: [], closedExits: [] });
  const [selectedStart, setSelectedStart] = useState(null);
  const [routeData, setRouteData] = useState({ path: null, cost: null, error: null });
  const [importError, setImportError] = useState(null);
  
  const [interactionMode, setInteractionMode] = useState('select'); // select | blockNode | blockEdge | closeExit

  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light'); // Always light mode for this premium look
  }, []);

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
    setIsModalOpen(false);
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
      return { ...prev, blockedNodes: isBlocked ? prev.blockedNodes.filter(id => id !== nodeId) : [...prev.blockedNodes, nodeId] };
    });
  };

  const toggleEdgeBlock = (edgeId) => {
    setHazards(prev => {
      const isBlocked = prev.blockedEdges.includes(edgeId);
      return { ...prev, blockedEdges: isBlocked ? prev.blockedEdges.filter(id => id !== edgeId) : [...prev.blockedEdges, edgeId] };
    });
  };

  const toggleExitClose = (exitId) => {
    setHazards(prev => {
      const isClosed = prev.closedExits.includes(exitId);
      return { ...prev, closedExits: isClosed ? prev.closedExits.filter(id => id !== exitId) : [...prev.closedExits, exitId] };
    });
  };

  const totalRooms = buildingData ? buildingData.nodes.filter(n => n.type === 'room').length : 0;
  const totalExits = buildingData ? buildingData.nodes.filter(n => n.type === 'exit').length : 0;
  const totalCorridors = buildingData ? buildingData.edges.length : 0;
  const totalStairs = buildingData ? buildingData.nodes.filter(n => n.id.toLowerCase().includes('stair')).length : 0;

  return (
    <div style={{ padding: '24px', background: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header Card */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <LogOut size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Building Floor Map</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>Navigate through rooms and corridors</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Interaction Mode Toggles */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
            <button onClick={() => setInteractionMode('select')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: interactionMode === 'select' ? 'white' : 'transparent', color: interactionMode === 'select' ? '#0f172a' : '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: interactionMode === 'select' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}><MousePointer2 size={14} style={{verticalAlign:'text-bottom', marginRight:'4px'}}/> Select Start</button>
            <button onClick={() => setInteractionMode('blockNode')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: interactionMode === 'blockNode' ? 'white' : 'transparent', color: interactionMode === 'blockNode' ? '#ef4444' : '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: interactionMode === 'blockNode' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}><Ban size={14} style={{verticalAlign:'text-bottom', marginRight:'4px'}}/> Block Node</button>
            <button onClick={() => setInteractionMode('blockEdge')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: interactionMode === 'blockEdge' ? 'white' : 'transparent', color: interactionMode === 'blockEdge' ? '#f59e0b' : '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: interactionMode === 'blockEdge' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}><Unplug size={14} style={{verticalAlign:'text-bottom', marginRight:'4px'}}/> Block Edge</button>
          </div>

          <div style={{ height: '32px', width: '1px', background: '#e2e8f0' }}></div>
          
          <button onClick={() => setIsModalOpen(true)} style={{ background: '#ecfdf5', color: '#059669', border: 'none', padding: '10px 16px', borderRadius: '24px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} /> Import
          </button>
          
          <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
            <span>Total Rooms: <span style={{color: '#0f172a'}}>{totalRooms}</span></span>
            <div style={{ width: '1px', height: '16px', background: '#e2e8f0', alignSelf: 'center' }}></div>
            <span>Exits: <span style={{color: '#0f172a'}}>{totalExits}</span></span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Main Map Area */}
        <div style={{ flex: 1, background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', position: 'relative' }}>
          {buildingData ? (
            <BuildingMap 
              buildingData={buildingData} 
              hazards={hazards} 
              selectedStart={selectedStart}
              routePath={routeData.path}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              <Upload size={48} style={{ marginBottom: '16px', color: '#cbd5e1' }}/>
              <h2 style={{ margin: 0, color: '#64748b' }}>No Building Data Loaded</h2>
              <p style={{ marginTop: '8px' }}>Click Import in the top header to load your map JSON.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Legend Card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>Legend</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0f6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BedDouble size={16}/></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Room</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0f6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRightLeft size={16}/></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Corridor</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0f6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={16}/></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Staircase</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogOut size={16}/></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Exit (Open)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XOctagon size={16}/></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Exit / Room (Closed)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '6px', borderRadius: '3px', background: '#fca5a5' }}></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Blocked Path</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#cbd5e1' }}></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Available Path</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>#</div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Connection Cost</span>
              </div>
            </div>
          </div>

          {/* Quick Info Card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Quick Info</h3>
              <button onClick={handleReset} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}><RotateCcw size={14}/> Reset</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogOut size={18}/></div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalExits}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Exits</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0f6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BedDouble size={18}/></div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalRooms}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Rooms</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0f6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={18}/></div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalStairs}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Staircases</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRightLeft size={18}/></div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalCorridors}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Corridor Connections</div>
                </div>
              </div>
            </div>

            {/* Route Status Summary */}
            {routeData.path && (
              <div style={{ marginTop: '32px', padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Optimal Route Found</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e3a8a' }}>{routeData.cost} <span style={{fontSize:'12px', color:'#60a5fa'}}>Steps</span></div>
              </div>
            )}
            {routeData.error && (
              <div style={{ marginTop: '32px', padding: '16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Error</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>{routeData.error === 'noRoute' ? "No clear path to exit!" : "Start point is blocked!"}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Import Building Data</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20}/></button>
            </div>
            
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', padding: '16px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 600 }}
            >
              <Upload size={24} color="#94a3b8"/>
              Click to Upload JSON File
            </button>
            {importError && <div style={{ marginTop: '16px', color: '#ef4444', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>{importError}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
