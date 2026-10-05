export const calculateShortestPath = (data, startNodeId, hazards) => {
  const { nodes, edges } = data;
  const { blockedNodes, blockedEdges, closedExits } = hazards;

  // If start is blocked, return no route
  if (blockedNodes.includes(startNodeId)) {
    return { path: null, cost: null, error: 'blockedStart' };
  }

  // Build graph
  const graph = {};
  nodes.forEach(n => {
    if (!blockedNodes.includes(n.id)) {
      graph[n.id] = [];
    }
  });

  edges.forEach(e => {
    if (!blockedEdges.includes(e.id)) {
      const fromBlocked = blockedNodes.includes(e.from);
      const toBlocked = blockedNodes.includes(e.to);
      if (!fromBlocked && !toBlocked) {
        if (graph[e.from]) graph[e.from].push({ to: e.to, cost: e.cost });
        if (graph[e.to]) graph[e.to].push({ to: e.from, cost: e.cost }); // Undirected
      }
    }
  });

  const exits = nodes.filter(n => n.type === 'exit' && !closedExits.includes(n.id) && !blockedNodes.includes(n.id)).map(n => n.id);
  
  if (exits.length === 0) {
    return { path: null, cost: null, error: 'noRoute' };
  }

  // Dijkstra state
  const distances = {};
  const paths = {};
  nodes.forEach(n => {
    distances[n.id] = Infinity;
    paths[n.id] = [];
  });

  distances[startNodeId] = 0;
  paths[startNodeId] = [startNodeId];

  const unvisited = new Set(Object.keys(graph));

  while (unvisited.size > 0) {
    // Find min distance unvisited node
    let current = null;
    let minDistance = Infinity;
    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      } else if (distances[node] === minDistance && minDistance !== Infinity) {
        // Tie break unvisited nodes? Standard Dijkstra doesn't strictly need this for correctness of shortest path,
        // but let's break ties by path sequence just in case to ensure deterministic expansion.
        const pathA = paths[node].join('-');
        const pathB = paths[current].join('-');
        if (pathA < pathB) {
          current = node;
        }
      }
    }

    if (current === null) break; // All remaining are unreachable
    unvisited.delete(current);

    if (graph[current]) {
      for (const neighbor of graph[current]) {
        if (!unvisited.has(neighbor.to)) continue;
        
        const newDistance = distances[current] + neighbor.cost;
        const newPath = [...paths[current], neighbor.to];
        
        if (newDistance < distances[neighbor.to]) {
          distances[neighbor.to] = newDistance;
          paths[neighbor.to] = newPath;
        } else if (newDistance === distances[neighbor.to]) {
          // Tie breaking: path string comparison
          const currentPathStr = paths[neighbor.to].join('-');
          const newPathStr = newPath.join('-');
          if (newPathStr < currentPathStr) {
            paths[neighbor.to] = newPath;
          }
        }
      }
    }
  }

  // Find best exit
  let bestExit = null;
  let bestCost = Infinity;
  let bestPath = null;

  for (const exitId of exits) {
    if (distances[exitId] < bestCost) {
      bestCost = distances[exitId];
      bestExit = exitId;
      bestPath = paths[exitId];
    } else if (distances[exitId] === bestCost && bestCost !== Infinity) {
      // Tie-breaking: lowest exit ID first
      if (exitId < bestExit) {
        bestExit = exitId;
        bestPath = paths[exitId];
      } else if (exitId === bestExit) {
        // Same exit ID, lexicographically smaller node ID sequence
        const pathA = paths[exitId].join('-');
        const pathB = bestPath.join('-');
        if (pathA < pathB) {
          bestPath = paths[exitId];
        }
      }
    }
  }

  if (bestExit === null || bestCost === Infinity) {
    return { path: null, cost: null, error: 'noRoute' };
  }

  return { path: bestPath, cost: bestCost, error: null };
};
