import { Tools } from '../models/Tools';
import { Tiles, TileEffects, Tile } from '../models/Tile';

export const toolToTile = (currentTool: Tools) => {
  switch (currentTool) {
    case Tools.GroundTile:
      return Tiles.Ground;
    case Tools.SeaTile:
      return Tiles.Sea;
  }
};

export const toolToTileEffect = (currentTool: Tools) => {
  switch (currentTool) {
    case Tools.Portal:
      return TileEffects.Portal;
    case Tools.Flag:
      return TileEffects.Flag;
    case Tools.Hole:
      return TileEffects.Hole;
  }
};

export const isEffectAppliable = (
  tile: Tile | null,
  effect: TileEffects,
): boolean => {
  if (!tile) return false;
  if (tile.type === Tiles.Ground && effect === TileEffects.Hole) return true;
  if (tile.type === Tiles.Ground && effect === TileEffects.Portal) return true;
  if (tile.type === Tiles.Ground && effect === TileEffects.Flag) return true;
  return false;
};
