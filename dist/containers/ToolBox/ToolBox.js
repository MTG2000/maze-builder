import React from "../../../web_modules/react.js";
import {useDispatch, useSelector} from "../../../web_modules/react-redux.js";
import {setSelectedTool} from "../../core/store/slices/toolbox.slice.js";
import Tool2 from "./components/Tool/Tool.js";
import {Tools as Tools2} from "../../core/models/Tools.js";
import {Root} from "./style.js";
import {RovingTabIndexProvider} from "../../../web_modules/react-roving-tabindex.js";
import groundImg from "../../assets/tile-ground.png.proxy.js";
import waterImg from "../../assets/tile-water.png.proxy.js";
import portalImg from "../../assets/portal.png.proxy.js";
import flagImg from "../../assets/flag.png.proxy.js";
import holeImg from "../../assets/hole.png.proxy.js";
import eraserImg from "../../assets/eraser.png.proxy.js";
const tools = [
  {title: "Ground Piece", tool: Tools2.GroundTile, img: groundImg},
  {title: "Water Piece", tool: Tools2.SeaTile, img: waterImg},
  {title: "Portal", tool: Tools2.Portal, img: portalImg},
  {title: "Hole", tool: Tools2.Hole, img: holeImg},
  {title: "Start/End Flags", tool: Tools2.Flag, img: flagImg},
  {title: "Eraser", tool: Tools2.Eraser, img: eraserImg}
];
function ToolBox({}) {
  const dispatch = useDispatch();
  const selectedTool = useSelector((state) => state.toolBox.selectedTool);
  return /* @__PURE__ */ React.createElement(RovingTabIndexProvider, {
    options: {direction: "both"}
  }, /* @__PURE__ */ React.createElement(Root, {
    role: "toolbox"
  }, tools.map((tool, index) => /* @__PURE__ */ React.createElement("div", {
    className: "tool",
    key: index
  }, /* @__PURE__ */ React.createElement(Tool2, {
    title: tool.title,
    img: tool.img,
    isSelected: tool.tool === selectedTool,
    onSelect: () => dispatch(setSelectedTool(tool.tool))
  })))));
}
export default ToolBox;
