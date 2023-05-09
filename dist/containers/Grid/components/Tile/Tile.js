import React, {useEffect, useRef} from "../../../../../web_modules/react.js";
import {Tiles, TileEffects} from "../../../../core/models/Tile.js";
import {HoverStates, getHoverState} from "../../service.js";
import groundImg from "../../../../assets/ground-tile.png.proxy.js";
import waterImg from "../../../../assets/water-tile.png.proxy.js";
import portalImg from "../../../../assets/portal.png.proxy.js";
import flagImg from "../../../../assets/flag.png.proxy.js";
import holeImg from "../../../../assets/hole.png.proxy.js";
import {isNullOrUndefined} from "../../../../../web_modules/util.js";
import {Root} from "./style.js";
import {useSelector} from "../../../../../web_modules/react-redux.js";
import {useFocusEffect, useRovingTabIndex} from "../../../../../web_modules/react-roving-tabindex.js";
function Tile2({
  index,
  tile,
  isPath,
  gridRow,
  gridColumn,
  onHover,
  onClick
}) {
  const ref = useRef(null);
  const selectedTool = useSelector((state) => state.toolBox.selectedTool);
  const hoverState = getHoverState(tile, selectedTool);
  useEffect(() => {
    const hoverHandler = () => {
      onHover(index);
    };
    const clickHandler = () => {
      onClick(index);
    };
    ref.current?.addEventListener("mouseenter", hoverHandler);
    return () => {
      ref.current?.removeEventListener("mouseenter", hoverHandler);
    };
  }, []);
  const [tabIndex, focused, handleKeyDown, handleClick] = useRovingTabIndex(ref, false, gridRow);
  useFocusEffect(focused, ref);
  let hoverColor = "transparent";
  let cursor = "cell";
  if (hoverState === HoverStates.Add)
    hoverColor = "#4caf50";
  else if (hoverState === HoverStates.Remove)
    hoverColor = "#f6392b";
  else if (hoverState === HoverStates.Prevented) {
    hoverColor = "#9e9e9e";
    cursor = "not-allowed";
  }
  let tileImg;
  let effectImg;
  if (tile) {
    if (tile.type === Tiles.Ground)
      tileImg = groundImg;
    else if (tile.type === Tiles.Sea)
      tileImg = waterImg;
  }
  if (!isNullOrUndefined(tile?.effect)) {
    if (tile?.effect === TileEffects.Portal)
      effectImg = portalImg;
    else if (tile?.effect === TileEffects.Hole)
      effectImg = holeImg;
    else if (tile?.effect === TileEffects.Flag)
      effectImg = flagImg;
  }
  let tileTypeLabel = "Water";
  if (tile?.type === Tiles.Ground) {
    if (tile?.effect === TileEffects.Portal)
      tileTypeLabel = "Portal";
    else if (tile?.effect === TileEffects.Hole)
      tileTypeLabel = "Hole";
    else if (tile?.effect === TileEffects.Flag)
      tileTypeLabel = "Flag";
    else
      tileTypeLabel = "Ground";
  }
  const positionLabel = `Row ${gridRow + 1}, Column ${gridColumn + 1}`;
  return /* @__PURE__ */ React.createElement(Root, {
    hoverColor,
    cursor,
    "data-testid": "tile",
    onClick: () => {
      onClick(index);
      handleClick();
    },
    ref,
    tabIndex,
    onKeyDown: handleKeyDown
  }, /* @__PURE__ */ React.createElement("span", {
    className: "sr-only"
  }, positionLabel), tile && /* @__PURE__ */ React.createElement("img", {
    className: "tile-img",
    src: tileImg,
    alt: mapTileToLabel[tile.type]
  }), tile?.effect && /* @__PURE__ */ React.createElement("img", {
    className: "effect-img",
    src: effectImg,
    alt: mapEffectToLabel[tile.effect]
  }), isPath && /* @__PURE__ */ React.createElement("span", {
    className: "path"
  }));
}
const mapTileToLabel = {
  [Tiles.Ground]: "Ground",
  [Tiles.Sea]: "Water"
};
const mapEffectToLabel = {
  [TileEffects.Portal]: "Portal",
  [TileEffects.Hole]: "Hole",
  [TileEffects.Flag]: "Flag"
};
export default Tile2;
