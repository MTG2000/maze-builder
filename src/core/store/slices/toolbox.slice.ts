import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tools } from 'src/core/models/Tools';

type toolboxState = {
  selectedTool?: Tools;
};

let initialState: toolboxState = {
  selectedTool: Tools.GroundTile,
};

const toolboxSlice = createSlice({
  name: 'toolbox',
  initialState,
  reducers: {
    setSelectedTool(state, action: PayloadAction<Tools>) {
      state.selectedTool = action.payload;
    },
  },
});

export const { setSelectedTool } = toolboxSlice.actions;

export default toolboxSlice.reducer;
