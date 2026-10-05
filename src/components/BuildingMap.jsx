import React, { useState, useRef, useEffect } from 'react';
import { BedDouble, ArrowRightLeft, DoorOpen, LogOut, XOctagon } from 'lucide-react';

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
      style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f8fafc', cursor: isDragging ? 'grabbing' : 'grab', borderRadius: '16px' }}
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
          <filter id="pillShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#94a3b8" floodOpacity="0.15" />
          </filter>
          <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
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
            
            let edgeColor = "#cbd5e1"; // Very light grey
            let edgeWidth = 4;
            
            if (isBlocked) {
              edgeColor = "#fca5a5"; // Soft red
              edgeWidth = 6;
            } else if (inRoute) {
              edgeColor = "#2563eb"; // Deep blue
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
                  style={{ transition: 'all 0.3s ease' }}
                />
                
                {/* Invisible thicker line for easier clicking */}
                <line x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="transparent" strokeWidth="30" />
                
                {/* Mini Cost Pill */}
                {!isBlocked && (
                  <>
                    <rect 
                      x={midX - 10} 
                      y={midY - 10} 
                      width="20" 
                      height="20" 
                      rx="10"
                      fill="white"
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                    />
                    <text 
                      x={midX} 
                      y={midY} 
                      fill="#64748b" 
                      fontSize="9" 
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
            const isStair = node.id.toLowerCase().includes('stair');
            const isEntrance = node.id.toLowerCase().includes('entrance');

            // Default Style (Soft Blue Pill)
            let bgColor = "#f0f6ff";
            let borderColor = "#dbeafe";
            let textColor = "#1e3a8a";
            let iconColor = "#3b82f6";
            const pillWidth = 90;
            const pillHeight = 52;

            if (isExit) {
              bgColor = "#10b981"; // Solid Emerald
              borderColor = "#059669";
              textColor = "white";
              iconColor = "white";
            }
            if (isClosed || isBlocked) {
              bgColor = "#ef4444"; // Solid Red
              borderColor = "#dc2626";
              textColor = "white";
              iconColor = "white";
            } else if (inRoute || isSelected) {
              borderColor = "#2563eb";
              bgColor = "white";
              iconColor = "#2563eb";
              textColor = "#1e3a8a";
            }

            // Select Icon based on name/type
            let IconComponent = BedDouble;
            if (isExit) IconComponent = LogOut;
            if (isEntrance) IconComponent = DoorOpen;
            if (node.type === 'junction') IconComponent = ArrowRightLeft;
            if (isBlocked || isClosed) IconComponent = XOctagon;

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
                {/* Glow for Selected/Route */}
                {isSelected && (
                  <rect 
                    x={-pillWidth/2 - 6} 
                    y={-pillHeight/2 - 6} 
                    width={pillWidth + 12} 
                    height={pillHeight + 12} 
                    rx="16" 
                    fill="none" 
                    stroke="#2563eb" 
                    strokeWidth="3" 
                    strokeDasharray="6 6"
                  />
                )}
                {(inRoute || isExit) && !isClosed && !isBlocked && (
                  <rect 
                    x={-pillWidth/2} 
                    y={-pillHeight/2} 
                    width={pillWidth} 
                    height={pillHeight} 
                    rx="12" 
                    fill={isExit ? "#10b981" : "none"} 
                    filter="url(#glowGreen)" 
                    opacity="0.4"
                  />
                )}

                {/* Main Pill Shape */}
                <rect 
                  x={-pillWidth/2} 
                  y={-pillHeight/2} 
                  width={pillWidth} 
                  height={pillHeight} 
                  rx="12" 
                  fill={bgColor}
                  stroke={borderColor}
                  strokeWidth={inRoute || isSelected ? 3 : 2}
                  filter="url(#pillShadow)"
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* HTML Content inside SVG via foreignObject for exact match of icons and text */}
                <foreignObject x={-pillWidth/2} y={-pillHeight/2} width={pillWidth} height={pillHeight}>
                  <div style={{
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <IconComponent size={16} color={iconColor} strokeWidth={2.5} />
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: textColor,
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      maxWidth: '80%',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {node.id}
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Compass - Modern UI style */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        width: '56px',
        height: '56px',
        background: 'white',
        borderRadius: '50%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontWeight: '700',
        fontSize: '10px'
      }}>
        N
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginTop: '2px'}}>
          <path d="m12 3 8 18-8-4-8 4 8-18z"/>
        </svg>
      </div>

      {/* Bottom Status Pill */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        background: '#ecfdf5',
        border: '1px solid #a7f3d0',
        padding: '8px 16px',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#065f46'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#10b981'}}></div> Green = Open Exit</div>
        <div style={{width:'1px', height:'12px', background:'#a7f3d0'}}></div>
        <div style={{display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#ef4444'}}></div> Red = Closed/Blocked</div>
      </div>
    </div>
  );
};

export default BuildingMap;
