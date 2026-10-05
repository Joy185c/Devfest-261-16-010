import React, { useState, useRef, useEffect } from 'react';

const BuildingMap = ({ 
  buildingData, 
  hazards, 
  selectedStart, 
  onNodeClick,
  onEdgeClick,
  routePath
}) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  if (!buildingData) return null;

  const { nodes, edges } = buildingData;
  const { blockedNodes, blockedEdges, closedExits } = hazards;
  
  const nodeMap = {};
  nodes.forEach(n => nodeMap[n.id] = n);

  const isEdgeInRoute = (from, to) => {
    if (!routePath) return false;
    for (let i = 0; i < routePath.length - 1; i++) {
      if ((routePath[i] === from && routePath[i+1] === to) || 
          (routePath[i] === to && routePath[i+1] === from)) {
        return true;
      }
    }
    return false;
  };

  // Calculate boundaries
  const padding = 200;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  });
  
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;

  // Pan and Zoom Handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(0.3, prev.scale + delta), 3)
    }));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragMoved(false);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setDragMoved(true);
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const svgElement = svgRef.current;
    if (svgElement) {
      svgElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => svgElement.removeEventListener('wheel', handleWheel);
    }
  }, []);

  return (
    <div 
      style={{ width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg-main)', cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={viewBox} 
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Blueprint Grid Patterns */}
          <pattern id="smallGrid" width="15" height="15" patternUnits="userSpaceOnUse">
            <path d="M 15 0 L 0 0 0 15" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />
          </pattern>
          <pattern id="grid" width="75" height="75" patternUnits="userSpaceOnUse">
            <rect width="75" height="75" fill="url(#smallGrid)" />
            <path d="M 75 0 L 0 0 0 75" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.8" />
          </pattern>

          {/* Premium Drop Shadows & Glows */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.08" />
          </filter>
          <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* 3D Gradients for Nodes */}
          <linearGradient id="gradRoom" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--node-room-bg)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--blue-light)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="gradJunc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--node-junc-bg)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--warning-light)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="gradExit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent-green-dark)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="gradClosed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--node-closed-bg)" stopOpacity="1" />
            <stop offset="100%" stopColor="#334155" stopOpacity="1" />
          </linearGradient>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          
          {/* Blueprint Grid Background */}
          <rect x={minX - padding*2} y={minY - padding*2} width={width + padding*4} height={height + padding*4} fill="url(#grid)" />

          {/* Compass Icon - Modern Design */}
          <g transform={`translate(${maxX + padding - 60}, ${minY - padding + 60})`}>
            <circle cx="0" cy="0" r="24" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="2" filter="url(#softShadow)"/>
            <path d="M0 -14 L6 0 L0 14 L-6 0 Z" fill="var(--text-muted)"/>
            <path d="M0 -14 L0 14 L-6 0 Z" fill="var(--text-light)"/>
            <text x="0" y="-20" fontSize="12" fontWeight="700" fill="var(--text-muted)" textAnchor="middle">N</text>
          </g>

          {/* Edges Layer */}
          {edges.map(edge => {
            const fromNode = nodeMap[edge.from];
            const toNode = nodeMap[edge.to];
            if (!fromNode || !toNode) return null;

            const isBlocked = blockedEdges.includes(edge.id);
            const inRoute = isEdgeInRoute(edge.from, edge.to);
            
            let edgeColor = "var(--border)";
            let edgeWidth = 8;
            let strokeDasharray = "none";
            
            if (isBlocked) {
              edgeColor = "var(--danger-light)";
              strokeDasharray = "12, 12";
            }

            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            return (
              <g 
                key={edge.id} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!dragMoved && onEdgeClick) onEdgeClick(edge); 
                }} 
                style={{cursor: 'pointer'}}
              >
                {/* Base Line */}
                <line 
                  x1={fromNode.x} 
                  y1={fromNode.y} 
                  x2={toNode.x} 
                  y2={toNode.y} 
                  stroke={inRoute ? "var(--accent-green-light)" : edgeColor}
                  strokeWidth={inRoute ? 14 : edgeWidth}
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  style={{ transition: 'all 0.4s ease' }}
                  filter={inRoute ? "url(#routeGlow)" : "none"}
                />
                
                {/* Animated Flow Line for Routes */}
                {inRoute && (
                  <line 
                    x1={fromNode.x} 
                    y1={fromNode.y} 
                    x2={toNode.x} 
                    y2={toNode.y} 
                    stroke="var(--accent-green)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="16 16"
                  >
                    <animate attributeName="stroke-dashoffset" from="32" to="0" dur="1s" repeatCount="indefinite" />
                  </line>
                )}
                
                {/* Invisible thicker line for easier clicking */}
                <line x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="transparent" strokeWidth="30" />
                
                {/* Glassmorphism Cost Pill */}
                <rect 
                  x={midX - 16} 
                  y={midY - 16} 
                  width="32" 
                  height="32" 
                  rx="16"
                  fill="var(--bg-card)"
                  fillOpacity="0.9"
                  stroke={inRoute ? "var(--accent-green)" : (isBlocked ? "var(--danger)" : "var(--border)")}
                  strokeWidth="2"
                  filter="url(#softShadow)"
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text 
                  x={midX} 
                  y={midY} 
                  fill={inRoute ? "var(--accent-green-dark)" : (isBlocked ? "var(--danger)" : "var(--text-muted)")} 
                  fontSize="13" 
                  fontWeight="800" 
                  textAnchor="middle" 
                  dominantBaseline="central"
                >
                  {edge.cost}
                </text>
              </g>
            );
          })}

          {/* Nodes Layer */}
          {nodes.map(node => {
            const isBlocked = blockedNodes.includes(node.id);
            const isClosed = closedExits.includes(node.id);
            const isSelected = selectedStart === node.id;
            const inRoute = routePath && routePath.includes(node.id);
            const isExit = node.type === 'exit';

            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!dragMoved) onNodeClick(node); 
                }}
                style={{ cursor: 'pointer' }}
              >
                <g>
                  {/* Outer Glowing Rings */}
                  {isSelected && <circle r="34" fill="none" stroke="var(--blue)" strokeWidth="3" strokeDasharray="6 6" className="pulse-ring">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>
                  </circle>}
                  
                  {inRoute && !isSelected && <circle r="34" fill="var(--accent-green-light)" opacity="0.3" filter="url(#routeGlow)" />}

                  {/* Shapes with Gradients */}
                  {node.type === 'room' && (
                    <>
                      <circle r="22" fill="url(#gradRoom)" stroke="var(--node-room-stroke)" strokeWidth="3" filter="url(#softShadow)" />
                      <circle r="12" fill="var(--bg-card)" opacity="0.5" />
                    </>
                  )}

                  {node.type === 'junction' && (
                    <>
                      <polygon points="0,-24 24,0 0,24 -24,0" fill="url(#gradJunc)" stroke="var(--node-junc-stroke)" strokeWidth="3" filter="url(#softShadow)" />
                      <circle r="8" fill="var(--bg-card)" opacity="0.5" />
                    </>
                  )}

                  {isExit && (
                    <rect x="-20" y="-20" width="40" height="40" rx="10" fill={isClosed ? "url(#gradClosed)" : "url(#gradExit)"} filter="url(#softShadow)" stroke={isClosed ? "#334155" : "var(--accent-green-dark)"} strokeWidth="2"/>
                  )}

                  {/* Node Icons inside Shapes */}
                  {isExit && !isClosed && (
                    <path d="M-7,-5 L0,-12 L7,-5 M0,-12 L0,7 M-10,12 L10,12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  )}
                  {isExit && isClosed && (
                    <path d="M-6,-3 V-6 A6,6 0 0,1 6,-6 V-3 M-8,-3 H8 V9 H-8 Z" fill="white" />
                  )}

                  {/* Text Labels (Premium Typography) */}
                  <g transform="translate(0, 38)">
                    {/* Outline for maximum readability */}
                    <text 
                      y="0" 
                      fontSize="14" 
                      fontWeight="800" 
                      textAnchor="middle" 
                      stroke="var(--bg-main)" 
                      strokeWidth="5" 
                      strokeLinejoin="round" 
                      paintOrder="stroke"
                      fill={node.type === 'room' ? 'var(--blue)' : (isExit ? 'var(--accent-green-dark)' : 'var(--warning)')}
                      style={{ letterSpacing: '0.5px' }}
                    >
                      {node.id}
                    </text>
                    <text 
                      y="16" 
                      fontSize="11" 
                      fontWeight="600" 
                      textAnchor="middle" 
                      fill="var(--text-muted)"
                      letterSpacing="1px"
                    >
                      {node.type.toUpperCase()}
                    </text>
                  </g>

                  {/* Blocked Danger Badge */}
                  {isBlocked && (
                    <g transform="translate(18, -18)">
                      <circle r="12" fill="var(--danger)" stroke="var(--bg-card)" strokeWidth="3" filter="url(#softShadow)" />
                      <text x="0" y="1" fill="white" fontSize="14" fontWeight="900" textAnchor="middle" dominantBaseline="central">×</text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default BuildingMap;
