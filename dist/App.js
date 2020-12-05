import React from "../web_modules/react.js";
import Canvas2 from "./containers/Canvas/Canvas.js";
import {ThemeProvider} from "../web_modules/styled-components.js";
import {theme as theme2} from "./core/theme/index.js";
import {theme as muiTheme} from "./core/theme/material-ui.js";
import {Provider} from "../web_modules/react-redux.js";
import store2 from "./core/store/store.js";
import Header2 from "./containers/Header/Header.js";
import Settings2 from "./containers/Settings/Settings.js";
import {ThemeProvider as MuiThemeProvider} from "../web_modules/@material-ui/core/styles.js";
import "./App.css.proxy.js";
function App2({}) {
  return /* @__PURE__ */ React.createElement("div", {
    id: "app"
  }, /* @__PURE__ */ React.createElement(ThemeProvider, {
    theme: theme2
  }, /* @__PURE__ */ React.createElement(MuiThemeProvider, {
    theme: muiTheme
  }, /* @__PURE__ */ React.createElement(Provider, {
    store: store2
  }, /* @__PURE__ */ React.createElement(Header2, null), /* @__PURE__ */ React.createElement(Canvas2, null), /* @__PURE__ */ React.createElement(Settings2, null)))));
}
export default App2;
