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
  const padding = 150;
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
      style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f8fafc', cursor: isDragging ? 'grabbing' : 'grab' }}
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
        {/* Definitions for Grid and Filters */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.05" />
          </filter>
        </defs>

        {/* Scalable/Pannable Group */}
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          
          {/* Blueprint Grid Background */}
          <rect x={minX - padding*2} y={minY - padding*2} width={width + padding*4} height={height + padding*4} fill="url(#grid)" />

          {/* Compass Icon */}
          <g transform={`translate(${maxX + padding - 40}, ${maxY + padding - 40})`}>
            <circle cx="0" cy="0" r="18" fill="white" stroke="#cbd5e1" strokeWidth="2" filter="url(#shadow)"/>
            <path d="M0 -10 L5 0 L0 10 L-5 0 Z" fill="#64748b"/>
            <path d="M0 -10 L0 10 L-5 0 Z" fill="#94a3b8"/>
            <text x="0" y="-16" fontSize="12" fontWeight="600" fill="#64748b" textAnchor="middle">N</text>
          </g>

          {/* Edges */}
          {edges.map(edge => {
            const fromNode = nodeMap[edge.from];
            const toNode = nodeMap[edge.to];
            if (!fromNode || !toNode) return null;

            const isBlocked = blockedEdges.includes(edge.id);
            const inRoute = isEdgeInRoute(edge.from, edge.to);
            
            let edgeColor = "#cbd5e1";
            let edgeWidth = 6;
            let strokeDasharray = "none";
            
            if (isBlocked) {
              edgeColor = "#fecaca";
              strokeDasharray = "8, 8";
            }
            if (inRoute) {
              edgeColor = "var(--accent-green)";
              edgeWidth = 8;
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
                <line 
                  x1={fromNode.x} 
                  y1={fromNode.y} 
                  x2={toNode.x} 
                  y2={toNode.y} 
                  stroke={edgeColor}
                  strokeWidth={edgeWidth}
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  style={{ transition: 'all 0.3s ease' }}
                />
                
                {/* Invisible thicker line for easier clicking */}
                <line 
                  x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} 
                  stroke="transparent" strokeWidth="24"
                />
                
                {/* Cost Pill */}
                <rect 
                  x={midX - 14} 
                  y={midY - 14} 
                  width="28" 
                  height="28" 
                  rx="14"
                  fill="white"
                  stroke={edgeColor}
                  strokeWidth="2"
                  filter="url(#shadow)"
                />
                <text 
                  x={midX} 
                  y={midY} 
                  fill={inRoute ? "var(--accent-green-dark)" : "#64748b"} 
                  fontSize="12" 
                  fontWeight="700" 
                  textAnchor="middle" 
                  dominantBaseline="central"
                >
                  {edge.cost}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const isBlocked = blockedNodes.includes(node.id);
            const isClosed = closedExits.includes(node.id);
            const isSelected = selectedStart === node.id;
            const inRoute = routePath && routePath.includes(node.id);

            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!dragMoved) onNodeClick(node); 
                }}
                style={{ cursor: 'pointer' }}
                // Removed 'className="svg-node-group"' to prevent CSS transform scale overriding the SVG translate
              >
                {/* Inner wrapper for scale effect if needed, but keeping it simple to avoid jumpiness */}
                <g>
                  {/* Selection / Route Pulse Ring */}
                  {isSelected && <circle r="28" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="4 4" className="pulse-ring" />}
                  {inRoute && !isSelected && <circle r="28" fill="none" stroke="var(--accent-green-light)" strokeWidth="4" />}

                  {/* Shapes */}
                  {node.type === 'room' && (
                    <circle r="20" fill="var(--node-room-bg)" stroke="var(--node-room-stroke)" strokeWidth="3" filter="url(#shadow)" />
                  )}

                  {node.type === 'junction' && (
                    <polygon points="0,-22 22,0 0,22 -22,0" fill="var(--node-junc-bg)" stroke="var(--node-junc-stroke)" strokeWidth="3" filter="url(#shadow)" />
                  )}

                  {node.type === 'exit' && (
                    <rect x="-18" y="-18" width="36" height="36" rx="8" fill={isClosed ? "var(--node-closed-bg)" : "var(--node-exit-bg)"} filter="url(#shadow)" />
                  )}

                  {/* Node Icons inside Shapes */}
                  {node.type === 'exit' && !isClosed && (
                    <path d="M-6,-4 L0,-10 L6,-4 M0,-10 L0,6 M-8,10 L8,10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  )}
                  
                  {node.type === 'exit' && isClosed && (
                    <path d="M-5,-2 V-5 A5,5 0 0,1 5,-5 V-2 M-7,-2 H7 V8 H-7 Z" fill="white" />
                  )}

                  {node.type !== 'exit' && (
                    <circle r="6" fill={node.type === 'room' ? 'var(--node-room-stroke)' : 'var(--node-junc-stroke)'} opacity="0.2" />
                  )}

                  {/* Text Labels (Moved BELOW the node to prevent clipping) */}
                  <g transform="translate(0, 34)">
                    {/* White stroke for legibility over lines */}
                    <text 
                      y="0" 
                      fontSize="13" 
                      fontWeight="700" 
                      textAnchor="middle" 
                      stroke="white" 
                      strokeWidth="4" 
                      strokeLinejoin="round" 
                      paintOrder="stroke"
                      fill={node.type === 'room' ? 'var(--node-room-stroke)' : (node.type === 'exit' ? 'var(--accent-green-dark)' : '#d97706')}
                    >
                      {node.id}
                    </text>
                    <text 
                      y="14" 
                      fontSize="10" 
                      fontWeight="500" 
                      textAnchor="middle" 
                      fill="#64748b"
                    >
                      ({node.type.charAt(0).toUpperCase() + node.type.slice(1)})
                    </text>
                  </g>

                  {/* Blocked Red Badge */}
                  {isBlocked && (
                    <g transform="translate(16, -16)">
                      <circle r="10" fill="var(--danger)" stroke="white" strokeWidth="2" />
                      <text x="0" y="1" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle" dominantBaseline="central">×</text>
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
