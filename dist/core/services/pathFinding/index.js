import {parseGridTo2DArray} from "./parser.js";
import Graph from "./BFS/graph.js";
import {bfs as bfs2} from "./BFS/bfs.js";
export async function findPath(grid, start, end, dimension, accuracy = 1) {
  const girdArray = parseGridTo2DArray(grid);
  return useBFS(girdArray, start, end, dimension);
}
function useBFS(girdArray, start, end, dimension) {
  const graph2 = new Graph(dimension, dimension);
  graph2.buildFrom2DArray(girdArray, dimension);
  return bfs2(graph2, start, end);
}
