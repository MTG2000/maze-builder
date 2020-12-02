import { Tile } from 'src/core/models/Tile';
import { parseGridTo2DArray } from './parser';
import Graph from './graph';
import { bfs } from './bfs';

export async function findPath(
  grid: (Tile | null)[],
  start: number,
  end: number,
  dimension: number,
) {
  const girdArray = parseGridTo2DArray(grid);
  const graph = new Graph(dimension, dimension);
  graph.buildFrom2DArray(girdArray, dimension);
  return bfs(graph, start, end);
}
