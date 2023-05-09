import React, {useState, useEffect, useRef} from "../../../web_modules/react.js";
import {useSelector, useDispatch} from "../../../web_modules/react-redux.js";
import TileComponent from "./components/Tile/Tile.js";
import {getHoverState} from "./service.js";
import {setTile, setPath} from "../../core/store/slices/grid.slice.js";
import {isNullOrUndefined} from "../../../web_modules/util.js";
import {Root} from "./style.js";
import StartButton2 from "./components/StartButton/StartButton.js";
import {findPath} from "../../core/services/pathFinding/index.js";
import {RovingTabIndexProvider} from "../../../web_modules/react-roving-tabindex.js";
function Grid({}) {
  const [tileHoveringOn, setTileHoveringOn] = useState(-1);
  const [searching, setSearching] = useState(false);
  const dispatch = useDispatch();
  const {dimension, grid: grid2, showBorders, path, flagsIndecies} = useSelector((state) => state.grid);
  const canStartSearch = flagsIndecies[0] !== -1 && flagsIndecies[1] !== -1;
  const selectedTool = useSelector((state) => state.toolBox.selectedTool);
  const ref = useRef(null);
  const selectedToolRef = useRef(selectedTool);
  useEffect(() => {
    const handler = () => {
      setTileHoveringOn(-1);
    };
    ref.current?.addEventListener("mouseleave", handler);
    return () => ref.current?.removeEventListener("mouseleave", handler);
  }, []);
  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);
  const gridFalttened = grid2.flat();
  let hoverState;
  if (tileHoveringOn !== -1) {
    const gridTile = gridFalttened[tileHoveringOn];
    hoverState = getHoverState(gridTile, selectedTool);
  }
  const handleTileHover = (index) => {
    setTileHoveringOn(index);
  };
  const handleTileClick = (index) => {
    if (!isNullOrUndefined(selectedToolRef.current))
      dispatch(setTile({index, selectedTool: selectedToolRef.current}));
  };
  const handleSearchStart = async () => {
    setSearching(true);
    const result = await findPath(grid2, flagsIndecies[0], flagsIndecies[1], dimension);
    if (result)
      dispatch(setPath(result.path));
    setSearching(false);
  };
  return /* @__PURE__ */ React.createElement(RovingTabIndexProvider, null, /* @__PURE__ */ React.createElement("div", {
    className: "sr-only",
    "aria-live": "assertive"
  }, "Shortest path is:", Object.keys(path).map((idx) => /* @__PURE__ */ React.createElement("span", {
    key: idx
  }, "(Row: ", Math.floor(parseInt(idx) / dimension), ", Column:", " ", parseInt(idx) % dimension, ")"))), /* @__PURE__ */ React.createElement(Root, {
    ref,
    showBorders,
    dimensions: dimension,
    role: "grid",
    "aria-label": ""
  }, gridFalttened.map((tile, index) => /* @__PURE__ */ React.createElement("div", {
    className: "tile",
    key: index
  }, /* @__PURE__ */ React.createElement(TileComponent, {
    isPath: path[index],
    hoverState,
    tile,
    index,
    onHover: handleTileHover,
    onClick: handleTileClick,
    gridRow: Math.floor(index / dimension),
    gridColumn: index % dimension
  }))), canStartSearch && /* @__PURE__ */ React.createElement(StartButton2, {
    loading: searching,
    onClick: handleSearchStart
  })));
}
export default Grid;
