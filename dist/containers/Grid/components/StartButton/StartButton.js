import React from "../../../../../web_modules/react.js";
import styled from "../../../../../web_modules/styled-components.js";
import {Button} from "../../../../../web_modules/@material-ui/core.js";
const Root = styled(Button)`
  position: fixed !important;
  background-color: ${(props) => props.theme.secondary};
  color: #000;
  padding: 15px 22px !important;
  top: 80%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  border: 0;
  border-radius: 13px;
  font-size: 18px !important;
  font-weight: bold !important;
  cursor: pointer;

  &:hover {
  }

  @media screen and (min-width: 992px) {
    top: 50%;
    left: unset;
    right: 100px;
    transform: none;
    font-size: 22px !important;

    padding: 17px 30px !important;
  }
`;
function StartButton({onClick}) {
  return /* @__PURE__ */ React.createElement(Root, {
    variant: "contained",
    color: "secondary",
    onClick
  }, "Start Searching \u{1F50D}");
}
export default StartButton;
