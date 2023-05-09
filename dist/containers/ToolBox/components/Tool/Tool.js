import React from "../../../../../web_modules/react.js";
import {Root} from "./style.js";
import {useFocusEffect, useRovingTabIndex} from "../../../../../web_modules/react-roving-tabindex.js";
function Tool({img, title, onSelect, isSelected}) {
  const ref = React.useRef(null);
  const [tabIndex, focused, handleKeyDown, handleClick] = useRovingTabIndex(ref, false);
  useFocusEffect(focused, ref);
  return /* @__PURE__ */ React.createElement(Root, {
    className: `tooltip ${isSelected ? "active" : ""}`,
    onClick: () => {
      handleClick();
      onSelect();
    },
    ref,
    tabIndex,
    "aria-current": isSelected,
    onKeyDown: handleKeyDown
  }, /* @__PURE__ */ React.createElement("span", {
    className: "tooltiptext"
  }, title), /* @__PURE__ */ React.createElement("img", {
    src: img,
    alt: ""
  }));
}
export default Tool;
