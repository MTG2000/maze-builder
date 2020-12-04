import {combineReducers} from "../../../web_modules/@reduxjs/toolkit.js";
import gridReducer from "./slices/grid.slice.js";
import toolboxReducer from "./slices/toolbox.slice.js";
const rootReducer = combineReducers({
  grid: gridReducer,
  toolBox: toolboxReducer
});
export default rootReducer;
