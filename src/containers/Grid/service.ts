import { Tile, TileEffects } from 'src/core/models/Tile';
import { isNullOrUndefined } from 'util';
import { Tools } from 'src/core/models/Tools';
import {
  isEffectAppliable,
  toolToTileEffect,
  toolToTile,
} from 'src/core/services/ToolBox';

export enum HoverStates {
  Remove,
  Add,
  Prevented,
}

export function getHoverState(gridTile: Tile | null, selectedTool?: Tools) {
  if (isNullOrUndefined(selectedTool)) return;

  if (selectedTool === Tools.Eraser) return HoverStates.Remove;
  else if (toolToTile(selectedTool)) {
    return HoverStates.Add;
  } else if (
    toolToTileEffect(selectedTool) &&
    isEffectAppliable(gridTile, toolToTileEffect(selectedTool) as TileEffects)
  )
    return HoverStates.Add;
  else return HoverStates.Prevented;
}
