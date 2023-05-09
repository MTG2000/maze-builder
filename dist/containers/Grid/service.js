import {isNullOrUndefined} from "../../../web_modules/util.js";
import {Tools as Tools2} from "../../core/models/Tools.js";
import {
  isEffectAppliable,
  toolToTileEffect,
  toolToTile
} from "../../core/services/ToolBox.js";
export var HoverStates;
(function(HoverStates2) {
  HoverStates2[HoverStates2["Remove"] = 0] = "Remove";
  HoverStates2[HoverStates2["Add"] = 1] = "Add";
  HoverStates2[HoverStates2["Prevented"] = 2] = "Prevented";
})(HoverStates || (HoverStates = {}));
export function getHoverState(gridTile, selectedTool) {
  if (isNullOrUndefined(selectedTool))
    return;
  if (selectedTool === Tools2.Eraser)
    return 0;
  else if (toolToTile(selectedTool)) {
    return 1;
  } else if (toolToTileEffect(selectedTool) && isEffectAppliable(gridTile, toolToTileEffect(selectedTool)))
    return 1;
  else
    return 2;
}
