import { Tile, TileEffects } from 'src/core/models/Tile';
import { isNullOrUndefined } from 'util';
import { Tools } from 'src/core/models/Tools';
import {
  isEffectAppliable,
  toolToTileEffect,
  toolToTile,
} from 'src/core/services/ToolBox';

export enum HoverColors {
  Remove,
  Add,
  Prevented,
}

export function getHoverColor(gridTile: Tile | null, selectedTool?: Tools) {
  if (isNullOrUndefined(selectedTool)) return;

  if (selectedTool === Tools.Eraser) return HoverColors.Remove;
  else if (toolToTile(selectedTool)) {
    return HoverColors.Add;
  } else if (
    toolToTileEffect(selectedTool) &&
    isEffectAppliable(gridTile, toolToTileEffect(selectedTool) as TileEffects)
  )
    return HoverColors.Add;
  else return HoverColors.Prevented;
}
