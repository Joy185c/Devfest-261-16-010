import React from 'react';

const BuildingMap = ({ 
  buildingData, 
  hazards, 
  selectedStart, 
  onNodeClick,
  routePath
}) => {
  if (!buildingData) return null;

  const { nodes, edges } = buildingData;
  const { blockedNodes, blockedEdges, closedExits } = hazards;
  
  // Create a quick lookup for nodes
  const nodeMap = {};
  nodes.forEach(n => nodeMap[n.id] = n);

  // Check if an edge is part of the route
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

  // Find boundaries to viewBox
  const padding = 50;
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

  return (
    <svg className="svg-map" viewBox={viewBox}>
      {/* Edges Layer */}
      {edges.map(edge => {
        const fromNode = nodeMap[edge.from];
        const toNode = nodeMap[edge.to];
        if (!fromNode || !toNode) return null;

        const isBlocked = blockedEdges.includes(edge.id);
        const inRoute = isEdgeInRoute(edge.from, edge.to);
        
        let edgeClass = "edge";
        if (isBlocked) edgeClass += " edge-blocked";
        if (inRoute) edgeClass += " edge-route";

        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;

        return (
          <g key={edge.id}>
            <line 
              x1={fromNode.x} 
              y1={fromNode.y} 
              x2={toNode.x} 
              y2={toNode.y} 
              className={edgeClass}
            />
            {/* Edge Cost */}
            <rect 
              x={midX - 10} 
              y={midY - 10} 
              width="20" 
              height="20" 
              className="edge-cost-bg" 
            />
            <text x={midX} y={midY} className="edge-cost">
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

        let nodeClass = `node node-${node.type}`;
        if (isBlocked) nodeClass += " node-blocked";
        if (isClosed && node.type === 'exit') nodeClass += " node-closed";
        if (isSelected) nodeClass += " node-selected";
        if (inRoute) nodeClass += " node-route";

        return (
          <g 
            key={node.id} 
            transform={`translate(${node.x}, ${node.y})`}
            onClick={() => onNodeClick(node)}
            className={nodeClass}
          >
            {node.type === 'room' && <circle r="18" />}
            {node.type === 'junction' && (
              <polygon points="0,-18 18,0 0,18 -18,0" />
            )}
            {node.type === 'exit' && (
              <rect x="-16" y="-16" width="32" height="32" rx="4" ry="4" />
            )}
            <text className="node-label">{node.id}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default BuildingMap;
