import React from "../../../web_modules/react.js";
import styled from "../../../web_modules/styled-components.js";
import Grid2 from "../Grid/Grid.js";
import ToolBox2 from "../ToolBox/ToolBox.js";
const Root = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 120px;
  background: linear-gradient(0deg, #503185, #43164a); ;
`;
function Canvas({}) {
  return /* @__PURE__ */ React.createElement(Root, null, /* @__PURE__ */ React.createElement(Grid2, null), /* @__PURE__ */ React.createElement(ToolBox2, null));
}
export default Canvas;
