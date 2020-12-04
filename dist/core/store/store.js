import {configureStore} from "../../../web_modules/@reduxjs/toolkit.js";
import rootReducer2 from "./rootReducer.js";
const store = configureStore({
  reducer: rootReducer2
});
export default store;
