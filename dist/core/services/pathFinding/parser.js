import {Tiles, TileEffects} from "../../models/Tile.js";
export function parseGridTo2DArray(grid) {
  return grid.map((tile) => {
    if (tile?.type !== Tiles.Ground || tile.effect === TileEffects.Hole)
      return 0;
    if (tile.effect === TileEffects.Portal)
      return 8;
    return 1;
  });
}
