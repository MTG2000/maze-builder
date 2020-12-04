import {Tools as Tools2} from "../models/Tools.js";
import {Tiles, TileEffects} from "../models/Tile.js";
export const toolToTile = (currentTool) => {
  switch (currentTool) {
    case Tools2.GroundTile:
      return Tiles.Ground;
    case Tools2.SeaTile:
      return Tiles.Sea;
  }
};
export const toolToTileEffect = (currentTool) => {
  switch (currentTool) {
    case Tools2.Portal:
      return TileEffects.Portal;
    case Tools2.Flag:
      return TileEffects.Flag;
    case Tools2.Hole:
      return TileEffects.Hole;
  }
};
export const isEffectAppliable = (tile, effect) => {
  if (!tile)
    return false;
  if (tile.type === Tiles.Ground && effect === TileEffects.Hole)
    return true;
  if (tile.type === Tiles.Ground && effect === TileEffects.Portal)
    return true;
  if (tile.type === Tiles.Ground && effect === TileEffects.Flag)
    return true;
  return false;
};
