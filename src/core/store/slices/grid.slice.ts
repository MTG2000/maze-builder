import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { Tile } from 'src/core/models/Tile';
import { Position } from 'models/Position';
import { Tools } from 'src/core/models/Tools';
import { Tile, Tiles } from 'src/core/models/Tile';

import {
  toolToTile,
  toolToTileEffect,
  isEffectAppliable,
} from 'src/core/services/ToolBox';
// import { Position } from 'models/Position';

type GridState = {
  grid: (Tile | null)[];
  dimension: number;
};

const defaultGridDimension = 8;

let initialState: GridState = {
  dimension: defaultGridDimension,
  grid: new Array(defaultGridDimension * defaultGridDimension).fill({
    type: Tiles.Sea,
  }),
};

const gridSlice = createSlice({
  name: 'grid',
  initialState,
  reducers: {
    setDimension(state, action: PayloadAction<number>) {
      const newDimension = action.payload;
      if (newDimension > 5 && newDimension < 12) {
        state.dimension = newDimension;
        state.grid = new Array(newDimension * newDimension).fill({
          type: Tiles.Sea,
        });
      }
    },
    setTile(
      state,
      action: PayloadAction<Position> & PayloadAction<{ selectedTool: Tools }>,
    ) {
      const { index, selectedTool } = action.payload;
      let tile = state.grid[index];
      const newTile = toolToTile(selectedTool);
      const newEffect = toolToTileEffect(selectedTool);
      // If eraser => remove tile
      if (selectedTool === Tools.Eraser) state.grid[index] = null;
      // if tiles => build tile
      else if (newTile) {
        state.grid[index] = { type: newTile, effect: null };
      }
      // if effect => check for compatibility then add it
      else if (newEffect && isEffectAppliable(tile, newEffect)) {
        state.grid[index] = { ...(tile as any), effect: newEffect };
      }
    },
  },
});

export const { setTile } = gridSlice.actions;

export default gridSlice.reducer;
