import {isNullOrUndefined} from "../../../web_modules/util.js";
import {Tools as Tools2} from "../../core/models/Tools.js";
import {
  isEffectAppliable,
  toolToTileEffect,
  toolToTile
} from "../../core/services/ToolBox.js";
export var HoverColors;
(function(HoverColors2) {
  HoverColors2[HoverColors2["Remove"] = 0] = "Remove";
  HoverColors2[HoverColors2["Add"] = 1] = "Add";
  HoverColors2[HoverColors2["Prevented"] = 2] = "Prevented";
})(HoverColors || (HoverColors = {}));
export function getHoverColor(gridTile, selectedTool) {
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
