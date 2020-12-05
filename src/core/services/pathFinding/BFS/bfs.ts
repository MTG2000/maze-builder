import Graph from './graph';
import Queue from './Queue';

export function bfs(graph: Graph, startVertex: number, endVertex: number) {
  let path = [];
  // let edgesExplored = [];
  let vertexQueue = new Queue<number>();
  let visitedVertices = new Set();
  visitedVertices.add(startVertex);
  vertexQueue.enqueue(startVertex);
  let parentMap = new Array(graph.vertexCount);
  let pathFound = false;
  while (!vertexQueue.empty()) {
    const currentVertex = vertexQueue.dequeue();
    console.log(currentVertex);

    if (currentVertex === endVertex) {
      pathFound = true;
      break;
    }
    const incidentEdges = graph.getIncidentEdges(currentVertex as number);

    incidentEdges.forEach((edge) => {
      //   edgesExplored.push(edge);
      if (!visitedVertices.has(edge.second)) {
        visitedVertices.add(edge.second);
        vertexQueue.enqueue(edge.second);
        parentMap[edge.second] = currentVertex;
      }
    });
  }

  if (!pathFound) return null;

  let current = endVertex;
  while (current !== startVertex) {
    path.push(current);
    current = parentMap[current];
  }
  path.push(startVertex);
  return {
    path: path.reverse(),
    //edgesExplored: edgesExplored
  };
}
