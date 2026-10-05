export const validateBuildingData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON format.');
  }

  if (!data.building || typeof data.building !== 'string' || data.building.trim() === '') {
    throw new Error('Building name is missing or invalid.');
  }

  if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
    throw new Error('Nodes array is missing or empty.');
  }

  const nodeIds = new Set();
  const exitIds = new Set();
  data.nodes.forEach((node, index) => {
    if (!node.id || typeof node.id !== 'string') throw new Error(`Node at index ${index} has invalid or missing id.`);
    if (nodeIds.has(node.id)) throw new Error(`Duplicate node id: ${node.id}`);
    nodeIds.add(node.id);

    if (!node.label || typeof node.label !== 'string') throw new Error(`Node ${node.id} has invalid or missing label.`);
    if (!['room', 'junction', 'exit'].includes(node.type)) throw new Error(`Node ${node.id} has invalid type: ${node.type}`);
    if (typeof node.x !== 'number' || typeof node.y !== 'number') throw new Error(`Node ${node.id} has invalid coordinates.`);
    
    if (node.type === 'exit') {
      exitIds.add(node.id);
    }
  });

  if (!Array.isArray(data.edges) || data.edges.length === 0) {
    throw new Error('Edges array is missing or empty.');
  }

  const edgeIds = new Set();
  const nodePairs = new Set();

  data.edges.forEach((edge, index) => {
    if (!edge.id || typeof edge.id !== 'string') throw new Error(`Edge at index ${index} has invalid or missing id.`);
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate edge id: ${edge.id}`);
    edgeIds.add(edge.id);

    if (!edge.from || !edge.to || !nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error(`Edge ${edge.id} references invalid nodes.`);
    }

    if (edge.from === edge.to) {
      throw new Error(`Edge ${edge.id} is a self-loop.`);
    }

    if (typeof edge.cost !== 'number' || edge.cost <= 0 || !Number.isInteger(edge.cost)) {
      throw new Error(`Edge ${edge.id} has invalid cost.`);
    }

    // Undirected graph pair validation
    const pair = [edge.from, edge.to].sort().join('-');
    if (nodePairs.has(pair)) {
      throw new Error(`Duplicate edge between ${edge.from} and ${edge.to}`);
    }
    nodePairs.add(pair);
  });

  if (!data.initial_state || typeof data.initial_state !== 'object') {
    throw new Error('Initial state is missing.');
  }

  const { blocked_nodes, blocked_edges, closed_exits } = data.initial_state;
  if (!Array.isArray(blocked_nodes) || !Array.isArray(blocked_edges) || !Array.isArray(closed_exits)) {
    throw new Error('Initial state arrays are missing or invalid.');
  }

  blocked_nodes.forEach(id => {
    if (!nodeIds.has(id)) throw new Error(`Initial state blocked_node references invalid node: ${id}`);
    const node = data.nodes.find(n => n.id === id);
    if (node.type === 'exit') throw new Error(`Initial state blocked_node cannot be an exit: ${id}`);
  });

  blocked_edges.forEach(id => {
    if (!edgeIds.has(id)) throw new Error(`Initial state blocked_edge references invalid edge: ${id}`);
  });

  closed_exits.forEach(id => {
    if (!exitIds.has(id)) throw new Error(`Initial state closed_exit references invalid exit: ${id}`);
  });

  return true;
};
