import Queue2 from "./Queue.js";
export function bfs(graph2, startVertex, endVertex) {
  let path = [];
  let vertexQueue = new Queue2();
  let visitedVertices = new Set();
  visitedVertices.add(startVertex);
  vertexQueue.enqueue(startVertex);
  let parentMap = new Array(graph2.vertexCount);
  let pathFound = false;
  while (!vertexQueue.empty()) {
    const currentVertex = vertexQueue.dequeue();
    console.log(currentVertex);
    if (currentVertex === endVertex) {
      pathFound = true;
      break;
    }
    const incidentEdges = graph2.getIncidentEdges(currentVertex);
    incidentEdges.forEach((edge) => {
      if (!visitedVertices.has(edge.second)) {
        visitedVertices.add(edge.second);
        vertexQueue.enqueue(edge.second);
        parentMap[edge.second] = currentVertex;
      }
    });
  }
  if (!pathFound)
    return null;
  let current = endVertex;
  while (current !== startVertex) {
    path.push(current);
    current = parentMap[current];
  }
  path.push(startVertex);
  return {
    path: path.reverse()
  };
}
