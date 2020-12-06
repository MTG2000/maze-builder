import { Tile, TileEffects } from 'src/core/models/Tile';
import { isNullOrUndefined } from 'util';

export function getInitialGrid({
  groundTile,
  seaTile,
  dimension,
}: {
  groundTile: Tile;
  seaTile: Tile;
  dimension: number;
}) {
  const initialGridTiles: { [key: number]: Tile } = {
    0: { ...groundTile, effect: TileEffects.Flag },
    8: groundTile,
    16: groundTile,
    17: { ...groundTile, effect: TileEffects.Portal },
    23: { ...groundTile, effect: TileEffects.Portal },
    31: groundTile,
    39: groundTile,
    47: { ...groundTile, effect: TileEffects.Flag },
  };

  let grid = new Array(dimension * dimension).fill(null);
  grid = grid.map((_, index) =>
    isNullOrUndefined(initialGridTiles[index])
      ? seaTile
      : initialGridTiles[index],
  );
  return grid;
}

export function getInitialFlags() {
  return [0, 47];
}
