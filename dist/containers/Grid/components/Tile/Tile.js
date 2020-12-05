import React, {useEffect, useRef} from "../../../../../web_modules/react.js";
import {Tiles, TileEffects} from "../../../../core/models/Tile.js";
import {HoverColors} from "../../service.js";
import groundImg from "../../../../assets/ground-tile.png.proxy.js";
import waterImg from "../../../../assets/water-tile.png.proxy.js";
import portalImg from "../../../../assets/portal.png.proxy.js";
import flagImg from "../../../../assets/flag.png.proxy.js";
import holeImg from "../../../../assets/hole.png.proxy.js";
import {isNullOrUndefined} from "../../../../../web_modules/util.js";
import {Root} from "./style.js";
function Tile2({
  index,
  tile,
  isHovering,
  isPath,
  hoverColor,
  onHover,
  onClick
}) {
  const ref = useRef(null);
  useEffect(() => {
    const hoverHandler = () => {
      onHover(index);
    };
    const clickHandler = () => {
      onClick(index);
    };
    ref.current?.addEventListener("mouseenter", hoverHandler);
    ref.current?.addEventListener("mousedown", clickHandler);
    return () => {
      ref.current?.removeEventListener("mouseenter", hoverHandler);
      ref.current?.removeEventListener("mousedown", clickHandler);
    };
  }, []);
  let color = "transparent";
  let cursor = "cell";
  if (isHovering) {
    if (hoverColor === HoverColors.Add)
      color = "#4caf50";
    else if (hoverColor === HoverColors.Remove)
      color = "#f6392b";
    else if (hoverColor === HoverColors.Prevented) {
      color = "#9e9e9e";
      cursor = "not-allowed";
    }
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
  return /* @__PURE__ */ React.createElement(Root, {
    color,
    cursor,
    ref,
    "data-testid": "tile"
  }, tile && /* @__PURE__ */ React.createElement("img", {
    className: "tile-img",
    src: tileImg,
    alt: ""
  }), tile?.effect && /* @__PURE__ */ React.createElement("img", {
    className: "effect-img",
    src: effectImg,
    alt: ""
  }), isPath && /* @__PURE__ */ React.createElement("span", {
    className: "path"
  }));
}
export default Tile2;
