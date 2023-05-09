import {createSlice} from "../../../../web_modules/@reduxjs/toolkit.js";
import {Tools as Tools2} from "../../models/Tools.js";
let initialState = {
  selectedTool: Tools2.GroundTile
};
const toolboxSlice = createSlice({
  name: "toolbox",
  initialState,
  reducers: {
    setSelectedTool(state, action) {
      state.selectedTool = action.payload;
    }
  }
});
export const {setSelectedTool} = toolboxSlice.actions;
export default toolboxSlice.reducer;
