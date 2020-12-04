import {createSlice} from "../../../../web_modules/@reduxjs/toolkit.js";
let initialState = {
  selectedTool: void 0
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
