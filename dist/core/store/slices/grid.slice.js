import {createSlice} from "../../../../web_modules/@reduxjs/toolkit.js";
import {Tools as Tools2} from "../../models/Tools.js";
import {Tiles, TileEffects} from "../../models/Tile.js";
import {
  toolToTile,
  toolToTileEffect,
  isEffectAppliable
} from "../../services/ToolBox.js";
import {getInitialGrid, getInitialFlags} from "../helpers/initialGrid.js";
const defaultGridDimension = 8;
const seaTile = {type: Tiles.Sea, effect: null};
const groundTile = {type: Tiles.Ground, effect: null};
let initialState = {
  dimension: defaultGridDimension,
  grid: getInitialGrid({
    groundTile,
    seaTile,
    dimension: defaultGridDimension
  }),
  showBorders: false,
  flagsIndecies: getInitialFlags(),
  path: {}
};
const gridSlice = createSlice({
  name: "grid",
  initialState,
  reducers: {
    setDimension(state, action) {
      state.path = {};
      state.flagsIndecies = [-1, -1];
      const newDimension = action.payload;
      if (newDimension >= 5 && newDimension <= 12) {
        state.dimension = newDimension;
        state.grid = new Array(newDimension * newDimension).fill({
          type: Tiles.Sea
        });
      }
    },
    setShowBorders(state, action) {
      state.showBorders = action.payload;
    },
    setTile(state, action) {
      state.path = {};
      const {index, selectedTool} = action.payload;
      let tile = state.grid[index];
      const newTile = toolToTile(selectedTool);
      const newEffect = toolToTileEffect(selectedTool);
      if (selectedTool === Tools2.Eraser) {
        if (tile?.effect) {
          if (tile.effect === TileEffects.Flag)
            state.flagsIndecies[state.flagsIndecies[0] === index ? 0 : 1] = -1;
          state.grid[index] = {...tile, effect: null};
        } else
          state.grid[index] = seaTile;
      } else if (newTile) {
        state.grid[index] = {type: newTile, effect: null};
      } else if (newEffect && isEffectAppliable(tile, newEffect)) {
        if (newEffect === TileEffects.Flag) {
          if (state.flagsIndecies[0] === index || state.flagsIndecies[1] === index)
            return;
          const indexToRemoveFlag = state.flagsIndecies[1];
          if (indexToRemoveFlag !== -1)
            state.grid[indexToRemoveFlag] = {
              ...state.grid[indexToRemoveFlag],
              effect: null
            };
          state.flagsIndecies = [index, state.flagsIndecies[0]];
        }
        state.grid[index] = {...tile, effect: newEffect};
      }
    },
    setPath(state, action) {
      state.path = {};
      for (const step of action.payload) {
        state.path[step] = true;
      }
    }
  }
});
export const {
  setTile,
  setDimension,
  setShowBorders,
  setPath
} = gridSlice.actions;
export default gridSlice.reducer;
