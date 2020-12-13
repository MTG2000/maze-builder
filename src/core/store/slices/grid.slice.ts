import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { Tile } from 'src/core/models/Tile';
import { Position } from 'models/Position';
import { Tools } from 'src/core/models/Tools';
import { Tile, Tiles, TileEffects } from 'src/core/models/Tile';

import {
  toolToTile,
  toolToTileEffect,
  isEffectAppliable,
} from 'src/core/services/ToolBox';
import { isNullOrUndefined } from 'util';
import { getInitialGrid, getInitialFlags } from '../helpers/initialGrid';
// import { Position } from 'models/Position';

type GridState = {
  grid: (Tile | null)[];
  dimension: number;
  showBorders: boolean;
  flagsIndecies: number[];
  path: { [key: number]: boolean };
};

const defaultGridDimension = 8;
const seaTile: Tile = { type: Tiles.Sea, effect: null };
const groundTile: Tile = { type: Tiles.Ground, effect: null };

let initialState: GridState = {
  dimension: defaultGridDimension,
  grid: getInitialGrid({
    groundTile,
    seaTile,
    dimension: defaultGridDimension,
  }),
  showBorders: false,
  flagsIndecies: getInitialFlags(),
  path: {},
};

const gridSlice = createSlice({
  name: 'grid',
  initialState,
  reducers: {
    /*
     * Set The Dimensions of the Grid
     */
    setDimension(state, action: PayloadAction<number>) {
      state.path = {};
      state.flagsIndecies = [-1, -1];
      const newDimension = action.payload;
      if (newDimension >= 5 && newDimension <= 12) {
        state.dimension = newDimension;
        state.grid = new Array(newDimension * newDimension).fill({
          type: Tiles.Sea,
        });
      }
    },
    /*
     * Whether Or Not To Show the Grid Borders
     */
    setShowBorders(state, action: PayloadAction<boolean>) {
      state.showBorders = action.payload;
    },

    /*
     * Set something on a Tile according to the selectedTool
     */
    setTile(
      state,
      action: PayloadAction<Position> & PayloadAction<{ selectedTool: Tools }>,
    ) {
      state.path = {};

      const { index, selectedTool } = action.payload;
      let tile = state.grid[index];

      const newTile = toolToTile(selectedTool);
      const newEffect = toolToTileEffect(selectedTool);

      if (selectedTool === Tools.Eraser) {
        if (tile?.effect) {
          if (tile.effect === TileEffects.Flag)
            state.flagsIndecies[state.flagsIndecies[0] === index ? 0 : 1] = -1;
          state.grid[index] = { ...tile, effect: null };
        } else state.grid[index] = seaTile;
      } else if (newTile) {
        state.grid[index] = { type: newTile, effect: null };
      } else if (newEffect && isEffectAppliable(tile, newEffect)) {
        // If Flag, then remove the oldest of the 2 flags then add new one
        if (newEffect === TileEffects.Flag) {
          //A Flag Already Exist Here
          if (
            state.flagsIndecies[0] === index ||
            state.flagsIndecies[1] === index
          )
            return;
          const indexToRemoveFlag = state.flagsIndecies[1];
          if (indexToRemoveFlag !== -1)
            state.grid[indexToRemoveFlag] = {
              ...(state.grid[indexToRemoveFlag] as Tile),
              effect: null,
            };
          state.flagsIndecies = [index, state.flagsIndecies[0]];
        }
        state.grid[index] = { ...(tile as any), effect: newEffect };
      }
    },
    /*
     * Set the correct Path from an indecies array
     */
    setPath(state, action: PayloadAction<number[]>) {
      state.path = {};
      for (const step of action.payload) {
        state.path[step] = true;
      }
    },
  },
});

export const {
  setTile,
  setDimension,
  setShowBorders,
  setPath,
} = gridSlice.actions;

export default gridSlice.reducer;
