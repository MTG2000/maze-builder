import {parseGridTo2DArray} from "./parser.js";
import Graph from "./graph.js";
import {bfs as bfs2} from "./bfs.js";
export async function findPath(grid, start, end, dimension) {
  const girdArray = parseGridTo2DArray(grid);
  const graph2 = new Graph(dimension, dimension);
  graph2.buildFrom2DArray(girdArray, dimension);
  return bfs2(graph2, start, end);
}
