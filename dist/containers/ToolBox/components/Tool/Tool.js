import React from "../../../../../web_modules/react.js";
import {Root} from "./style.js";
function Tool({img, title, onSelect, isSelected}) {
  return /* @__PURE__ */ React.createElement(Root, {
    className: `tooltip ${isSelected ? "active" : ""}`,
    onClick: () => {
      onSelect();
    }
  }, /* @__PURE__ */ React.createElement("span", {
    className: "tooltiptext"
  }, title), /* @__PURE__ */ React.createElement("img", {
    src: img,
    alt: title
  }));
}
export default Tool;
