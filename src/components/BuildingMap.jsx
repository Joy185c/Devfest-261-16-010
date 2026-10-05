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
        <defs>
          <filter id="premiumShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          
          {/* Edges Layer */}
          {edges.map(edge => {
            const fromNode = nodeMap[edge.from];
            const toNode = nodeMap[edge.to];
            if (!fromNode || !toNode) return null;

            const isBlocked = blockedEdges.includes(edge.id);
            const inRoute = isEdgeInRoute(edge.from, edge.to);
            
            let edgeColor = "#cbd5e1";
            let edgeWidth = 6;
            
            if (isBlocked) {
              edgeColor = "#fecaca"; // Light red
            } else if (inRoute) {
              edgeColor = "#2563eb"; // Deep solid blue
              edgeWidth = 10;
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
                  style={{ transition: 'all 0.3s ease' }}
                />
                
                {/* Invisible thicker line for easier clicking */}
                <line x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="transparent" strokeWidth="30" />
                
                {/* Minimalist Cost Pill */}
                {!inRoute && !isBlocked && (
                  <>
                    <rect 
                      x={midX - 12} 
                      y={midY - 12} 
                      width="24" 
                      height="24" 
                      rx="12"
                      fill="#f8fafc"
                      stroke="#e2e8f0"
                      strokeWidth="2"
                    />
                    <text 
                      x={midX} 
                      y={midY} 
                      fill="#64748b" 
                      fontSize="11" 
                      fontWeight="700" 
                      textAnchor="middle" 
                      dominantBaseline="central"
                    >
                      {edge.cost}
                    </text>
                  </>
                )}
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

            // Minimalist Premium Coloring Logic
            let fillColor = "white";
            let strokeColor = "#94a3b8";
            let textColor = "#1e293b";
            let strokeWidth = 3;
            let radius = 28;

            // Default Types
            if (isExit) {
              fillColor = "#10b981"; // Emerald green
              strokeColor = "#10b981";
              textColor = "white";
            } else if (node.type === 'junction') {
              fillColor = "#f8fafc";
              strokeColor = "#cbd5e1";
              strokeWidth = 2;
            }

            // Status Overrides (High Priority)
            if (isClosed) {
              fillColor = "#64748b"; // Slate
              strokeColor = "#64748b";
              textColor = "white";
            }
            if (isBlocked) {
              fillColor = "#ef4444"; // Red
              strokeColor = "#ef4444";
              textColor = "white";
            } else if (inRoute || isSelected) {
              fillColor = "#2563eb"; // Deep Blue
              strokeColor = "#2563eb";
              textColor = "white";
            }

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
                <g filter="url(#premiumShadow)" style={{ transition: 'all 0.3s ease' }}>
                  
                  {/* Pulse Ring for Selected Start */}
                  {isSelected && (
                    <circle r={radius + 8} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 4">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite"/>
                    </circle>
                  )}

                  {/* Main Node Circle */}
                  <circle 
                    r={radius} 
                    fill={fillColor} 
                    stroke={strokeColor} 
                    strokeWidth={strokeWidth} 
                    style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
                  />

                  {/* Node ID Text (Inside) */}
                  <text 
                    y="2" 
                    fontSize="13" 
                    fontWeight="700" 
                    textAnchor="middle" 
                    fill={textColor}
                    dominantBaseline="central"
                    style={{ letterSpacing: '0.5px' }}
                  >
                    {node.id}
                  </text>
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
